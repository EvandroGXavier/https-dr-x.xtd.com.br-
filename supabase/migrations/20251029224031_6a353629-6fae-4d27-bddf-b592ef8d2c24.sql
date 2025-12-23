-- Dropar TODAS as versões de criar_contato_pj_transacional
DROP FUNCTION IF EXISTS public.criar_contato_pj_transacional(text,text,uuid,text,jsonb,jsonb,jsonb);
DROP FUNCTION IF EXISTS public.criar_contato_pj_transacional(text,jsonb,jsonb,jsonb,text,uuid,text);
DROP FUNCTION IF EXISTS public.criar_contato_pj_transacional(text,jsonb,jsonb,jsonb,text,uuid,text,uuid,jsonb);
DROP FUNCTION IF EXISTS public.criar_contato_pj_transacional(text,text,text,text,text,text,date,text,text,text,jsonb,text,date,text,numeric,text,text,text,text,jsonb,jsonb);

-- Dropar e recriar upsert_contato_v2_transacional com TODOS os campos
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
    INSERT INTO contatos_v2 (nome_fantasia, cpf_cnpj, observacao, empresa_id, filial_id, tenant_id, user_id, created_at, updated_at)
    VALUES (p_nome, p_cpf_cnpj, p_observacao, v_empresa_id, v_filial_id, v_user_id, v_user_id, NOW(), NOW())
    RETURNING id INTO v_contato_id;
  ELSE
    UPDATE contatos_v2 SET nome_fantasia = COALESCE(p_nome, nome_fantasia), cpf_cnpj = COALESCE(p_cpf_cnpj, cpf_cnpj),
      observacao = COALESCE(p_observacao, observacao), updated_at = NOW()
    WHERE id = p_contato_id AND tenant_id = v_user_id;
    v_contato_id := p_contato_id;
  END IF;

  IF p_dados_pf IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 11 THEN
    INSERT INTO contato_pf (contato_id, nome_completo, cpf, rg, data_nascimento, estado_civil, profissao, nacionalidade, naturalidade, mae, pai, empresa_id, filial_id, tenant_id, created_at, updated_at)
    VALUES (v_contato_id, p_dados_pf->>'nome_completo', p_dados_pf->>'cpf', p_dados_pf->>'rg', (p_dados_pf->>'data_nascimento')::date, p_dados_pf->>'estado_civil', p_dados_pf->>'profissao', p_dados_pf->>'nacionalidade', p_dados_pf->>'naturalidade', p_dados_pf->>'mae', p_dados_pf->>'pai', v_empresa_id, v_filial_id, v_user_id, NOW(), NOW())
    ON CONFLICT (contato_id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo, cpf = EXCLUDED.cpf, rg = EXCLUDED.rg, data_nascimento = EXCLUDED.data_nascimento, estado_civil = EXCLUDED.estado_civil, profissao = EXCLUDED.profissao, nacionalidade = EXCLUDED.nacionalidade, naturalidade = EXCLUDED.naturalidade, mae = EXCLUDED.mae, pai = EXCLUDED.pai, updated_at = NOW();
  END IF;

  IF p_dados_pj IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 14 THEN
    INSERT INTO contato_pj (contato_id, cnpj, razao_social, nome_fantasia, natureza_juridica, porte, data_abertura, regime_tributario, cnae_principal, cnaes_secundarios, capital_social, situacao_cadastral, situacao_data, situacao_motivo, matriz_filial, municipio_ibge, inscricao_estadual, inscricao_municipal, atividade_principal, origem_dados, empresa_id, filial_id, tenant_id, created_at, updated_at)
    VALUES (v_contato_id, p_dados_pj->>'cnpj', p_dados_pj->>'razao_social', p_dados_pj->>'nome_fantasia', p_dados_pj->>'natureza_juridica', p_dados_pj->>'porte', (p_dados_pj->>'data_abertura')::date, p_dados_pj->>'regime_tributario', p_dados_pj->>'cnae_principal', CASE WHEN p_dados_pj->'cnaes_secundarios' IS NOT NULL THEN ARRAY(SELECT jsonb_array_elements_text(p_dados_pj->'cnaes_secundarios')) ELSE NULL END, (p_dados_pj->>'capital_social')::numeric, p_dados_pj->>'situacao_cadastral', (p_dados_pj->>'situacao_data')::date, p_dados_pj->>'situacao_motivo', p_dados_pj->>'matriz_filial', p_dados_pj->>'municipio_ibge', p_dados_pj->>'inscricao_estadual', p_dados_pj->>'inscricao_municipal', p_dados_pj->>'atividade_principal', COALESCE(p_dados_pj->>'origem_dados', 'manual'), v_empresa_id, v_filial_id, v_user_id, NOW(), NOW())
    ON CONFLICT (contato_id) DO UPDATE SET cnpj = EXCLUDED.cnpj, razao_social = EXCLUDED.razao_social, nome_fantasia = EXCLUDED.nome_fantasia, natureza_juridica = EXCLUDED.natureza_juridica, porte = EXCLUDED.porte, data_abertura = EXCLUDED.data_abertura, regime_tributario = EXCLUDED.regime_tributario, cnae_principal = EXCLUDED.cnae_principal, cnaes_secundarios = EXCLUDED.cnaes_secundarios, capital_social = EXCLUDED.capital_social, situacao_cadastral = EXCLUDED.situacao_cadastral, situacao_data = EXCLUDED.situacao_data, situacao_motivo = EXCLUDED.situacao_motivo, matriz_filial = EXCLUDED.matriz_filial, municipio_ibge = EXCLUDED.municipio_ibge, inscricao_estadual = EXCLUDED.inscricao_estadual, inscricao_municipal = EXCLUDED.inscricao_municipal, atividade_principal = EXCLUDED.atividade_principal, origem_dados = EXCLUDED.origem_dados, updated_at = NOW();
  END IF;

  DELETE FROM contato_meios_contato WHERE contato_id = v_contato_id;
  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
  LOOP
    INSERT INTO contato_meios_contato (contato_id, tipo, valor, principal, observacao, empresa_id, filial_id, tenant_id)
    VALUES (v_contato_id, v_meio->>'tipo', v_meio->>'valor', COALESCE((v_meio->>'principal')::boolean, false), v_meio->>'observacao', v_empresa_id, v_filial_id, v_user_id);
  END LOOP;

  DELETE FROM contato_enderecos WHERE contato_id = v_contato_id;
  FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
  LOOP
    INSERT INTO contato_enderecos (contato_id, tipo, logradouro, numero, complemento, bairro, cidade, uf, cep, ibge, principal, origem_dados, empresa_id, filial_id, tenant_id)
    VALUES (v_contato_id, COALESCE(v_endereco->>'tipo', 'Comercial'), v_endereco->>'logradouro', v_endereco->>'numero', v_endereco->>'complemento', v_endereco->>'bairro', v_endereco->>'cidade', v_endereco->>'uf', v_endereco->>'cep', v_endereco->>'ibge', COALESCE((v_endereco->>'principal')::boolean, false), COALESCE(v_endereco->>'origem_dados', 'manual'), v_empresa_id, v_filial_id, v_user_id);
  END LOOP;

  DELETE FROM contato_etiquetas WHERE contato_id = v_contato_id;
  FOR v_etiqueta IN SELECT * FROM jsonb_array_elements(p_etiquetas)
  LOOP
    INSERT INTO contato_etiquetas (contato_id, etiqueta_id, tenant_id)
    VALUES (v_contato_id, (v_etiqueta->>'id')::uuid, v_user_id)
    ON CONFLICT (contato_id, etiqueta_id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'id', v_contato_id, 'message', CASE WHEN p_contato_id IS NULL THEN 'Contato criado' ELSE 'Contato atualizado' END);
EXCEPTION
  WHEN OTHERS THEN RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contato_v2_transacional TO authenticated;

-- Criar função criar_contato_pj_transacional
CREATE OR REPLACE FUNCTION public.criar_contato_pj_transacional(
  p_nome_fantasia TEXT,
  p_dados_pj JSONB,
  p_enderecos JSONB DEFAULT '[]'::jsonb,
  p_meios_contato JSONB DEFAULT '[]'::jsonb,
  p_classificacao TEXT DEFAULT 'cliente',
  p_contato_id UUID DEFAULT NULL,
  p_qsa JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN upsert_contato_v2_transacional(
    p_contato_id := p_contato_id, p_nome := p_nome_fantasia, p_cpf_cnpj := p_dados_pj->>'cnpj',
    p_observacao := NULL, p_meios_contato := p_meios_contato, p_enderecos := p_enderecos,
    p_dados_pf := NULL, p_dados_pj := p_dados_pj, p_etiquetas := '[]'::jsonb
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_contato_pj_transacional TO authenticated;