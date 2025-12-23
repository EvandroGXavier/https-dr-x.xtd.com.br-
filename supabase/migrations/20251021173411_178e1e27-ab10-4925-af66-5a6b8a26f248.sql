-- Recriar função fn_criar_contato_completo com tipos INTEGER
CREATE OR REPLACE FUNCTION fn_criar_contato_completo(
  p_empresa_id integer,
  p_filial_id integer,
  p_nome text,
  p_tipo_pessoa text,
  p_cpf_cnpj text DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_meios_contato jsonb DEFAULT '[]'::jsonb,
  p_enderecos jsonb DEFAULT '[]'::jsonb,
  p_dados_pf jsonb DEFAULT NULL,
  p_dados_pj jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_contato_id uuid;
  v_tenant_id integer;
  v_meio jsonb;
  v_endereco jsonb;
  v_result jsonb;
BEGIN
  -- Validar tenant_id
  v_tenant_id := current_setting('app.tenant_id', true)::integer;
  
  IF v_tenant_id IS NULL OR v_tenant_id != p_empresa_id THEN
    RAISE EXCEPTION 'Acesso negado: tenant_id inválido';
  END IF;

  -- Inserir contato base
  INSERT INTO contatos_v2 (
    empresa_id,
    filial_id,
    nome,
    tipo_pessoa,
    cpf_cnpj,
    observacao
  )
  VALUES (
    p_empresa_id,
    p_filial_id,
    p_nome,
    p_tipo_pessoa,
    p_cpf_cnpj,
    p_observacao
  )
  RETURNING id INTO v_contato_id;

  -- Inserir meios de contato
  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
  LOOP
    INSERT INTO contato_meios_contato (
      contato_id,
      empresa_id,
      filial_id,
      tipo,
      valor,
      observacao
    )
    VALUES (
      v_contato_id,
      p_empresa_id,
      p_filial_id,
      v_meio->>'tipo',
      v_meio->>'valor',
      v_meio->>'observacao'
    );
  END LOOP;

  -- Inserir endereços
  FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
  LOOP
    INSERT INTO contato_enderecos (
      contato_id,
      empresa_id,
      filial_id,
      tipo,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      pais
    )
    VALUES (
      v_contato_id,
      p_empresa_id,
      p_filial_id,
      v_endereco->>'tipo',
      v_endereco->>'cep',
      v_endereco->>'logradouro',
      v_endereco->>'numero',
      v_endereco->>'complemento',
      v_endereco->>'bairro',
      v_endereco->>'cidade',
      v_endereco->>'estado',
      COALESCE(v_endereco->>'pais', 'Brasil')
    );
  END LOOP;

  -- Inserir dados específicos de PF
  IF p_tipo_pessoa = 'PF' AND p_dados_pf IS NOT NULL THEN
    INSERT INTO contato_pf (
      contato_id,
      empresa_id,
      filial_id,
      rg,
      orgao_emissor,
      data_nascimento,
      estado_civil,
      profissao,
      nacionalidade
    )
    VALUES (
      v_contato_id,
      p_empresa_id,
      p_filial_id,
      p_dados_pf->>'rg',
      p_dados_pf->>'orgao_emissor',
      (p_dados_pf->>'data_nascimento')::date,
      p_dados_pf->>'estado_civil',
      p_dados_pf->>'profissao',
      p_dados_pf->>'nacionalidade'
    );
  END IF;

  -- Inserir dados específicos de PJ
  IF p_tipo_pessoa = 'PJ' AND p_dados_pj IS NOT NULL THEN
    INSERT INTO contato_pj (
      contato_id,
      empresa_id,
      filial_id,
      nome_fantasia,
      inscricao_estadual,
      inscricao_municipal,
      data_fundacao,
      porte_empresa,
      natureza_juridica
    )
    VALUES (
      v_contato_id,
      p_empresa_id,
      p_filial_id,
      p_dados_pj->>'nome_fantasia',
      p_dados_pj->>'inscricao_estadual',
      p_dados_pj->>'inscricao_municipal',
      (p_dados_pj->>'data_fundacao')::date,
      p_dados_pj->>'porte_empresa',
      p_dados_pj->>'natureza_juridica'
    );
  END IF;

  -- Retornar dados completos
  SELECT jsonb_build_object(
    'id', id,
    'nome', nome,
    'tipo_pessoa', tipo_pessoa,
    'cpf_cnpj', cpf_cnpj,
    'observacao', observacao,
    'empresa_id', empresa_id,
    'filial_id', filial_id
  )
  INTO v_result
  FROM contatos_v2
  WHERE id = v_contato_id;

  RETURN v_result;
END;
$$;

-- Recriar função fn_ler_contato_completo com tipos INTEGER
CREATE OR REPLACE FUNCTION fn_ler_contato_completo(
  p_empresa_id integer,
  p_filial_id integer,
  p_contato_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id integer;
  v_result jsonb;
BEGIN
  -- Validar tenant_id
  v_tenant_id := current_setting('app.tenant_id', true)::integer;
  
  IF v_tenant_id IS NULL OR v_tenant_id != p_empresa_id THEN
    RAISE EXCEPTION 'Acesso negado: tenant_id inválido';
  END IF;

  -- Buscar contato completo
  SELECT jsonb_build_object(
    'id', c.id,
    'nome', c.nome,
    'tipo_pessoa', c.tipo_pessoa,
    'cpf_cnpj', c.cpf_cnpj,
    'observacao', c.observacao,
    'empresa_id', c.empresa_id,
    'filial_id', c.filial_id,
    'meios_contato', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', mc.id,
        'tipo', mc.tipo,
        'valor', mc.valor,
        'observacao', mc.observacao
      ))
      FROM contato_meios_contato mc
      WHERE mc.contato_id = c.id AND mc.deleted_at IS NULL),
      '[]'::jsonb
    ),
    'enderecos', COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
        'id', e.id,
        'tipo', e.tipo,
        'cep', e.cep,
        'logradouro', e.logradouro,
        'numero', e.numero,
        'complemento', e.complemento,
        'bairro', e.bairro,
        'cidade', e.cidade,
        'estado', e.estado,
        'pais', e.pais
      ))
      FROM contato_enderecos e
      WHERE e.contato_id = c.id AND e.deleted_at IS NULL),
      '[]'::jsonb
    ),
    'dados_pf', CASE 
      WHEN c.tipo_pessoa = 'PF' THEN
        (SELECT jsonb_build_object(
          'rg', pf.rg,
          'orgao_emissor', pf.orgao_emissor,
          'data_nascimento', pf.data_nascimento,
          'estado_civil', pf.estado_civil,
          'profissao', pf.profissao,
          'nacionalidade', pf.nacionalidade
        )
        FROM contato_pf pf
        WHERE pf.contato_id = c.id AND pf.deleted_at IS NULL)
      ELSE NULL
    END,
    'dados_pj', CASE 
      WHEN c.tipo_pessoa = 'PJ' THEN
        (SELECT jsonb_build_object(
          'nome_fantasia', pj.nome_fantasia,
          'inscricao_estadual', pj.inscricao_estadual,
          'inscricao_municipal', pj.inscricao_municipal,
          'data_fundacao', pj.data_fundacao,
          'porte_empresa', pj.porte_empresa,
          'natureza_juridica', pj.natureza_juridica
        )
        FROM contato_pj pj
        WHERE pj.contato_id = c.id AND pj.deleted_at IS NULL)
      ELSE NULL
    END
  )
  INTO v_result
  FROM contatos_v2 c
  WHERE c.id = p_contato_id 
    AND c.empresa_id = p_empresa_id
    AND c.filial_id = p_filial_id
    AND c.deleted_at IS NULL;

  RETURN v_result;
