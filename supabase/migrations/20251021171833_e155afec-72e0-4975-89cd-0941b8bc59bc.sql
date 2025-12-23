-- Fix fn_criar_contato_completo: substituir p_observacoes -> p_observacao e coluna observacao

-- Remover versões antigas (com p_observacoes)
DROP FUNCTION IF EXISTS fn_criar_contato_completo(text, text, text, text, uuid, jsonb, jsonb, jsonb, jsonb, uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS fn_criar_contato_completo CASCADE;

-- Recriar função correta
CREATE OR REPLACE FUNCTION fn_criar_contato_completo(
  p_nome text,
  p_cpf_cnpj text DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_classificacao text DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_meios_contato jsonb DEFAULT '[]'::jsonb,
  p_enderecos jsonb DEFAULT '[]'::jsonb,
  p_dados_pf jsonb DEFAULT NULL,
  p_dados_pj jsonb DEFAULT NULL,
  p_empresa_id uuid DEFAULT NULL,
  p_filial_id uuid DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_contato_id uuid;
  v_tipo_pessoa text;
  v_meio jsonb;
  v_endereco jsonb;
BEGIN
  v_tenant_id := current_setting('app.tenant_id', true)::uuid;
  v_user_id := auth.uid();
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'tenant_id não configurado'; END IF;

  IF p_dados_pf IS NOT NULL THEN v_tipo_pessoa := 'PF';
  ELSIF p_dados_pj IS NOT NULL THEN v_tipo_pessoa := 'PJ';
  ELSE v_tipo_pessoa := 'Lead'; END IF;

  INSERT INTO contatos_v2 (
    nome, cpf_cnpj, observacao, classificacao, responsavel_id,
    tenant_id, empresa_id, filial_id, created_by
  ) VALUES (
    p_nome, p_cpf_cnpj, p_observacao, p_classificacao, p_responsavel_id,
    v_tenant_id, p_empresa_id, p_filial_id, v_user_id
  ) RETURNING id INTO v_contato_id;

  IF p_dados_pf IS NOT NULL THEN
    INSERT INTO contato_pf (contato_id, cpf, data_nascimento, estado_civil, profissao, rg, orgao_expedidor, tenant_id)
    VALUES (
      v_contato_id,
      (p_dados_pf->>'cpf'),
      (p_dados_pf->>'data_nascimento')::date,
      (p_dados_pf->>'estado_civil'),
      (p_dados_pf->>'profissao'),
      (p_dados_pf->>'rg'),
      (p_dados_pf->>'orgao_expedidor'),
      v_tenant_id
    );
  END IF;

  IF p_dados_pj IS NOT NULL THEN
    INSERT INTO contato_pj (contato_id, cnpj, razao_social, natureza_juridica, data_abertura, empresa_id, filial_id, tenant_id)
    VALUES (
      v_contato_id,
      (p_dados_pj->>'cnpj'),
      (p_dados_pj->>'razao_social'),
      (p_dados_pj->>'natureza_juridica'),
      (p_dados_pj->>'data_abertura')::date,
      p_empresa_id,
      p_filial_id,
      v_tenant_id
    );
  END IF;

  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato) LOOP
    INSERT INTO contato_meios_contato (contato_id, tipo, valor, principal, tenant_id, empresa_id, filial_id)
    VALUES (v_contato_id, (v_meio->>'tipo'), (v_meio->>'valor'), COALESCE((v_meio->>'principal')::boolean, false), v_tenant_id, p_empresa_id, p_filial_id);
  END LOOP;

  FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos) LOOP
    INSERT INTO contato_enderecos (contato_id, tipo, logradouro, numero, complemento, bairro, cidade, uf, cep, principal, tenant_id)
    VALUES (v_contato_id, (v_endereco->>'tipo'), (v_endereco->>'logradouro'), (v_endereco->>'numero'), (v_endereco->>'complemento'), (v_endereco->>'bairro'), (v_endereco->>'cidade'), (v_endereco->>'uf'), (v_endereco->>'cep'), COALESCE((v_endereco->>'principal')::boolean, false), v_tenant_id);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'id', v_contato_id, 'tipo_pessoa', v_tipo_pessoa, 'message', 'Contato criado com sucesso');
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erro ao criar contato: %', SQLERRM;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION fn_criar_contato_completo TO authenticated;