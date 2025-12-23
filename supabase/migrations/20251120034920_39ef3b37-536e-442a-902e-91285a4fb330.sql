-- Corrigir conversão de cnaes_secundarios de JSONB para TEXT[] no RPC upsert_contato_v2_transacional
-- Erro: column "cnaes_secundarios" is of type text[] but expression is of type jsonb

DROP FUNCTION IF EXISTS public.upsert_contato_v2_transacional(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB);

CREATE OR REPLACE FUNCTION public.upsert_contato_v2_transacional(
  p_contato_id UUID,
  p_nome TEXT,
  p_cpf_cnpj TEXT,
  p_observacao TEXT,
  p_meios_contato JSONB,
  p_enderecos JSONB,
  p_dados_pf JSONB,
  p_dados_pj JSONB,
  p_etiquetas JSONB
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
  v_cnaes_array TEXT[];
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuário não autenticado'; END IF;

  SELECT empresa_id, filial_id INTO v_empresa_id, v_filial_id FROM profiles WHERE user_id = v_user_id;
  IF v_empresa_id IS NULL THEN RAISE EXCEPTION 'Usuário sem empresa/filial configurada'; END IF;

  IF p_contato_id IS NULL THEN
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
    INSERT INTO contato_pf (contato_id, nome_completo, cpf, rg, data_nascimento, estado_civil, profissao, nacionalidade, naturalidade, mae, pai, empresa_id, filial_id, tenant_id, created_at, updated_at)
    VALUES (v_contato_id, p_dados_pf->>'nome_completo', p_dados_pf->>'cpf', p_dados_pf->>'rg', (p_dados_pf->>'data_nascimento')::date, p_dados_pf->>'estado_civil', p_dados_pf->>'profissao', p_dados_pf->>'nacionalidade', p_dados_pf->>'naturalidade', p_dados_pf->>'mae', p_dados_pf->>'pai', v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW())
    ON CONFLICT (contato_id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo, cpf = EXCLUDED.cpf, rg = EXCLUDED.rg, data_nascimento = EXCLUDED.data_nascimento, estado_civil = EXCLUDED.estado_civil, profissao = EXCLUDED.profissao, nacionalidade = EXCLUDED.nacionalidade, naturalidade = EXCLUDED.naturalidade, mae = EXCLUDED.mae, pai = EXCLUDED.pai, updated_at = NOW();
  END IF;

  IF p_dados_pj IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 14 THEN
    -- Converter cnaes_secundarios de JSONB array para TEXT[]
    v_cnaes_array := NULL;
    IF p_dados_pj ? 'cnaes_secundarios' AND jsonb_typeof(p_dados_pj->'cnaes_secundarios') = 'array' THEN
      SELECT ARRAY(SELECT jsonb_array_elements_text(p_dados_pj->'cnaes_secundarios')) INTO v_cnaes_array;
    END IF;

    INSERT INTO contato_pj (
      contato_id, cnpj, razao_social, nome_fantasia, natureza_juridica, porte, data_abertura, 
      regime_tributario, cnae_principal, cnaes_secundarios, capital_social, situacao_cadastral, 
      situacao_data, situacao_motivo, matriz_filial, municipio_ibge, inscricao_estadual, 
      inscricao_municipal, atividade_principal, origem_dados, empresa_id, filial_id, tenant_id, 
      created_at, updated_at
    )
    VALUES (
      v_contato_id, 
      p_dados_pj->>'cnpj', 
      p_dados_pj->>'razao_social', 
      p_dados_pj->>'nome_fantasia', 
      p_dados_pj->>'natureza_juridica', 
      p_dados_pj->>'porte', 
      (p_dados_pj->>'data_abertura')::date, 
      p_dados_pj->>'regime_tributario', 
      p_dados_pj->>'cnae_principal', 
      v_cnaes_array,  -- CORREÇÃO: usar o array convertido
      (p_dados_pj->>'capital_social')::numeric, 
      p_dados_pj->>'situacao_cadastral', 
      (p_dados_pj->>'situacao_data')::date, 
      p_dados_pj->>'situacao_motivo', 
      p_dados_pj->>'matriz_filial', 
      p_dados_pj->>'municipio_ibge', 
      p_dados_pj->>'inscricao_estadual', 
      p_dados_pj->>'inscricao_municipal', 
      p_dados_pj->>'atividade_principal', 
      p_dados_pj->>'origem_dados', 
      v_empresa_id, 
      v_filial_id, 
      v_empresa_id, 
      NOW(), 
      NOW()
    )
    ON CONFLICT (contato_id) DO UPDATE SET 
      cnpj = EXCLUDED.cnpj, 
      razao_social = EXCLUDED.razao_social, 
      nome_fantasia = EXCLUDED.nome_fantasia, 
      natureza_juridica = EXCLUDED.natureza_juridica, 
      porte = EXCLUDED.porte, 
      data_abertura = EXCLUDED.data_abertura, 
      regime_tributario = EXCLUDED.regime_tributario, 
      cnae_principal = EXCLUDED.cnae_principal, 
      cnaes_secundarios = EXCLUDED.cnaes_secundarios, 
      capital_social = EXCLUDED.capital_social, 
      situacao_cadastral = EXCLUDED.situacao_cadastral, 
      situacao_data = EXCLUDED.situacao_data, 
      situacao_motivo = EXCLUDED.situacao_motivo, 
      matriz_filial = EXCLUDED.matriz_filial, 
      municipio_ibge = EXCLUDED.municipio_ibge, 
      inscricao_estadual = EXCLUDED.inscricao_estadual, 
      inscricao_municipal = EXCLUDED.inscricao_municipal, 
      atividade_principal = EXCLUDED.atividade_principal, 
      origem_dados = EXCLUDED.origem_dados, 
      updated_at = NOW();
  END IF;

  DELETE FROM contato_meios_contato WHERE contato_id = v_contato_id;
  IF p_meios_contato IS NOT NULL AND jsonb_array_length(p_meios_contato) > 0 THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO contato_meios_contato (contato_id, tipo, valor, principal, empresa_id, filial_id, tenant_id, created_at, updated_at)
      VALUES (v_contato_id, v_meio->>'tipo', v_meio->>'valor', COALESCE((v_meio->>'principal')::boolean, false), v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW());
    END LOOP;
  END IF;

  DELETE FROM contato_enderecos WHERE contato_id = v_contato_id;
  IF p_enderecos IS NOT NULL AND jsonb_array_length(p_enderecos) > 0 THEN
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
    LOOP
      INSERT INTO contato_enderecos (contato_id, tipo, logradouro, numero, complemento, bairro, cidade, uf, cep, principal, empresa_id, filial_id, tenant_id, created_at, updated_at)
      VALUES (v_contato_id, v_endereco->>'tipo', v_endereco->>'logradouro', v_endereco->>'numero', v_endereco->>'complemento', v_endereco->>'bairro', v_endereco->>'cidade', v_endereco->>'uf', v_endereco->>'cep', COALESCE((v_endereco->>'principal')::boolean, false), v_empresa_id, v_filial_id, v_empresa_id, NOW(), NOW());
    END LOOP;
  END IF;

  DELETE FROM contato_etiquetas WHERE contato_id = v_contato_id;
  IF p_etiquetas IS NOT NULL AND jsonb_array_length(p_etiquetas) > 0 THEN
    FOR v_etiqueta IN SELECT * FROM jsonb_array_elements(p_etiquetas)
    LOOP
      IF (v_etiqueta->>'id') IS NOT NULL THEN
        INSERT INTO contato_etiquetas (contato_id, etiqueta_id, tenant_id, created_at)
        VALUES (v_contato_id, (v_etiqueta->>'id')::uuid, v_empresa_id, NOW())
        ON CONFLICT (contato_id, etiqueta_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  INSERT INTO auditoria (tenant_id, actor_id, module, action, target_id, details)
  VALUES (v_empresa_id, v_user_id, 'contatos', CASE WHEN p_contato_id IS NULL THEN 'create' ELSE 'update' END, v_contato_id, jsonb_build_object('nome', p_nome, 'cpf_cnpj', p_cpf_cnpj));

  RETURN jsonb_build_object('id', v_contato_id, 'message', CASE WHEN p_contato_id IS NULL THEN 'Contato criado com sucesso' ELSE 'Contato atualizado com sucesso' END);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contato_v2_transacional TO authenticated;

COMMENT ON FUNCTION public.upsert_contato_v2_transacional IS 'Cria ou atualiza contato V2 com todos os dados relacionados de forma transacional. CORREÇÃO: converte cnaes_secundarios de JSONB para TEXT[]';