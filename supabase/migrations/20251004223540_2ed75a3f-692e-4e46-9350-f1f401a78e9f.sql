-- Criar função para criar empresa completa com plano
CREATE OR REPLACE FUNCTION public.create_empresa_completa_com_plano(
  p_nome text,
  p_cnpj text,
  p_email_admin text,
  p_nome_admin text,
  p_plano text DEFAULT 'Básico',
  p_valor_mensal numeric DEFAULT 99.90,
  p_dia_vencimento integer DEFAULT 10,
  p_trial_dias integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id integer;
  v_empresa_uuid uuid;
  v_filial_id integer;
  v_filial_uuid uuid;
  v_user_id uuid;
  v_plano_id uuid;
  v_trial_until date;
BEGIN
  -- Buscar ou criar plano
  SELECT id INTO v_plano_id
  FROM saas_planos
  WHERE nome = p_plano
  LIMIT 1;
  
  IF v_plano_id IS NULL THEN
    -- Criar plano se não existir
    INSERT INTO saas_planos (nome, descricao, valor_padrao, ativo)
    VALUES (p_plano, 'Plano ' || p_plano, p_valor_mensal, true)
    RETURNING id INTO v_plano_id;
  END IF;
  
  -- Criar empresa
  INSERT INTO saas_empresas (nome, cnpj, ativa, plano)
  VALUES (p_nome, p_cnpj, true, p_plano)
  RETURNING id, uuid_id INTO v_empresa_id, v_empresa_uuid;
  
  -- Criar filial matriz
  INSERT INTO saas_filiais (empresa_id, nome, cnpj, matriz, ativa)
  VALUES (v_empresa_id, 'Matriz', p_cnpj, true, true)
  RETURNING id, uuid_id INTO v_filial_id, v_filial_uuid;
  
  -- Calcular data de fim do trial
  v_trial_until := CURRENT_DATE + (p_trial_dias || ' days')::interval;
  
  -- Criar assinatura
  INSERT INTO saas_assinaturas (
    empresa_id,
    plano_id,
    valor_mensal,
    dia_vencimento,
    status,
    trial_until
  ) VALUES (
    v_empresa_id,
    v_plano_id,
    p_valor_mensal,
    p_dia_vencimento,
    'TRIAL',
    v_trial_until
  );
  
  -- Buscar usuário pelo email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email_admin
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Vincular usuário existente
    INSERT INTO usuario_filial_perfis (
      user_id,
      empresa_id,
      filial_id,
      perfil,
      ativo,
      tenant_id
    ) VALUES (
      v_user_id,
      v_empresa_uuid,
      v_filial_uuid,
      'Admin',
      true,
      v_empresa_uuid
    );
    
    -- Log da operação
    PERFORM log_security_event(
      'empresa_criada_admin_vinculado',
      format('Empresa %s criada e admin %s vinculado', p_nome, p_email_admin),
      jsonb_build_object(
        'empresa_id', v_empresa_uuid,
        'admin_email', p_email_admin,
        'plano', p_plano,
        'valor_mensal', p_valor_mensal
      )
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'empresa_id', v_empresa_uuid,
      'filial_id', v_filial_uuid,
      'admin_pendente', false
    );
  ELSE
    -- Log indicando que admin precisa se cadastrar
    PERFORM log_security_event(
      'empresa_criada_admin_pendente',
      format('Empresa %s criada. Admin %s precisa se cadastrar', p_nome, p_email_admin),
      jsonb_build_object(
        'empresa_id', v_empresa_uuid,
        'admin_email', p_email_admin,
        'admin_nome', p_nome_admin,
        'plano', p_plano,
        'valor_mensal', p_valor_mensal
      )
    );
    
    RETURN jsonb_build_object(
      'success', true,
      'empresa_id', v_empresa_uuid,
      'filial_id', v_filial_uuid,
      'admin_pendente', true,
      'admin_email', p_email_admin
    );
  END IF;
END;
$$;