END;
$$;

-- Recriar função fn_atualizar_contato_completo com tipos INTEGER
CREATE OR REPLACE FUNCTION fn_atualizar_contato_completo(
  p_empresa_id integer,
  p_filial_id integer,
  p_contato_id uuid,
  p_nome text,
  p_observacao text DEFAULT NULL,
  p_meios_contato jsonb DEFAULT '[]'::jsonb,
  p_enderecos jsonb DEFAULT '[]'::jsonb,
  p_dados_pf jsonb DEFAULT NULL,
  p_dados_pj jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id integer;
  v_tipo_pessoa text;
  v_meio jsonb;
  v_endereco jsonb;
BEGIN
  -- Validar tenant_id
  v_tenant_id := current_setting('app.tenant_id', true)::integer;
  
  IF v_tenant_id IS NULL OR v_tenant_id != p_empresa_id THEN
    RAISE EXCEPTION 'Acesso negado: tenant_id inválido';
  END IF;

  -- Obter tipo de pessoa
  SELECT tipo_pessoa INTO v_tipo_pessoa
  FROM contatos_v2
  WHERE id = p_contato_id 
    AND empresa_id = p_empresa_id
    AND filial_id = p_filial_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contato não encontrado';
  END IF;

  -- Atualizar contato base
  UPDATE contatos_v2
  SET 
    nome = p_nome,
    observacao = p_observacao,
    updated_at = now()
  WHERE id = p_contato_id
    AND empresa_id = p_empresa_id
    AND filial_id = p_filial_id;

  -- Atualizar meios de contato (soft delete dos antigos)
  UPDATE contato_meios_contato
  SET deleted_at = now()
  WHERE contato_id = p_contato_id AND deleted_at IS NULL;

  -- Inserir novos meios de contato
  FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
  LOOP
    INSERT INTO contato_meios_contato (
      contato_id,
      empresa_id,
      filial_id,
      tipo,
      valor,
      observacao
    )
    VALUES (
      p_contato_id,
      p_empresa_id,
      p_filial_id,
      v_meio->>'tipo',
      v_meio->>'valor',
      v_meio->>'observacao'
    );
  END LOOP;

  -- Atualizar endereços (soft delete dos antigos)
  UPDATE contato_enderecos
  SET deleted_at = now()
  WHERE contato_id = p_contato_id AND deleted_at IS NULL;

  -- Inserir novos endereços
  FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
  LOOP
    INSERT INTO contato_enderecos (
      contato_id,
      empresa_id,
      filial_id,
      tipo,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      pais
    )
    VALUES (
      p_contato_id,
      p_empresa_id,
      p_filial_id,
      v_endereco->>'tipo',
      v_endereco->>'cep',
      v_endereco->>'logradouro',
      v_endereco->>'numero',
      v_endereco->>'complemento',
      v_endereco->>'bairro',
      v_endereco->>'cidade',
      v_endereco->>'estado',
      COALESCE(v_endereco->>'pais', 'Brasil')
    );
  END LOOP;

  -- Atualizar dados específicos de PF
  IF v_tipo_pessoa = 'PF' AND p_dados_pf IS NOT NULL THEN
    UPDATE contato_pf
    SET 
      rg = p_dados_pf->>'rg',
      orgao_emissor = p_dados_pf->>'orgao_emissor',
      data_nascimento = (p_dados_pf->>'data_nascimento')::date,
      estado_civil = p_dados_pf->>'estado_civil',
      profissao = p_dados_pf->>'profissao',
      nacionalidade = p_dados_pf->>'nacionalidade',
      updated_at = now()
    WHERE contato_id = p_contato_id AND deleted_at IS NULL;
  END IF;

  -- Atualizar dados específicos de PJ
  IF v_tipo_pessoa = 'PJ' AND p_dados_pj IS NOT NULL THEN
    UPDATE contato_pj
    SET 
      nome_fantasia = p_dados_pj->>'nome_fantasia',
      inscricao_estadual = p_dados_pj->>'inscricao_estadual',
      inscricao_municipal = p_dados_pj->>'inscricao_municipal',
      data_fundacao = (p_dados_pj->>'data_fundacao')::date,
      porte_empresa = p_dados_pj->>'porte_empresa',
      natureza_juridica = p_dados_pj->>'natureza_juridica',
      updated_at = now()
    WHERE contato_id = p_contato_id AND deleted_at IS NULL;
  END IF;

  RETURN true;
END;
$$;

-- Recriar função fn_excluir_contato_logico com tipos INTEGER
CREATE OR REPLACE FUNCTION fn_excluir_contato_logico(
  p_empresa_id integer,
  p_filial_id integer,
  p_contato_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id integer;
BEGIN
  -- Validar tenant_id
  v_tenant_id := current_setting('app.tenant_id', true)::integer;
  
  IF v_tenant_id IS NULL OR v_tenant_id != p_empresa_id THEN
    RAISE EXCEPTION 'Acesso negado: tenant_id inválido';
  END IF;

  -- Soft delete do contato e dados relacionados
  UPDATE contatos_v2
  SET deleted_at = now()
  WHERE id = p_contato_id
    AND empresa_id = p_empresa_id
    AND filial_id = p_filial_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contato não encontrado';
  END IF;

  -- Soft delete dos dados relacionados
  UPDATE contato_meios_contato
  SET deleted_at = now()
  WHERE contato_id = p_contato_id AND deleted_at IS NULL;

  UPDATE contato_enderecos
  SET deleted_at = now()
  WHERE contato_id = p_contato_id AND deleted_at IS NULL;

  UPDATE contato_pf
  SET deleted_at = now()
  WHERE contato_id = p_contato_id AND deleted_at IS NULL;

  UPDATE contato_pj
  SET deleted_at = now()
  WHERE contato_id = p_contato_id AND deleted_at IS NULL;

  RETURN true;
END;
$$;