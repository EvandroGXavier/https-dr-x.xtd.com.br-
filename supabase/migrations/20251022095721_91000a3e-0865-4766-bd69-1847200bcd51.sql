-- Atualizar funções RPC de contatos para usar UUIDs

-- 1. fn_criar_contato_completo
DROP FUNCTION IF EXISTS fn_criar_contato_completo(INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION fn_criar_contato_completo(
  p_empresa_id UUID,
  p_filial_id UUID,
  p_nome TEXT,
  p_tipo_pessoa TEXT,
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_meios_contato TEXT DEFAULT '[]',
  p_enderecos TEXT DEFAULT '[]',
  p_dados_pf TEXT DEFAULT NULL,
  p_dados_pj TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id UUID;
  v_meio JSONB;
  v_endereco JSONB;
  v_user_id UUID;
BEGIN
  -- Obter user_id da sessão
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Criar o contato base
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
    p_empresa_id,
    p_filial_id,
    v_user_id,
    v_user_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contato_id;

  -- Inserir meios de contato se fornecidos
  IF p_meios_contato IS NOT NULL AND p_meios_contato != '[]' THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato::jsonb)
    LOOP
      INSERT INTO contato_meios_contato (
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
        COALESCE((v_meio->>'principal')::boolean, false),
        p_empresa_id,
        p_filial_id,
        v_user_id,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;

  -- Inserir endereços se fornecidos
  IF p_enderecos IS NOT NULL AND p_enderecos != '[]' THEN
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos::jsonb)
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
        tenant_id,
        created_at,
        updated_at
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
        p_empresa_id,
        p_filial_id,
        v_user_id,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;

  -- Inserir dados PF se fornecidos
  IF p_dados_pf IS NOT NULL AND p_tipo_pessoa = 'PF' THEN
    INSERT INTO contato_pf (
      contato_id,
      tenant_id,
      empresa_id,
      filial_id,
      created_at,
      updated_at
    ) VALUES (
      v_contato_id,
      v_user_id,
      p_empresa_id,
      p_filial_id,
      NOW(),
      NOW()
    );
  END IF;

  -- Inserir dados PJ se fornecidos
  IF p_dados_pj IS NOT NULL AND p_tipo_pessoa = 'PJ' THEN
    DECLARE
      v_dados_pj_json JSONB := p_dados_pj::jsonb;
    BEGIN
      INSERT INTO contato_pj (
        contato_id,
        razao_social,
        cnpj,
        natureza_juridica,
        data_abertura,
        tenant_id,
        empresa_id,
        filial_id,
        created_at,
        updated_at
      ) VALUES (
        v_contato_id,
        v_dados_pj_json->>'razao_social',
        v_dados_pj_json->>'cnpj',
        v_dados_pj_json->>'natureza_juridica',
        CASE 
          WHEN v_dados_pj_json->>'data_abertura' IS NOT NULL 
          THEN (v_dados_pj_json->>'data_abertura')::date
          ELSE NULL
        END,
        v_user_id,
        p_empresa_id,
        p_filial_id,
        NOW(),
        NOW()
      );
    END;
  END IF;

  RETURN v_contato_id;
END;
$$;

-- 2. fn_ler_contato_completo
DROP FUNCTION IF EXISTS fn_ler_contato_completo(INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION fn_ler_contato_completo(
  p_empresa_id UUID,
  p_filial_id UUID,
  p_contato_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'nome_fantasia', c.nome_fantasia,
    'cpf_cnpj', c.cpf_cnpj,
    'observacao', c.observacao,
    'empresa_id', c.empresa_id,
    'filial_id', c.filial_id,
    'tenant_id', c.tenant_id,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'meios_contato', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', m.id,
        'tipo', m.tipo,
        'valor', m.valor,
        'principal', m.principal
      ))
      FROM contato_meios_contato m
      WHERE m.contato_id = c.id),
      '[]'::jsonb
    ),
    'enderecos', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'tipo', e.tipo,
        'logradouro', e.logradouro,
        'numero', e.numero,
        'complemento', e.complemento,
        'bairro', e.bairro,
        'cidade', e.cidade,
        'uf', e.uf,
        'cep', e.cep,
        'principal', e.principal
      ))
      FROM contato_enderecos e
      WHERE e.contato_id = c.id),
      '[]'::jsonb
    ),
    'dados_pf', (
      SELECT jsonb_build_object(
        'id', pf.id,
        'nome_completo', pf.nome_completo,
        'cpf', pf.cpf,
        'data_nascimento', pf.data_nascimento,
        'estado_civil', pf.estado_civil,
        'profissao', pf.profissao,
        'nacionalidade', pf.nacionalidade
      )
      FROM contato_pf pf
      WHERE pf.contato_id = c.id
    ),
    'dados_pj', (
      SELECT jsonb_build_object(
        'id', pj.id,
        'razao_social', pj.razao_social,
        'cnpj', pj.cnpj,
        'natureza_juridica', pj.natureza_juridica,
        'data_abertura', pj.data_abertura
      )
      FROM contato_pj pj
      WHERE pj.contato_id = c.id
    )
  ) INTO v_result
  FROM contatos_v2 c
  WHERE c.id = p_contato_id
    AND c.empresa_id = p_empresa_id
    AND c.tenant_id = v_user_id;

  RETURN v_result;
