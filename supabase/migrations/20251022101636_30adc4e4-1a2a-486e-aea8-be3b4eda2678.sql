-- Remover todas as versões antigas das funções RPC que usam integers
-- e garantir que só existam as versões UUID

-- 1. Remover versões antigas de fn_criar_contato_completo
DROP FUNCTION IF EXISTS public.fn_criar_contato_completo(integer, integer, text, text, text, text, text, text, text, text);

-- 2. Garantir que só existe a versão UUID
DROP FUNCTION IF EXISTS public.fn_criar_contato_completo(uuid, uuid, text, text, text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.fn_criar_contato_completo(
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