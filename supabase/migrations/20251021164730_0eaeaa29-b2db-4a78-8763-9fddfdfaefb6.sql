-- =====================================================
-- FASE 1: RPC FUNCTIONS PARA CRUD COMPLETO DE CONTATOS
-- =====================================================

-- 1.1 FUNÇÃO: Criar contato completo (atômico)
CREATE OR REPLACE FUNCTION fn_criar_contato_completo(
  p_nome text,
  p_cpf_cnpj text DEFAULT NULL,
  p_observacoes text DEFAULT NULL,
  p_classificacao text DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_meios_contato jsonb DEFAULT '[]'::jsonb,
  p_enderecos jsonb DEFAULT '[]'::jsonb,
  p_dados_pf jsonb DEFAULT NULL,
  p_dados_pj jsonb DEFAULT NULL,
  p_empresa_id uuid DEFAULT NULL,
  p_filial_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contato_id uuid;
  v_tenant_id uuid;
  v_user_id uuid;
  v_tipo_pessoa text;
  v_meio record;
  v_endereco record;
BEGIN
  -- Obter tenant_id e user_id do contexto
  v_tenant_id := auth.uid();
  v_user_id := auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Determinar tipo de pessoa
  IF p_dados_pj IS NOT NULL OR (p_cpf_cnpj IS NOT NULL AND length(p_cpf_cnpj) > 11) THEN
    v_tipo_pessoa := 'pj';
    -- Validar empresa_id e filial_id obrigatórios para PJ
    IF p_empresa_id IS NULL THEN
      RAISE EXCEPTION 'empresa_id é obrigatório para Pessoa Jurídica';
    END IF;
  ELSIF p_dados_pf IS NOT NULL OR (p_cpf_cnpj IS NOT NULL AND length(p_cpf_cnpj) <= 11) THEN
    v_tipo_pessoa := 'pf';
  ELSE
    v_tipo_pessoa := 'lead';
  END IF;

  -- Inserir registro principal
  INSERT INTO contatos_v2 (
    nome_fantasia,
    cpf_cnpj,
    observacoes,
    classificacao,
    responsavel_id,
    tenant_id,
    empresa_id,
    filial_id,
    created_by
  ) VALUES (
    p_nome,
    p_cpf_cnpj,
    p_observacoes,
    p_classificacao,
    p_responsavel_id,
    v_tenant_id,
    p_empresa_id,
    p_filial_id,
    v_user_id
  ) RETURNING id INTO v_contato_id;

  -- Inserir dados PF se fornecido
  IF p_dados_pf IS NOT NULL AND v_tipo_pessoa = 'pf' THEN
    INSERT INTO contato_pf (
      contato_id,
      nome_completo,
      cpf,
      rg,
      orgao_expedidor,
      data_nascimento,
      sexo,
      estado_civil,
      nacionalidade,
      naturalidade,
      profissao,
      emprego,
      renda,
      tenant_id,
      empresa_id,
      filial_id
    ) VALUES (
      v_contato_id,
      p_dados_pf->>'nome_completo',
      p_dados_pf->>'cpf',
      p_dados_pf->>'rg',
      p_dados_pf->>'orgao_expedidor',
      (p_dados_pf->>'data_nascimento')::date,
      p_dados_pf->>'sexo',
      p_dados_pf->>'estado_civil',
      p_dados_pf->>'nacionalidade',
      p_dados_pf->>'naturalidade',
      p_dados_pf->>'profissao',
      p_dados_pf->>'emprego',
      (p_dados_pf->>'renda')::numeric,
      v_tenant_id,
      p_empresa_id,
      p_filial_id
    );
  END IF;

  -- Inserir dados PJ se fornecido
  IF p_dados_pj IS NOT NULL AND v_tipo_pessoa = 'pj' THEN
    INSERT INTO contato_pj (
      contato_id,
      razao_social,
      cnpj,
      inscricao_estadual,
      inscricao_municipal,
      natureza_juridica,
      data_abertura,
      regime_tributario,
      capital_social,
      tenant_id,
      empresa_id,
      filial_id
    ) VALUES (
      v_contato_id,
      p_dados_pj->>'razao_social',
      p_dados_pj->>'cnpj',
      p_dados_pj->>'inscricao_estadual',
      p_dados_pj->>'inscricao_municipal',
      p_dados_pj->>'natureza_juridica',
      (p_dados_pj->>'data_abertura')::date,
      p_dados_pj->>'regime_tributario',
      (p_dados_pj->>'capital_social')::numeric,
      v_tenant_id,
      p_empresa_id,
      p_filial_id
    );
  END IF;

  -- Inserir meios de contato
  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
  LOOP
    INSERT INTO contato_meios_contato (
      contato_id,
      tipo,
      valor,
      principal,
      tenant_id,
      empresa_id,
      filial_id
    ) VALUES (
      v_contato_id,
      v_meio.value->>'tipo',
      v_meio.value->>'valor',
      COALESCE((v_meio.value->>'principal')::boolean, false),
      v_tenant_id,
      p_empresa_id,
      p_filial_id
    );
  END LOOP;

  -- Inserir endereços
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
      filial_id
    ) VALUES (
      v_contato_id,
      v_endereco.value->>'tipo',
      v_endereco.value->>'logradouro',
      v_endereco.value->>'numero',
      v_endereco.value->>'complemento',
      v_endereco.value->>'bairro',
      v_endereco.value->>'cidade',
      v_endereco.value->>'uf',
      v_endereco.value->>'cep',
      COALESCE((v_endereco.value->>'principal')::boolean, false),
      v_tenant_id,
      p_empresa_id,
      p_filial_id
    );
  END LOOP;

  -- Retornar resultado
  RETURN jsonb_build_object(
    'id', v_contato_id,
    'tipo_pessoa', v_tipo_pessoa,
    'success', true,
    'message', 'Contato criado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar contato: %', SQLERRM;
END;
$$;

-- 1.2 FUNÇÃO: Ler contato completo
CREATE OR REPLACE FUNCTION fn_ler_contato_completo(p_contato_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_tenant_id uuid;
BEGIN
  v_tenant_id := auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'nome_fantasia', c.nome_fantasia,
    'cpf_cnpj', c.cpf_cnpj,
    'observacoes', c.observacoes,
    'classificacao', c.classificacao,
    'responsavel_id', c.responsavel_id,
    'tenant_id', c.tenant_id,
    'empresa_id', c.empresa_id,
    'filial_id', c.filial_id,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'tipo_pessoa', CASE 
      WHEN pf.id IS NOT NULL THEN 'pf'
      WHEN pj.id IS NOT NULL THEN 'pj'
      ELSE 'lead'
    END,
    'dados_pf', CASE WHEN pf.id IS NOT NULL THEN row_to_json(pf.*) ELSE NULL END,
    'dados_pj', CASE WHEN pj.id IS NOT NULL THEN row_to_json(pj.*) ELSE NULL END,
    'meios_contato', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', mc.id,
        'tipo', mc.tipo,
        'valor', mc.valor,
        'principal', mc.principal
      ))
      FROM contato_meios_contato mc
      WHERE mc.contato_id = c.id),
      '[]'::jsonb
    ),
    'enderecos', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', ce.id,
        'tipo', ce.tipo,
        'logradouro', ce.logradouro,
        'numero', ce.numero,
        'complemento', ce.complemento,
        'bairro', ce.bairro,
        'cidade', ce.cidade,
        'uf', ce.uf,
        'cep', ce.cep,
        'principal', ce.principal
      ))
      FROM contato_enderecos ce
      WHERE ce.contato_id = c.id),
      '[]'::jsonb
    )
  ) INTO v_result
  FROM contatos_v2 c
  LEFT JOIN contato_pf pf ON pf.contato_id = c.id
  LEFT JOIN contato_pj pj ON pj.contato_id = c.id
  WHERE c.id = p_contato_id
    AND c.tenant_id = v_tenant_id
    AND c.deleted_at IS NULL;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Contato não encontrado';
  END IF;

  RETURN v_result;
