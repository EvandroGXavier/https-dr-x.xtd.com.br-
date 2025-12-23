-- Criar RPC transacional para criação/atualização de contatos V2
-- Garante atomicidade e propagação correta de tenant_id/empresa_id/filial_id

CREATE OR REPLACE FUNCTION public.upsert_contato_v2_transacional(
  p_contato_id UUID DEFAULT NULL,
  p_nome TEXT DEFAULT NULL,
  p_cpf_cnpj TEXT DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL,
  p_classificacao TEXT DEFAULT NULL,
  p_tipo_pessoa TEXT DEFAULT 'lead',
  p_pessoa_tipo TEXT DEFAULT 'cliente',
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
  SELECT current_empresa_uuid, current_filial_uuid
  INTO v_empresa_id, v_filial_id
  FROM profiles
  WHERE user_id = v_user_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa/filial configurada';
  END IF;

  -- 1. UPSERT no contato principal (contatos_v2)
  IF p_contato_id IS NULL THEN
    -- INSERT - novo contato
    INSERT INTO contatos_v2 (
      nome_fantasia,
      cpf_cnpj,
      observacao,
      classificacao,
      tipo_pessoa,
      pessoa_tipo,
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
      p_classificacao,
      p_tipo_pessoa,
      p_pessoa_tipo,
      v_empresa_id,
      v_filial_id,
      v_user_id,
      v_user_id,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_contato_id;
  ELSE
    -- UPDATE - contato existente
    UPDATE contatos_v2 SET
      nome_fantasia = COALESCE(p_nome, nome_fantasia),
      cpf_cnpj = COALESCE(p_cpf_cnpj, cpf_cnpj),
      observacao = COALESCE(p_observacao, observacao),
      classificacao = COALESCE(p_classificacao, classificacao),
      tipo_pessoa = COALESCE(p_tipo_pessoa, tipo_pessoa),
      pessoa_tipo = COALESCE(p_pessoa_tipo, pessoa_tipo),
      updated_at = NOW()
    WHERE id = p_contato_id
      AND tenant_id = v_user_id;
    
    v_contato_id := p_contato_id;
  END IF;

  -- 2. UPSERT em contato_pf (se fornecido)
  IF p_dados_pf IS NOT NULL AND p_tipo_pessoa = 'PF' THEN
    INSERT INTO contato_pf (
      contato_id,
      nome_completo,
      cpf,
      rg,
      data_nascimento,
      estado_civil,
      profissao,
      tenant_id,
      empresa_id,
      filial_id,
      created_at,
      updated_at
    ) VALUES (
      v_contato_id,
      p_dados_pf->>'nome_completo',
      p_dados_pf->>'cpf',
      p_dados_pf->>'rg',
      (p_dados_pf->>'data_nascimento')::DATE,
      p_dados_pf->>'estado_civil',
      p_dados_pf->>'profissao',
      v_user_id,
      v_empresa_id,
      v_filial_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (contato_id) DO UPDATE SET
      nome_completo = COALESCE(EXCLUDED.nome_completo, contato_pf.nome_completo),
      cpf = COALESCE(EXCLUDED.cpf, contato_pf.cpf),
      rg = COALESCE(EXCLUDED.rg, contato_pf.rg),
      data_nascimento = COALESCE(EXCLUDED.data_nascimento, contato_pf.data_nascimento),
      estado_civil = COALESCE(EXCLUDED.estado_civil, contato_pf.estado_civil),
      profissao = COALESCE(EXCLUDED.profissao, contato_pf.profissao),
      updated_at = NOW();
  END IF;

  -- 3. UPSERT em contato_pj (se fornecido)
  IF p_dados_pj IS NOT NULL AND p_tipo_pessoa = 'PJ' THEN
    INSERT INTO contato_pj (
      contato_id,
      razao_social,
      cnpj,
      inscricao_estadual,
      inscricao_municipal,
      natureza_juridica,
      data_abertura,
      porte,
      tenant_id,
      empresa_id,
      filial_id,
      created_at,
      updated_at
    ) VALUES (
      v_contato_id,
      p_dados_pj->>'razao_social',
      p_dados_pj->>'cnpj',
      p_dados_pj->>'inscricao_estadual',
      p_dados_pj->>'inscricao_municipal',
      p_dados_pj->>'natureza_juridica',
      (p_dados_pj->>'data_abertura')::DATE,
      p_dados_pj->>'porte',
      v_user_id,
      v_empresa_id,
      v_filial_id,
      NOW(),
      NOW()
    )
    ON CONFLICT (contato_id) DO UPDATE SET
      razao_social = COALESCE(EXCLUDED.razao_social, contato_pj.razao_social),
      cnpj = COALESCE(EXCLUDED.cnpj, contato_pj.cnpj),
      inscricao_estadual = COALESCE(EXCLUDED.inscricao_estadual, contato_pj.inscricao_estadual),
      inscricao_municipal = COALESCE(EXCLUDED.inscricao_municipal, contato_pj.inscricao_municipal),
      natureza_juridica = COALESCE(EXCLUDED.natureza_juridica, contato_pj.natureza_juridica),
      data_abertura = COALESCE(EXCLUDED.data_abertura, contato_pj.data_abertura),
      porte = COALESCE(EXCLUDED.porte, contato_pj.porte),
      updated_at = NOW();
  END IF;

  -- 4. BATCH INSERT/UPDATE meios de contato
  -- Limpar meios existentes e reinserir (estratégia de replace)
  IF p_contato_id IS NOT NULL THEN
    DELETE FROM contato_meios_contato
    WHERE contato_id = v_contato_id AND tenant_id = v_user_id;
  END IF;

  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
  LOOP
    INSERT INTO contato_meios_contato (
      contato_id,
      tipo,
      valor,
      principal,
      tenant_id,
      empresa_id,
      filial_id,
      created_at,
      updated_at
    ) VALUES (
      v_contato_id,
      v_meio->>'tipo',
      v_meio->>'valor',
      COALESCE((v_meio->>'principal')::boolean, false),
      v_user_id,
      v_empresa_id,
      v_filial_id,
      NOW(),
      NOW()
    );
  END LOOP;

  -- 5. BATCH INSERT/UPDATE endereços
  -- Limpar endereços existentes e reinserir
  IF p_contato_id IS NOT NULL THEN
    DELETE FROM contato_enderecos
    WHERE contato_id = v_contato_id AND tenant_id = v_user_id;
  END IF;

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
      tenant_id,
      empresa_id,
      filial_id,
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
      v_user_id,
      v_empresa_id,
      v_filial_id,
      NOW(),
      NOW()
    );
  END LOOP;

  -- 6. BATCH INSERT/UPDATE etiquetas (via etiqueta_vinculos)
  -- Limpar vínculos existentes para este contato
  IF p_contato_id IS NOT NULL THEN
    DELETE FROM etiqueta_vinculos
    WHERE entidade_tipo = 'contato'
      AND entidade_id = v_contato_id
      AND tenant_id = v_user_id;
  END IF;

  FOR v_etiqueta IN SELECT * FROM jsonb_array_elements(p_etiquetas)
  LOOP
    INSERT INTO etiqueta_vinculos (
      etiqueta_id,
      entidade_tipo,
      entidade_id,
      tenant_id,
      empresa_id,
      filial_id,
      created_at
    ) VALUES (
      (v_etiqueta->>'etiqueta_id')::UUID,
      'contato',
      v_contato_id,
      v_user_id,
      v_empresa_id,
      v_filial_id,
      NOW()
    );
  END LOOP;

  -- Construir resultado JSON
  v_result := jsonb_build_object(
    'id', v_contato_id,
    'success', true,
    'message', CASE 
      WHEN p_contato_id IS NULL THEN 'Contato criado com sucesso'
      ELSE 'Contato atualizado com sucesso'
    END
  );

  RETURN v_result;
END;
$$;

-- Permissões
GRANT EXECUTE ON FUNCTION public.upsert_contato_v2_transacional TO authenticated;

COMMENT ON FUNCTION public.upsert_contato_v2_transacional IS 
'Cria ou atualiza um contato de forma transacional, garantindo atomicidade e propagação correta de tenant_id/empresa_id/filial_id para todas as tabelas relacionadas (meios_contato, endereços, PF/PJ, etiquetas)';