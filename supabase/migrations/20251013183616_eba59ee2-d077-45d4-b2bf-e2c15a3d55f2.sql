-- Corrigir função criar_contato_pj_transacional para converter cnaes_secundarios corretamente
CREATE OR REPLACE FUNCTION public.criar_contato_pj_transacional(
  p_nome_fantasia TEXT,
  p_email TEXT DEFAULT NULL,
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_razao_social TEXT DEFAULT NULL,
  p_cnpj TEXT DEFAULT NULL,
  p_data_abertura DATE DEFAULT NULL,
  p_natureza_juridica TEXT DEFAULT NULL,
  p_regime_tributario TEXT DEFAULT NULL,
  p_cnae_principal TEXT DEFAULT NULL,
  p_cnaes_secundarios JSONB DEFAULT NULL,
  p_situacao_cadastral TEXT DEFAULT NULL,
  p_situacao_data DATE DEFAULT NULL,
  p_situacao_motivo TEXT DEFAULT NULL,
  p_capital_social NUMERIC DEFAULT NULL,
  p_porte TEXT DEFAULT NULL,
  p_matriz_filial TEXT DEFAULT NULL,
  p_municipio_ibge TEXT DEFAULT NULL,
  p_origem_dados TEXT DEFAULT 'manual',
  p_endereco JSONB DEFAULT NULL,
  p_meios_contato JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_contato_id UUID;
  v_pj_id UUID;
  v_meio_contato JSONB;
  v_etiqueta_ativo_id UUID;
  v_cnaes_array TEXT[];
BEGIN
  -- Converter JSONB array para TEXT[] se fornecido
  IF p_cnaes_secundarios IS NOT NULL THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_cnaes_secundarios))
    INTO v_cnaes_array;
  END IF;

  -- 1. Criar registro principal em contatos_v2
  INSERT INTO public.contatos_v2 (
    nome_fantasia,
    email,
    cpf_cnpj,
    observacao,
    tipo_pessoa,
    pessoa_tipo,
    user_id,
    tenant_id
  ) VALUES (
    p_nome_fantasia,
    p_email,
    p_cpf_cnpj,
    p_observacao,
    'juridica',
    'cliente',
    auth.uid(),
    auth.uid()
  ) RETURNING id INTO v_contato_id;

  -- 2. Criar registro em contato_pj (tabela auxiliar PJ)
  INSERT INTO public.contato_pj (
    contato_id,
    empresa_id,
    filial_id,
    tenant_id,
    razao_social,
    nome_fantasia,
    cnpj,
    data_abertura,
    natureza_juridica,
    regime_tributario,
    cnae_principal,
    cnaes_secundarios,
    situacao_cadastral,
    situacao_data,
    situacao_motivo,
    capital_social,
    porte,
    matriz_filial,
    municipio_ibge,
    origem_dados
  ) VALUES (
    v_contato_id,
    (current_setting('app.tenant_id', true))::uuid,
    NULLIF(current_setting('app.filial_id', true), '')::uuid,
    auth.uid(),
    p_razao_social,
    p_nome_fantasia,
    p_cnpj,
    p_data_abertura,
    p_natureza_juridica,
    p_regime_tributario,
    p_cnae_principal,
    v_cnaes_array,  -- Usar o array convertido
    p_situacao_cadastral,
    p_situacao_data,
    p_situacao_motivo,
    p_capital_social,
    p_porte,
    p_matriz_filial,
    p_municipio_ibge,
    p_origem_dados
  ) RETURNING id INTO v_pj_id;

  -- 3. Criar endereço se fornecido
  IF p_endereco IS NOT NULL THEN
    INSERT INTO public.contato_enderecos (
      contato_id,
      tenant_id,
      empresa_id,
      filial_id,
      tipo,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      ibge,
      principal,
      origem_dados
    ) VALUES (
      v_contato_id,
      auth.uid(),
      (current_setting('app.tenant_id', true))::uuid,
      NULLIF(current_setting('app.filial_id', true), '')::uuid,
      COALESCE(p_endereco->>'tipo', 'Principal'),
      p_endereco->>'cep',
      p_endereco->>'logradouro',
      p_endereco->>'numero',
      p_endereco->>'complemento',
      p_endereco->>'bairro',
      p_endereco->>'cidade',
      p_endereco->>'uf',
      p_endereco->>'ibge',
      COALESCE((p_endereco->>'principal')::boolean, true),
      COALESCE(p_endereco->>'origem_dados', p_origem_dados)
    );
  END IF;

  -- 4. Criar meios de contato se fornecidos
  IF p_meios_contato IS NOT NULL THEN
    FOR v_meio_contato IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO public.contato_meios_contato (
        contato_id,
        tenant_id,
        empresa_id,
        filial_id,
        tipo,
        valor,
        principal,
        observacao
      ) VALUES (
        v_contato_id,
        auth.uid(),
        (current_setting('app.tenant_id', true))::uuid,
        NULLIF(current_setting('app.filial_id', true), '')::uuid,
        v_meio_contato->>'tipo',
        v_meio_contato->>'valor',
        COALESCE((v_meio_contato->>'principal')::boolean, false),
        v_meio_contato->>'observacao'
      );
    END LOOP;
  END IF;

  -- 5. Criar ou buscar etiqueta "ativo" e vincular ao contato
  SELECT id INTO v_etiqueta_ativo_id
  FROM public.etiquetas
  WHERE LOWER(nome) = 'ativo' AND user_id = auth.uid()
  LIMIT 1;

  IF v_etiqueta_ativo_id IS NULL THEN
    INSERT INTO public.etiquetas (
      nome,
      slug,
      cor,
      user_id,
      ativa
    ) VALUES (
      'Ativo',
      'ativo',
      '#22C55E',
      auth.uid(),
      true
    ) RETURNING id INTO v_etiqueta_ativo_id;
  END IF;

  -- Vincular etiqueta ao contato
  INSERT INTO public.etiqueta_vinculos (
    etiqueta_id,
    referencia_tipo,
    referencia_id,
    user_id
  ) VALUES (
    v_etiqueta_ativo_id,
    'contato',
    v_contato_id,
    auth.uid()
  );

  -- 6. Log de auditoria
  PERFORM log_security_event(
    'contact_pj_created',
    format('Contato PJ criado: %s (CNPJ: %s)', p_nome_fantasia, p_cnpj),
    jsonb_build_object(
      'contato_id', v_contato_id,
      'cnpj', p_cnpj,
      'origem_dados', p_origem_dados
    )
  );

  RETURN v_contato_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar contato PJ: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;