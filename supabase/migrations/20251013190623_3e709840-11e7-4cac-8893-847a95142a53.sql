-- Extender RPC: suporte a update (p_contato_id) e QSA (p_qsa)
CREATE OR REPLACE FUNCTION public.criar_contato_pj_transacional(
  p_nome_fantasia TEXT,
  p_dados_pj JSONB,
  p_enderecos JSONB,
  p_meios_contato JSONB,
  p_classificacao TEXT DEFAULT 'cliente',
  p_responsavel_id UUID DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_contato_id UUID DEFAULT NULL,
  p_qsa JSONB DEFAULT '[]'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_contato_id UUID;
  v_pj_id UUID;
  v_meio_contato JSONB;
  v_endereco JSONB;
  v_etiqueta_ativo_id UUID;
  v_cnaes_array TEXT[] := NULL;
  v_empresa_id UUID;
  v_filial_id UUID;
  v_email TEXT := NULLIF(p_dados_pj->>'email', '');
  v_cpf_cnpj TEXT := NULLIF(COALESCE(p_dados_pj->>'cnpj', p_dados_pj->>'cpf_cnpj'), '');
  v_razao_social TEXT := NULLIF(p_dados_pj->>'razao_social', '');
  v_nome_fantasia TEXT := COALESCE(NULLIF(p_dados_pj->>'nome_fantasia', ''), p_nome_fantasia);
  v_natureza_juridica TEXT := NULLIF(p_dados_pj->>'natureza_juridica', '');
  v_regime_tributario TEXT := NULLIF(p_dados_pj->>'regime_tributario', '');
  v_cnae_principal TEXT := NULLIF(p_dados_pj->>'cnae_principal', '');
  v_situacao_cadastral TEXT := NULLIF(p_dados_pj->>'situacao_cadastral', '');
  v_situacao_data DATE := NULLIF(p_dados_pj->>'situacao_data', '')::date;
  v_situacao_motivo TEXT := NULLIF(p_dados_pj->>'situacao_motivo', '');
  v_capital_social NUMERIC := NULLIF(p_dados_pj->>'capital_social', '')::numeric;
  v_porte TEXT := NULLIF(p_dados_pj->>'porte', '');
  v_matriz_filial TEXT := NULLIF(p_dados_pj->>'matriz_filial', '');
  v_municipio_ibge TEXT := NULLIF(p_dados_pj->>'municipio_ibge', '');
  v_data_abertura DATE := NULLIF(p_dados_pj->>'data_abertura', '')::date;
  v_origem_dados TEXT := COALESCE(NULLIF(p_dados_pj->>'origem_dados', ''), 'manual');
  v_qsa JSONB := COALESCE(p_qsa, '[]'::jsonb);
  v_qsa_item JSONB;
  v_vinculado_id UUID;
BEGIN
  -- Definir hierarquia (com fallback seguro)
  v_empresa_id := COALESCE((current_setting('app.tenant_id', true))::uuid, auth.uid());
  v_filial_id := COALESCE(NULLIF(current_setting('app.filial_id', true), '')::uuid, v_empresa_id);

  -- Converter cnaes_secundarios de JSONB para TEXT[] quando disponível
  IF (p_dados_pj ? 'cnaes_secundarios') THEN
    SELECT ARRAY(
      SELECT jsonb_array_elements_text(COALESCE(p_dados_pj->'cnaes_secundarios', '[]'::jsonb))
    ) INTO v_cnaes_array;
  END IF;

  -- 1) Criar/atualizar contato base
  IF p_contato_id IS NULL THEN
    INSERT INTO public.contatos_v2 (
      nome_fantasia, email, cpf_cnpj, observacao, tipo_pessoa, pessoa_tipo, user_id, tenant_id
    ) VALUES (
      v_nome_fantasia, v_email, v_cpf_cnpj, p_observacao, 'juridica', COALESCE(NULLIF(p_classificacao, ''), 'cliente'), auth.uid(), auth.uid()
    ) RETURNING id INTO v_contato_id;
  ELSE
    v_contato_id := p_contato_id;
    UPDATE public.contatos_v2
      SET nome_fantasia = COALESCE(v_nome_fantasia, nome_fantasia),
          cpf_cnpj = COALESCE(v_cpf_cnpj, cpf_cnpj),
          email = COALESCE(v_email, email),
          observacao = COALESCE(p_observacao, observacao)
      WHERE id = v_contato_id;
  END IF;

  -- 2) Upsert contato_pj
  IF EXISTS (SELECT 1 FROM public.contato_pj WHERE contato_id = v_contato_id) THEN
    UPDATE public.contato_pj SET
      empresa_id = v_empresa_id,
      filial_id = v_filial_id,
      tenant_id = auth.uid(),
      razao_social = v_razao_social,
      nome_fantasia = v_nome_fantasia,
      cnpj = v_cpf_cnpj,
      data_abertura = v_data_abertura,
      natureza_juridica = v_natureza_juridica,
      regime_tributario = v_regime_tributario,
      cnae_principal = v_cnae_principal,
      cnaes_secundarios = v_cnaes_array,
      situacao_cadastral = v_situacao_cadastral,
      situacao_data = v_situacao_data,
      situacao_motivo = v_situacao_motivo,
      capital_social = v_capital_social,
      porte = v_porte,
      matriz_filial = v_matriz_filial,
      municipio_ibge = v_municipio_ibge,
      origem_dados = v_origem_dados,
      updated_at = now()
    WHERE contato_id = v_contato_id
    RETURNING id INTO v_pj_id;
  ELSE
    INSERT INTO public.contato_pj (
      contato_id, empresa_id, filial_id, tenant_id, razao_social, nome_fantasia, cnpj, data_abertura,
      natureza_juridica, regime_tributario, cnae_principal, cnaes_secundarios, situacao_cadastral, situacao_data,
      situacao_motivo, capital_social, porte, matriz_filial, municipio_ibge, origem_dados
    ) VALUES (
      v_contato_id, v_empresa_id, v_filial_id, auth.uid(), v_razao_social, v_nome_fantasia, v_cpf_cnpj, v_data_abertura,
      v_natureza_juridica, v_regime_tributario, v_cnae_principal, v_cnaes_array, v_situacao_cadastral, v_situacao_data,
      v_situacao_motivo, v_capital_social, v_porte, v_matriz_filial, v_municipio_ibge, v_origem_dados
    ) RETURNING id INTO v_pj_id;
  END IF;

  -- 3) Regravar endereços (se fornecido)
  IF jsonb_typeof(p_enderecos) = 'array' AND jsonb_array_length(p_enderecos) > 0 THEN
    DELETE FROM public.contato_enderecos WHERE contato_id = v_contato_id;
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
    LOOP
      INSERT INTO public.contato_enderecos (
        contato_id, tenant_id, empresa_id, filial_id,
        tipo, cep, logradouro, numero, complemento, bairro, cidade, uf, ibge,
        principal, origem_dados
      ) VALUES (
        v_contato_id, auth.uid(), v_empresa_id, v_filial_id,
        COALESCE(v_endereco->>'tipo', 'Principal'),
        v_endereco->>'cep',
        v_endereco->>'logradouro',
        v_endereco->>'numero',
        v_endereco->>'complemento',
        v_endereco->>'bairro',
        v_endereco->>'cidade',
        v_endereco->>'uf',
        v_endereco->>'ibge',
        COALESCE((v_endereco->>'principal')::boolean, true),
        COALESCE(v_endereco->>'origem_dados', v_origem_dados)
      );
    END LOOP;
  END IF;

  -- 4) Regravar meios de contato (se fornecido)
  IF jsonb_typeof(p_meios_contato) = 'array' AND jsonb_array_length(p_meios_contato) > 0 THEN
    DELETE FROM public.contato_meios_contato WHERE contato_id = v_contato_id;
    FOR v_meio_contato IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO public.contato_meios_contato (
        contato_id, tenant_id, empresa_id, filial_id,
        tipo, valor, principal, observacao
      ) VALUES (
        v_contato_id, auth.uid(), v_empresa_id, v_filial_id,
        v_meio_contato->>'tipo',
        v_meio_contato->>'valor',
        COALESCE((v_meio_contato->>'principal')::boolean, false),
        v_meio_contato->>'observacao'
      );
    END LOOP;
  END IF;

  -- 5) Garantir etiqueta "Ativo"
  SELECT id INTO v_etiqueta_ativo_id
  FROM public.etiquetas
  WHERE LOWER(nome) = 'ativo' AND user_id = auth.uid()
  LIMIT 1;

  IF v_etiqueta_ativo_id IS NULL THEN
    INSERT INTO public.etiquetas (nome, slug, cor, user_id, ativa)
    VALUES ('Ativo', 'ativo', '#22C55E', auth.uid(), true)
    RETURNING id INTO v_etiqueta_ativo_id;
  END IF;

  -- Evitar duplicidade
  IF NOT EXISTS (
    SELECT 1 FROM public.etiqueta_vinculos
    WHERE etiqueta_id = v_etiqueta_ativo_id AND referencia_tipo = 'contato' AND referencia_id = v_contato_id
  ) THEN
    INSERT INTO public.etiqueta_vinculos (etiqueta_id, referencia_tipo, referencia_id, user_id)
    VALUES (v_etiqueta_ativo_id, 'contato', v_contato_id, auth.uid());
  END IF;

  -- 6) QSA -> vínculos
  IF jsonb_typeof(v_qsa) = 'array' AND jsonb_array_length(v_qsa) > 0 THEN
    -- remove vínculos anteriores do tipo QSA
    DELETE FROM public.contato_vinculos
    WHERE contato_id = v_contato_id AND lower(tipo_vinculo) IN ('qsa','socio','sócio','administrador');

    FOR v_qsa_item IN SELECT * FROM jsonb_array_elements(v_qsa) LOOP
      -- criar/obter contato do sócio/administrador
      INSERT INTO public.contatos_v2 (
        nome_fantasia, tipo_pessoa, pessoa_tipo, user_id, tenant_id
      ) VALUES (
        COALESCE(v_qsa_item->>'nome', v_qsa_item->>'nome_fantasia'), 'fisica', 'socio', auth.uid(), auth.uid()
      )
      ON CONFLICT DO NOTHING;

      SELECT id INTO v_vinculado_id FROM public.contatos_v2
      WHERE tenant_id = auth.uid() AND nome_fantasia = COALESCE(v_qsa_item->>'nome', v_qsa_item->>'nome_fantasia')
      ORDER BY created_at DESC LIMIT 1;

      IF v_vinculado_id IS NOT NULL THEN
        INSERT INTO public.contato_vinculos (
          contato_id, vinculado_id, tipo_vinculo, observacao, user_id, tenant_id, empresa_id, filial_id, bidirecional
        ) VALUES (
          v_contato_id, v_vinculado_id, 'qsa', v_qsa_item->>'qual', auth.uid(), auth.uid(), v_empresa_id, v_filial_id, true
        );
      END IF;
    END LOOP;
  END IF;

  -- Auditoria
  PERFORM public.log_security_event(
    'contact_pj_upserted',
    format('Contato PJ %s: %s (CNPJ: %s)', CASE WHEN p_contato_id IS NULL THEN 'criado' ELSE 'atualizado' END, v_nome_fantasia, v_cpf_cnpj),
    jsonb_build_object('contato_id', v_contato_id, 'cnpj', v_cpf_cnpj, 'origem_dados', v_origem_dados)
  );

  RETURN jsonb_build_object('success', true, 'contato_id', v_contato_id);
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_security_event(
      'contact_pj_create_error',
      format('Erro ao criar/atualizar contato PJ: %s', SQLERRM),
      jsonb_build_object('error', SQLERRM)
    );
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;