-- Ajuste da função criar_contato_pj_transacional para corrigir erros de coluna
CREATE OR REPLACE FUNCTION public.criar_contato_pj_transacional(
  p_nome_fantasia text,
  p_dados_pj jsonb,
  p_enderecos jsonb,
  p_meios_contato jsonb,
  p_classificacao text DEFAULT 'cliente',
  p_responsavel_id uuid DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_contato_id uuid DEFAULT NULL,
  p_qsa jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id uuid;
  v_tenant_id uuid;
  v_endereco jsonb;
  v_meio jsonb;
  v_socio jsonb;
  v_etiqueta_ativo_id uuid;
  v_cnaes_array text[];
BEGIN
  v_tenant_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  -- cnaes_secundarios -> text[]
  IF p_dados_pj ? 'cnaes_secundarios' AND jsonb_typeof(p_dados_pj->'cnaes_secundarios') = 'array' THEN
    SELECT array_agg(value::text) INTO v_cnaes_array FROM jsonb_array_elements_text(p_dados_pj->'cnaes_secundarios');
  END IF;

  -- etiqueta Ativo
  SELECT id INTO v_etiqueta_ativo_id FROM etiquetas WHERE LOWER(nome) = 'ativo' LIMIT 1;

  -- upsert contato
  IF p_contato_id IS NOT NULL THEN
    UPDATE contatos_v2 SET 
      nome_fantasia = p_nome_fantasia,
      classificacao = p_classificacao,
      responsavel_id = p_responsavel_id,
      observacao = p_observacao,
      cpf_cnpj = p_dados_pj->>'cnpj',
      updated_at = now()
    WHERE id = p_contato_id;
    v_contato_id := p_contato_id;
  ELSE
    INSERT INTO contatos_v2 (
      nome_fantasia, classificacao, responsavel_id, observacao, cpf_cnpj, tenant_id, user_id
    ) VALUES (
      p_nome_fantasia, p_classificacao, p_responsavel_id, p_observacao, p_dados_pj->>'cnpj', v_tenant_id, v_tenant_id
    ) RETURNING id INTO v_contato_id;
  END IF;

  -- upsert contato_pj
  INSERT INTO contato_pj (
    contato_id, tenant_id, empresa_id, filial_id, cnpj, razao_social, nome_fantasia, natureza_juridica, porte,
    data_abertura, capital_social, situacao_cadastral, situacao_data, situacao_motivo, regime_tributario,
    cnae_principal, cnaes_secundarios, matriz_filial, municipio_ibge, origem_dados
  ) VALUES (
    v_contato_id, v_tenant_id, (p_dados_pj->>'empresa_id')::uuid, (p_dados_pj->>'filial_id')::uuid,
    p_dados_pj->>'cnpj', p_dados_pj->>'razao_social', p_dados_pj->>'nome_fantasia', p_dados_pj->>'natureza_juridica',
    p_dados_pj->>'porte', (p_dados_pj->>'data_abertura')::date, (p_dados_pj->>'capital_social')::numeric,
    p_dados_pj->>'situacao_cadastral', (p_dados_pj->>'situacao_data')::date, p_dados_pj->>'situacao_motivo',
    p_dados_pj->>'regime_tributario', p_dados_pj->>'cnae_principal', v_cnaes_array, p_dados_pj->>'matriz_filial',
    p_dados_pj->>'municipio_ibge', COALESCE(p_dados_pj->>'origem_dados', 'api_cnpj')
  )
  ON CONFLICT (contato_id) DO UPDATE SET
    cnpj = EXCLUDED.cnpj,
    razao_social = EXCLUDED.razao_social,
    nome_fantasia = EXCLUDED.nome_fantasia,
    natureza_juridica = EXCLUDED.natureza_juridica,
    porte = EXCLUDED.porte,
    data_abertura = EXCLUDED.data_abertura,
    capital_social = EXCLUDED.capital_social,
    situacao_cadastral = EXCLUDED.situacao_cadastral,
    situacao_data = EXCLUDED.situacao_data,
    situacao_motivo = EXCLUDED.situacao_motivo,
    regime_tributario = EXCLUDED.regime_tributario,
    cnae_principal = EXCLUDED.cnae_principal,
    cnaes_secundarios = EXCLUDED.cnaes_secundarios,
    matriz_filial = EXCLUDED.matriz_filial,
    municipio_ibge = EXCLUDED.municipio_ibge,
    origem_dados = EXCLUDED.origem_dados,
    updated_at = now();

  -- refresh enderecos
  IF p_contato_id IS NOT NULL THEN DELETE FROM contato_enderecos WHERE contato_id = v_contato_id; END IF;
  FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos) LOOP
    INSERT INTO contato_enderecos (
      contato_id, tenant_id, tipo, principal, cep, logradouro, numero, complemento, bairro, cidade, uf,
      ibge, latitude, longitude, origem_dados
    ) VALUES (
      v_contato_id, v_tenant_id, v_endereco->>'tipo', COALESCE((v_endereco->>'principal')::boolean, false),
      v_endereco->>'cep', v_endereco->>'logradouro', v_endereco->>'numero', v_endereco->>'complemento',
      v_endereco->>'bairro', v_endereco->>'cidade', v_endereco->>'uf', v_endereco->>'ibge',
      (v_endereco->>'latitude')::numeric, (v_endereco->>'longitude')::numeric, COALESCE(v_endereco->>'origem_dados','api_cnpj')
    );
  END LOOP;

  -- refresh meios contato
  IF p_contato_id IS NOT NULL THEN DELETE FROM contato_meios_contato WHERE contato_id = v_contato_id; END IF;
  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato) LOOP
    INSERT INTO contato_meios_contato (
      contato_id, tenant_id, tipo, valor, principal, observacao
    ) VALUES (
      v_contato_id, v_tenant_id, v_meio->>'tipo', v_meio->>'valor', COALESCE((v_meio->>'principal')::boolean, false), v_meio->>'observacao'
    );
  END LOOP;

  -- QSA -> vínculos (auto-referência para garantir integridade mínima)
  IF jsonb_array_length(p_qsa) > 0 THEN
    IF p_contato_id IS NOT NULL THEN
      DELETE FROM contato_vinculos WHERE contato_id = v_contato_id AND tipo_vinculo = 'socio';
    END IF;
    FOR v_socio IN SELECT * FROM jsonb_array_elements(p_qsa) LOOP
      INSERT INTO contato_vinculos (
        contato_id, tenant_id, user_id, tipo_vinculo, vinculado_id, observacao
      ) VALUES (
        v_contato_id, v_tenant_id, v_tenant_id, 'socio', v_contato_id,
        jsonb_build_object('nome', v_socio->>'nome', 'qualificacao', v_socio->>'qual', 'origem', 'qsa_cnpj')::text
      );
    END LOOP;
  END IF;

  -- Etiqueta "Ativo"
  IF v_etiqueta_ativo_id IS NOT NULL THEN
    INSERT INTO etiqueta_vinculos (
      etiqueta_id, referencia_tipo, referencia_id, user_id
    ) VALUES (
      v_etiqueta_ativo_id, 'contato', v_contato_id, v_tenant_id
    ) ON CONFLICT DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'contato_id', v_contato_id);
END;
$$;