END;
$$;

-- 3. fn_atualizar_contato_completo
DROP FUNCTION IF EXISTS fn_atualizar_contato_completo(INTEGER, INTEGER, UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION fn_atualizar_contato_completo(
  p_empresa_id UUID,
  p_filial_id UUID,
  p_contato_id UUID,
  p_nome TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_meios_contato TEXT DEFAULT '[]',
  p_enderecos TEXT DEFAULT '[]',
  p_dados_pf TEXT DEFAULT NULL,
  p_dados_pj TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_meio JSONB;
  v_endereco JSONB;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Atualizar contato base
  UPDATE contatos_v2
  SET
    nome_fantasia = COALESCE(p_nome, nome_fantasia),
    observacao = COALESCE(p_observacao, observacao),
    updated_at = NOW()
  WHERE id = p_contato_id
    AND empresa_id = p_empresa_id
    AND tenant_id = v_user_id;

  -- Atualizar meios de contato (deletar e recriar)
  IF p_meios_contato IS NOT NULL AND p_meios_contato != '[]' THEN
    DELETE FROM contato_meios_contato WHERE contato_id = p_contato_id;
    
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato::jsonb)
    LOOP
      INSERT INTO contato_meios_contato (
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
        p_contato_id,
        v_meio->>'tipo',
        v_meio->>'valor',
        COALESCE((v_meio->>'principal')::boolean, false),
        p_empresa_id,
        p_filial_id,
        v_user_id,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;

  -- Atualizar endereços (deletar e recriar)
  IF p_enderecos IS NOT NULL AND p_enderecos != '[]' THEN
    DELETE FROM contato_enderecos WHERE contato_id = p_contato_id;
    
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos::jsonb)
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
        tenant_id,
        created_at,
        updated_at
      ) VALUES (
        p_contato_id,
        v_endereco->>'tipo',
        v_endereco->>'logradouro',
        v_endereco->>'numero',
        v_endereco->>'complemento',
        v_endereco->>'bairro',
        v_endereco->>'cidade',
        v_endereco->>'uf',
        v_endereco->>'cep',
        COALESCE((v_endereco->>'principal')::boolean, false),
        p_empresa_id,
        p_filial_id,
        v_user_id,
        NOW(),
        NOW()
      );
    END LOOP;
  END IF;

  RETURN TRUE;
END;
$$;

-- 4. fn_excluir_contato_logico
DROP FUNCTION IF EXISTS fn_excluir_contato_logico(INTEGER, INTEGER, UUID);

CREATE OR REPLACE FUNCTION fn_excluir_contato_logico(
  p_empresa_id UUID,
  p_filial_id UUID,
  p_contato_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Soft delete (se houver coluna deleted_at)
  UPDATE contatos_v2
  SET
    updated_at = NOW()
  WHERE id = p_contato_id
    AND empresa_id = p_empresa_id
    AND tenant_id = v_user_id;

  RETURN FOUND;
END;
$$;