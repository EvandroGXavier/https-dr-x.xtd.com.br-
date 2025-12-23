-- =====================================================
-- CORREÇÃO CRÍTICA: tenant_id deve ser empresa_id, não user_id
-- =====================================================

-- PARTE 1: Corrigir upsert_contato_v2_transacional
-- -------------------------------------------------
DROP FUNCTION IF EXISTS public.upsert_contato_v2_transacional(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.upsert_contato_v2_transacional(
  p_contato_id UUID DEFAULT NULL,
  p_nome TEXT DEFAULT NULL,
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_meios_contato JSONB DEFAULT '[]'::jsonb,
  p_enderecos JSONB DEFAULT '[]'::jsonb,
  p_dados_pf JSONB DEFAULT NULL,
  p_dados_pj JSONB DEFAULT NULL,
  p_etiquetas JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id UUID;
  v_user_id UUID;
  v_empresa_id UUID;
  v_filial_id UUID;
  v_meio JSONB;
  v_endereco JSONB;
  v_etiqueta JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  SELECT empresa_id, filial_id INTO v_empresa_id, v_filial_id FROM profiles WHERE user_id = v_user_id;
  IF v_empresa_id IS NULL THEN RAISE EXCEPTION 'Usuário sem empresa/filial configurada'; END IF;

  IF p_contato_id IS NULL THEN
    -- CORREÇÃO: usar v_empresa_id como tenant_id, não v_user_id
    INSERT INTO contatos_v2 (nome_fantasia, cpf_cnpj, observacao, empresa_id, filial_id, tenant_id, user_id, created_at, updated_at)
    VALUES (p_nome, p_cpf_cnpj, p_observacao, v_empresa_id, v_filial_id, v_empresa_id, v_user_id, NOW(), NOW())
    RETURNING id INTO v_contato_id;
  ELSE
    UPDATE contatos_v2 SET nome_fantasia = COALESCE(p_nome, nome_fantasia), cpf_cnpj = COALESCE(p_cpf_cnpj, cpf_cnpj),
      observacao = COALESCE(p_observacao, observacao), updated_at = NOW()
    WHERE id = p_contato_id AND tenant_id = v_empresa_id;
    v_contato_id := p_contato_id;
  END IF;

  IF p_dados_pf IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 11 THEN
    -- CORREÇÃO: usar v_empresa_id como tenant_id
    INSERT INTO contato_pf (contato_id, nome_completo, cpf, rg, data_nascimento, estado_civil, profissao, nacionalidade, naturalidade, mae, pai, empresa_id, filial_id, tenant_id, created_at, updated_at)
    VALUES (v_contato_id, p_dados_pf->>'nome_completo', p_dados_pf->>'cpf', p_dados_pf->>'rg', (p_dados_pf->>'data_nascimento')::date, p_dados_pf->>'estado_civil', p_dados_pf->>'profissao', p_dados_pf->>'nacionalidade', p_dados_pf->>'naturalidade', p_dados_pf->>'mae', p_dados_pf->>'pai', v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW())
    ON CONFLICT (contato_id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo, cpf = EXCLUDED.cpf, rg = EXCLUDED.rg, data_nascimento = EXCLUDED.data_nascimento, estado_civil = EXCLUDED.estado_civil, profissao = EXCLUDED.profissao, nacionalidade = EXCLUDED.nacionalidade, naturalidade = EXCLUDED.naturalidade, mae = EXCLUDED.mae, pai = EXCLUDED.pai, updated_at = NOW();
  END IF;

  IF p_dados_pj IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 14 THEN
    -- CORREÇÃO: usar v_empresa_id como tenant_id
    INSERT INTO contato_pj (contato_id, cnpj, razao_social, nome_fantasia, natureza_juridica, porte, data_abertura, regime_tributario, cnae_principal, cnaes_secundarios, capital_social, situacao_cadastral, situacao_data, situacao_motivo, matriz_filial, municipio_ibge, inscricao_estadual, inscricao_municipal, atividade_principal, origem_dados, empresa_id, filial_id, tenant_id, created_at, updated_at)
    VALUES (v_contato_id, p_dados_pj->>'cnpj', p_dados_pj->>'razao_social', p_dados_pj->>'nome_fantasia', p_dados_pj->>'natureza_juridica', p_dados_pj->>'porte', (p_dados_pj->>'data_abertura')::date, p_dados_pj->>'regime_tributario', p_dados_pj->>'cnae_principal', p_dados_pj->'cnaes_secundarios', (p_dados_pj->>'capital_social')::numeric, p_dados_pj->>'situacao_cadastral', (p_dados_pj->>'situacao_data')::date, p_dados_pj->>'situacao_motivo', p_dados_pj->>'matriz_filial', p_dados_pj->>'municipio_ibge', p_dados_pj->>'inscricao_estadual', p_dados_pj->>'inscricao_municipal', p_dados_pj->>'atividade_principal', p_dados_pj->>'origem_dados', v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW())
    ON CONFLICT (contato_id) DO UPDATE SET cnpj = EXCLUDED.cnpj, razao_social = EXCLUDED.razao_social, nome_fantasia = EXCLUDED.nome_fantasia, natureza_juridica = EXCLUDED.natureza_juridica, porte = EXCLUDED.porte, data_abertura = EXCLUDED.data_abertura, regime_tributario = EXCLUDED.regime_tributario, cnae_principal = EXCLUDED.cnae_principal, cnaes_secundarios = EXCLUDED.cnaes_secundarios, capital_social = EXCLUDED.capital_social, situacao_cadastral = EXCLUDED.situacao_cadastral, situacao_data = EXCLUDED.situacao_data, situacao_motivo = EXCLUDED.situacao_motivo, matriz_filial = EXCLUDED.matriz_filial, municipio_ibge = EXCLUDED.municipio_ibge, inscricao_estadual = EXCLUDED.inscricao_estadual, inscricao_municipal = EXCLUDED.inscricao_municipal, atividade_principal = EXCLUDED.atividade_principal, origem_dados = EXCLUDED.origem_dados, updated_at = NOW();
  END IF;

  DELETE FROM contato_meios_contato WHERE contato_id = v_contato_id;
  IF p_meios_contato IS NOT NULL AND jsonb_array_length(p_meios_contato) > 0 THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      -- CORREÇÃO: usar v_empresa_id como tenant_id
      INSERT INTO contato_meios_contato (contato_id, tipo, valor, principal, empresa_id, filial_id, tenant_id, created_at, updated_at)
      VALUES (v_contato_id, v_meio->>'tipo', v_meio->>'valor', COALESCE((v_meio->>'principal')::boolean, false), v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW());
    END LOOP;
  END IF;

  DELETE FROM contato_enderecos WHERE contato_id = v_contato_id;
  IF p_enderecos IS NOT NULL AND jsonb_array_length(p_enderecos) > 0 THEN
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
    LOOP
      -- CORREÇÃO: usar v_empresa_id como tenant_id
      INSERT INTO contato_enderecos (contato_id, logradouro, numero, complemento, bairro, cidade, uf, cep, ibge, latitude, longitude, tipo, principal, empresa_id, filial_id, tenant_id, created_at, updated_at)
      VALUES (v_contato_id, v_endereco->>'logradouro', v_endereco->>'numero', v_endereco->>'complemento', v_endereco->>'bairro', v_endereco->>'cidade', v_endereco->>'uf', v_endereco->>'cep', v_endereco->>'ibge', (v_endereco->>'latitude')::numeric, (v_endereco->>'longitude')::numeric, COALESCE(v_endereco->>'tipo', 'Principal'), COALESCE((v_endereco->>'principal')::boolean, false), v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW());
    END LOOP;
  END IF;

  IF p_etiquetas IS NOT NULL AND jsonb_array_length(p_etiquetas) > 0 THEN
    FOR v_etiqueta IN SELECT * FROM jsonb_array_elements(p_etiquetas)
    LOOP
      -- CORREÇÃO: usar v_empresa_id como tenant_id
      INSERT INTO contato_etiquetas (contato_id, etiqueta_id, tenant_id, created_at)
      VALUES (v_contato_id, (v_etiqueta->>'etiqueta_id')::uuid, v_empresa_id, NOW())
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'contato_id', v_contato_id, 'message', 'Contato processado com sucesso');
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contato_v2_transacional TO authenticated;

-- PARTE 2: Corrigir criar_contato_transacional
-- ---------------------------------------------
DROP FUNCTION IF EXISTS public.criar_contato_transacional(TEXT, TEXT, UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.criar_contato_transacional(
  p_nome_principal TEXT,
  p_classificacao TEXT DEFAULT NULL,
  p_empresa_id UUID DEFAULT NULL,
  p_filial_id UUID DEFAULT NULL,
  p_responsavel_id UUID DEFAULT NULL,
  p_tipo_pessoa TEXT DEFAULT 'lead',
  p_pessoa_tipo TEXT DEFAULT 'cliente',
  p_observacao TEXT DEFAULT NULL,
  p_meios_contato JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id UUID;
  v_user_id UUID;
  v_profile_empresa_id UUID;
  v_profile_filial_id UUID;
  v_tenant_id UUID;
  v_meio JSONB;
  v_result JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Obter user_id da sessão
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Buscar empresa_id do profile do usuário
  SELECT empresa_id, filial_id 
  INTO v_profile_empresa_id, v_profile_filial_id
  FROM profiles 
  WHERE user_id = v_user_id;
  
  IF v_profile_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa configurada no profile';
  END IF;
  
  -- CORREÇÃO CRÍTICA: tenant_id deve ser empresa_id, não user_id
  v_tenant_id := v_profile_empresa_id;
  
  -- Inserir contato usando apenas colunas existentes em contatos_v2
  INSERT INTO public.contatos_v2 (
    nome_fantasia,
    classificacao,
    observacao,
    empresa_id,
    filial_id,
    responsavel_id,
    user_id,
    tenant_id,
    created_at,
    updated_at
  ) VALUES (
    p_nome_principal,
    p_classificacao,
    p_observacao,
    COALESCE(p_empresa_id, v_profile_empresa_id),
    COALESCE(p_filial_id, v_profile_filial_id),
    p_responsavel_id,
    v_user_id,
    v_tenant_id,  -- Agora usando empresa_id corretamente
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contato_id;
  
  -- Inserir meios de contato se fornecidos
  IF p_meios_contato IS NOT NULL AND jsonb_array_length(p_meios_contato) > 0 THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO public.contato_meios_contato (
        contato_id,
        tipo,
        valor,
        principal,
        empresa_id,
        filial_id,
        tenant_id,
        created_at,
        updated_at
      ) VALUES (
        v_contato_id,
        v_meio->>'tipo',
        v_meio->>'valor',
        COALESCE((v_meio->>'is_principal')::BOOLEAN, (v_meio->>'principal')::BOOLEAN, false),
        COALESCE(p_empresa_id, v_profile_empresa_id),
        COALESCE(p_filial_id, v_profile_filial_id),
        v_tenant_id,  -- Agora usando empresa_id corretamente
        NOW(),
        NOW()
      );
      
      v_count := v_count + 1;
    END LOOP;
  END IF;
  
  -- Log de auditoria
  PERFORM public.log_security_event(
    'contact_created_transactional',
    format('Contato criado via operação transacional: %s', p_nome_principal),
    jsonb_build_object(
      'contato_id', v_contato_id,
      'classificacao', p_classificacao,
      'meios_contato_count', v_count,
      'tenant_id', v_tenant_id
    )
  );
  
  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'contato_id', v_contato_id,
    'meios_contato_criados', v_count,
    'message', 'Contato criado com sucesso'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar contato: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_contato_transacional TO authenticated;