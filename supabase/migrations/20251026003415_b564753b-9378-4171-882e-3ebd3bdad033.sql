-- Corrigir fn_provisionar_nova_empresa para usar saas_filiais
DROP FUNCTION IF EXISTS fn_provisionar_nova_empresa(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION fn_provisionar_nova_empresa(
  p_nome_empresa TEXT,
  p_cnpj TEXT,
  p_admin_email TEXT DEFAULT NULL,
  p_admin_nome TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_superadmin_id UUID;
  v_empresa_id UUID;
  v_filial_id UUID;
  v_plano_id UUID;
  v_assinatura_id UUID;
  v_plano_nome TEXT := 'Básico';
  v_valor_mensal NUMERIC := 99.90;
  v_dia_vencimento INT := 10;
  v_trial_dias INT := 15;
  v_admin_user_id UUID;
  v_cnpj_limpo TEXT;
  v_resultado JSON;
BEGIN
  -- 1) Validar superadmin (tanto por ID quanto por email)
  SELECT sa.superadmin_id INTO v_superadmin_id
  FROM public.saas_superadmins sa
  WHERE sa.superadmin_id = auth.uid() 
     OR sa.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  LIMIT 1;

  IF v_superadmin_id IS NULL THEN
    PERFORM log_security_event(
      'UNAUTHORIZED_PROVISIONING_ATTEMPT',
      'Tentativa de provisionamento sem privilégios de superadmin',
      json_build_object('user_id', auth.uid(), 'empresa', p_nome_empresa)::jsonb
    );
    
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Apenas superadmins podem provisionar empresas'
    );
  END IF;

  -- Limpar CNPJ
  v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  
  IF length(v_cnpj_limpo) != 14 THEN
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'CNPJ inválido. Deve conter 14 dígitos.'
    );
  END IF;

  -- 2) Verificar se empresa já existe
  SELECT empresa_id INTO v_empresa_id
  FROM public.saas_empresas
  WHERE cnpj = v_cnpj_limpo
  LIMIT 1;

  IF v_empresa_id IS NOT NULL THEN
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Empresa com este CNPJ já está cadastrada'
    );
  END IF;

  -- 3) Buscar plano padrão
  SELECT plano_id INTO v_plano_id
  FROM public.saas_planos
  WHERE nome = v_plano_nome
  LIMIT 1;

  IF v_plano_id IS NULL THEN
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Plano padrão não encontrado. Configure os planos antes de provisionar.'
    );
  END IF;

  -- 4) Criar empresa
  INSERT INTO public.saas_empresas (nome, cnpj, ativa, plano)
  VALUES (p_nome_empresa, v_cnpj_limpo, true, v_plano_nome)
  RETURNING empresa_id INTO v_empresa_id;

  -- 5) Criar filial matriz na tabela saas_filiais
  INSERT INTO public.saas_filiais (
    empresa_id, 
    nome, 
    matriz, 
    ativa,
    tenant_id
  )
  VALUES (
    v_empresa_id, 
    'Matriz', 
    true, 
    true,
    v_empresa_id
  )
  RETURNING filial_id INTO v_filial_id;

  -- 6) Criar assinatura
  INSERT INTO public.saas_assinaturas (
    empresa_id,
    plano_id,
    valor_mensal,
    dia_vencimento,
    status,
    trial_until
  )
  VALUES (
    v_empresa_id,
    v_plano_id,
    v_valor_mensal,
    v_dia_vencimento,
    'trial',
    CURRENT_DATE + (v_trial_dias || ' days')::interval
  )
  RETURNING assinatura_id INTO v_assinatura_id;

  -- 7) Vincular/criar admin se fornecido
  IF p_admin_email IS NOT NULL AND p_admin_email != '' THEN
    -- Tentar vincular usuário existente ou preparar para criação
    SELECT id INTO v_admin_user_id
    FROM auth.users
    WHERE email = p_admin_email
    LIMIT 1;

    IF v_admin_user_id IS NOT NULL THEN
      -- Usuário já existe, atualizar profile
      UPDATE public.profiles
      SET empresa_id = v_empresa_id,
          filial_id = v_filial_id
      WHERE user_id = v_admin_user_id;
      
      -- Criar vínculo na tabela usuario_filial_perfis se existir
      INSERT INTO public.usuario_filial_perfis (user_id, empresa_id, filial_id, perfil_slug)
      VALUES (v_admin_user_id, v_empresa_id, v_filial_id, 'admin')
      ON CONFLICT (user_id, empresa_id, filial_id) DO NOTHING;
      
      v_resultado := json_build_object(
        'sucesso', true,
        'mensagem', 'Empresa provisionada! Administrador existente vinculado.',
        'empresa_id', v_empresa_id,
        'filial_id', v_filial_id,
        'email_admin', p_admin_email,
        'cnpj_limpo', v_cnpj_limpo
      );
    ELSE
      -- Usuário não existe, informar que precisa se cadastrar
      v_resultado := json_build_object(
        'sucesso', true,
        'mensagem', 'Empresa provisionada! O administrador ' || p_admin_email || ' precisa se cadastrar no sistema.',
        'empresa_id', v_empresa_id,
        'filial_id', v_filial_id,
        'email_admin', p_admin_email,
        'cnpj_limpo', v_cnpj_limpo
      );
    END IF;
  ELSE
    v_resultado := json_build_object(
      'sucesso', true,
      'mensagem', 'Empresa provisionada! Configure o administrador posteriormente.',
      'empresa_id', v_empresa_id,
      'filial_id', v_filial_id,
      'cnpj_limpo', v_cnpj_limpo
    );
  END IF;

  -- 8) Log de auditoria
  PERFORM log_security_event(
    'EMPRESA_PROVISIONADA',
    'Nova empresa provisionada com sucesso',
    json_build_object(
      'empresa_id', v_empresa_id,
      'empresa_nome', p_nome_empresa,
      'cnpj', v_cnpj_limpo,
      'superadmin_id', v_superadmin_id
    )::jsonb
  );

  RETURN v_resultado;
  
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_security_event(
      'PROVISIONING_ERROR',
      'Erro ao provisionar empresa: ' || SQLERRM,
      json_build_object('empresa', p_nome_empresa, 'error', SQLERRM)::jsonb
    );
    
    RETURN json_build_object(
      'sucesso', false,
      'mensagem', 'Erro ao provisionar empresa: ' || SQLERRM
    );
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.fn_provisionar_nova_empresa(TEXT, TEXT, TEXT, TEXT) TO authenticated;