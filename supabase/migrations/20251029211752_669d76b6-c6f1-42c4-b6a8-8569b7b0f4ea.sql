-- Corrige upsert_contato_v2_transacional para não usar telefone_principal/email_principal em contato_pj
-- 1) Remover possíveis versões antigas (assinaturas diferentes)
DROP FUNCTION IF EXISTS public.upsert_contato_v2_transacional(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB);
DROP FUNCTION IF EXISTS public.upsert_contato_v2_transacional(UUID, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB);

-- 2) Recriar a função com INSERT/UPDATE em contato_pj sem telefone_principal/email_principal
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
  v_result JSONB;
BEGIN
  -- Obter contexto de segurança
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Buscar empresa e filial do usuário
  SELECT empresa_id, filial_id
  INTO v_empresa_id, v_filial_id
  FROM profiles
  WHERE user_id = v_user_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa/filial configurada';
  END IF;

  -- 1. UPSERT no contato principal (contatos_v2)
  IF p_contato_id IS NULL THEN
    INSERT INTO contatos_v2 (
      nome_fantasia,
      cpf_cnpj,
      observacao,
      empresa_id,
      filial_id,
      tenant_id,
      user_id,
      created_at,
      updated_at
    ) VALUES (
      p_nome,
      p_cpf_cnpj,
      p_observacao,
      v_empresa_id,
      v_filial_id,
      v_user_id,
      v_user_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_contato_id;
  ELSE
    UPDATE contatos_v2 SET
      nome_fantasia = COALESCE(p_nome, nome_fantasia),
      cpf_cnpj = COALESCE(p_cpf_cnpj, cpf_cnpj),
      observacao = COALESCE(p_observacao, observacao),
      updated_at = NOW()
    WHERE id = p_contato_id
      AND tenant_id = v_user_id;
    
    v_contato_id := p_contato_id;
  END IF;

  -- 2. UPSERT em contato_pf (se fornecido e é PF)
  IF p_dados_pf IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 11 THEN
    INSERT INTO contato_pf (
      contato_id,
      nome_completo,
      cpf,
      rg,
      data_nascimento,
      estado_civil,
      profissao,
      nacionalidade,
      naturalidade,
      mae,
      pai,
      empresa_id,
      filial_id,
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      v_contato_id,
      p_dados_pf->>'nome_completo',
      p_dados_pf->>'cpf',
      p_dados_pf->>'rg',
      (p_dados_pf->>'data_nascimento')::date,
      p_dados_pf->>'estado_civil',
      p_dados_pf->>'profissao',
      p_dados_pf->>'nacionalidade',
      p_dados_pf->>'naturalidade',
      p_dados_pf->>'mae',
      p_dados_pf->>'pai',
      v_empresa_id,
      v_filial_id,
      v_user_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (contato_id) DO UPDATE SET
      nome_completo = EXCLUDED.nome_completo,
      cpf = EXCLUDED.cpf,
      rg = EXCLUDED.rg,
      data_nascimento = EXCLUDED.data_nascimento,
      estado_civil = EXCLUDED.estado_civil,
      profissao = EXCLUDED.profissao,
      nacionalidade = EXCLUDED.nacionalidade,
      naturalidade = EXCLUDED.naturalidade,
      mae = EXCLUDED.mae,
      pai = EXCLUDED.pai,
      updated_at = NOW();
  END IF;

  -- 3. UPSERT em contato_pj (se fornecido e é PJ)
  IF p_dados_pj IS NOT NULL AND LENGTH(REGEXP_REPLACE(COALESCE(p_cpf_cnpj, ''), '[^0-9]', '', 'g')) = 14 THEN
    INSERT INTO contato_pj (
      contato_id,
      razao_social,
      nome_fantasia,
      cnpj,
      inscricao_estadual,
      inscricao_municipal,
      natureza_juridica,
      porte,
      data_abertura,
      atividade_principal,
      empresa_id,
      filial_id,
      tenant_id,
      created_at,
      updated_at
    ) VALUES (
      v_contato_id,
      p_dados_pj->>'razao_social',
      p_dados_pj->>'nome_fantasia',
      p_dados_pj->>'cnpj',
      p_dados_pj->>'inscricao_estadual',
      p_dados_pj->>'inscricao_municipal',
      p_dados_pj->>'natureza_juridica',
      p_dados_pj->>'porte',
      (p_dados_pj->>'data_abertura')::date,
      p_dados_pj->>'atividade_principal',
      v_empresa_id,
      v_filial_id,
      v_user_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (contato_id) DO UPDATE SET
      razao_social = EXCLUDED.razao_social,
      nome_fantasia = EXCLUDED.nome_fantasia,
      cnpj = EXCLUDED.cnpj,
      inscricao_estadual = EXCLUDED.inscricao_estadual,
      inscricao_municipal = EXCLUDED.inscricao_municipal,
      natureza_juridica = EXCLUDED.natureza_juridica,
      porte = EXCLUDED.porte,
      data_abertura = EXCLUDED.data_abertura,
      atividade_principal = EXCLUDED.atividade_principal,
      updated_at = NOW();
  END IF;

  -- 4. Processar meios de contato (email/telefone etc.)
  DELETE FROM contato_meios_contato WHERE contato_id = v_contato_id;
  
  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
  LOOP
    INSERT INTO contato_meios_contato (
      contato_id,
      tipo,
      valor,
      principal,
      empresa_id,
      filial_id,
      tenant_id
    ) VALUES (
      v_contato_id,
      v_meio->>'tipo',
      v_meio->>'valor',
      COALESCE((v_meio->>'principal')::boolean, false),
      v_empresa_id,
      v_filial_id,
      v_user_id
    );
  END LOOP;

  -- 5. Processar endereços
  DELETE FROM contato_enderecos WHERE contato_id = v_contato_id;
  
  FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
  LOOP
    INSERT INTO contato_enderecos (
      contato_id,
      tipo,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
      cep,
      principal,
      empresa_id,
      filial_id,
      tenant_id
    ) VALUES (
      v_contato_id,
      v_endereco->>'tipo',
      v_endereco->>'logradouro',
      v_endereco->>'numero',
      v_endereco->>'complemento',
      v_endereco->>'bairro',
      v_endereco->>'cidade',
      v_endereco->>'uf',
      v_endereco->>'cep',
      COALESCE((v_endereco->>'principal')::boolean, false),
      v_empresa_id,
      v_filial_id,
      v_user_id
    );
  END LOOP;

  -- 6. Processar etiquetas
  DELETE FROM contato_etiquetas WHERE contato_id = v_contato_id;
  
  FOR v_etiqueta IN SELECT * FROM jsonb_array_elements(p_etiquetas)
  LOOP
    INSERT INTO contato_etiquetas (
      contato_id,
      etiqueta_id,
      tenant_id
    ) VALUES (
      v_contato_id,
      (v_etiqueta->>'id')::uuid,
      v_user_id
    )
    ON CONFLICT (contato_id, etiqueta_id) DO NOTHING;
  END LOOP;

  v_result := jsonb_build_object(
    'success', true,
    'id', v_contato_id,
    'message', CASE WHEN p_contato_id IS NULL THEN 'Contato criado com sucesso' ELSE 'Contato atualizado com sucesso' END
  );

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_contato_v2_transacional TO authenticated;

COMMENT ON FUNCTION public.upsert_contato_v2_transacional IS 
'Cria ou atualiza um contato. Tipo calculado automaticamente: 11 dígitos=PF, 14=PJ, vazio=Lead';