END;
$$;

-- 1.3 FUNÇÃO: Atualizar contato completo
CREATE OR REPLACE FUNCTION fn_atualizar_contato_completo(
  p_contato_id uuid,
  p_nome text DEFAULT NULL,
  p_cpf_cnpj text DEFAULT NULL,
  p_observacoes text DEFAULT NULL,
  p_classificacao text DEFAULT NULL,
  p_responsavel_id uuid DEFAULT NULL,
  p_meios_contato jsonb DEFAULT NULL,
  p_enderecos jsonb DEFAULT NULL,
  p_dados_pf jsonb DEFAULT NULL,
  p_dados_pj jsonb DEFAULT NULL,
  p_empresa_id uuid DEFAULT NULL,
  p_filial_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
  v_meio record;
  v_endereco record;
BEGIN
  v_tenant_id := auth.uid();
  v_user_id := auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Atualizar registro principal
  UPDATE contatos_v2 SET
    nome_fantasia = COALESCE(p_nome, nome_fantasia),
    cpf_cnpj = COALESCE(p_cpf_cnpj, cpf_cnpj),
    observacoes = COALESCE(p_observacoes, observacoes),
    classificacao = COALESCE(p_classificacao, classificacao),
    responsavel_id = COALESCE(p_responsavel_id, responsavel_id),
    empresa_id = COALESCE(p_empresa_id, empresa_id),
    filial_id = COALESCE(p_filial_id, filial_id),
    updated_at = now(),
    updated_by = v_user_id
  WHERE id = p_contato_id
    AND tenant_id = v_tenant_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contato não encontrado ou sem permissão';
  END IF;

  -- Atualizar dados PF se fornecido
  IF p_dados_pf IS NOT NULL THEN
    INSERT INTO contato_pf (
      contato_id, nome_completo, cpf, rg, orgao_expedidor,
      data_nascimento, sexo, estado_civil, nacionalidade,
      naturalidade, profissao, emprego, renda,
      tenant_id, empresa_id, filial_id
    ) VALUES (
      p_contato_id,
      p_dados_pf->>'nome_completo',
      p_dados_pf->>'cpf',
      p_dados_pf->>'rg',
      p_dados_pf->>'orgao_expedidor',
      (p_dados_pf->>'data_nascimento')::date,
      p_dados_pf->>'sexo',
      p_dados_pf->>'estado_civil',
      p_dados_pf->>'nacionalidade',
      p_dados_pf->>'naturalidade',
      p_dados_pf->>'profissao',
      p_dados_pf->>'emprego',
      (p_dados_pf->>'renda')::numeric,
      v_tenant_id,
      p_empresa_id,
      p_filial_id
    )
    ON CONFLICT (contato_id) DO UPDATE SET
      nome_completo = EXCLUDED.nome_completo,
      cpf = EXCLUDED.cpf,
      rg = EXCLUDED.rg,
      orgao_expedidor = EXCLUDED.orgao_expedidor,
      data_nascimento = EXCLUDED.data_nascimento,
      sexo = EXCLUDED.sexo,
      estado_civil = EXCLUDED.estado_civil,
      nacionalidade = EXCLUDED.nacionalidade,
      naturalidade = EXCLUDED.naturalidade,
      profissao = EXCLUDED.profissao,
      emprego = EXCLUDED.emprego,
      renda = EXCLUDED.renda,
      updated_at = now();
  END IF;

  -- Atualizar dados PJ se fornecido
  IF p_dados_pj IS NOT NULL THEN
    INSERT INTO contato_pj (
      contato_id, razao_social, cnpj, inscricao_estadual,
      inscricao_municipal, natureza_juridica, data_abertura,
      regime_tributario, capital_social,
      tenant_id, empresa_id, filial_id
    ) VALUES (
      p_contato_id,
      p_dados_pj->>'razao_social',
      p_dados_pj->>'cnpj',
      p_dados_pj->>'inscricao_estadual',
      p_dados_pj->>'inscricao_municipal',
      p_dados_pj->>'natureza_juridica',
      (p_dados_pj->>'data_abertura')::date,
      p_dados_pj->>'regime_tributario',
      (p_dados_pj->>'capital_social')::numeric,
      v_tenant_id,
      p_empresa_id,
      p_filial_id
    )
    ON CONFLICT (contato_id) DO UPDATE SET
      razao_social = EXCLUDED.razao_social,
      cnpj = EXCLUDED.cnpj,
      inscricao_estadual = EXCLUDED.inscricao_estadual,
      inscricao_municipal = EXCLUDED.inscricao_municipal,
      natureza_juridica = EXCLUDED.natureza_juridica,
      data_abertura = EXCLUDED.data_abertura,
      regime_tributario = EXCLUDED.regime_tributario,
      capital_social = EXCLUDED.capital_social,
      updated_at = now();
  END IF;

  -- Atualizar meios de contato se fornecido
  IF p_meios_contato IS NOT NULL THEN
    -- Deletar meios existentes
    DELETE FROM contato_meios_contato WHERE contato_id = p_contato_id;
    
    -- Inserir novos meios
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO contato_meios_contato (
        contato_id, tipo, valor, principal,
        tenant_id, empresa_id, filial_id
      ) VALUES (
        p_contato_id,
        v_meio.value->>'tipo',
        v_meio.value->>'valor',
        COALESCE((v_meio.value->>'principal')::boolean, false),
        v_tenant_id,
        p_empresa_id,
        p_filial_id
      );
    END LOOP;
  END IF;

  -- Atualizar endereços se fornecido
  IF p_enderecos IS NOT NULL THEN
    -- Deletar endereços existentes
    DELETE FROM contato_enderecos WHERE contato_id = p_contato_id;
    
    -- Inserir novos endereços
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
    LOOP
      INSERT INTO contato_enderecos (
        contato_id, tipo, logradouro, numero, complemento,
        bairro, cidade, uf, cep, principal,
        tenant_id, empresa_id, filial_id
      ) VALUES (
        p_contato_id,
        v_endereco.value->>'tipo',
        v_endereco.value->>'logradouro',
        v_endereco.value->>'numero',
        v_endereco.value->>'complemento',
        v_endereco.value->>'bairro',
        v_endereco.value->>'cidade',
        v_endereco.value->>'uf',
        v_endereco.value->>'cep',
        COALESCE((v_endereco.value->>'principal')::boolean, false),
        v_tenant_id,
        p_empresa_id,
        p_filial_id
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contato atualizado com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao atualizar contato: %', SQLERRM;
END;
$$;

-- 1.4 FUNÇÃO: Excluir contato (lógico)
CREATE OR REPLACE FUNCTION fn_excluir_contato_logico(p_contato_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid;
BEGIN
  v_tenant_id := auth.uid();
  v_user_id := auth.uid();
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Marcar como deletado
  UPDATE contatos_v2 SET
    deleted_at = now(),
    updated_by = v_user_id
  WHERE id = p_contato_id
    AND tenant_id = v_tenant_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contato não encontrado ou já deletado';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Contato excluído com sucesso'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao excluir contato: %', SQLERRM;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION fn_criar_contato_completo TO authenticated;
GRANT EXECUTE ON FUNCTION fn_ler_contato_completo TO authenticated;
GRANT EXECUTE ON FUNCTION fn_atualizar_contato_completo TO authenticated;
GRANT EXECUTE ON FUNCTION fn_excluir_contato_logico TO authenticated;