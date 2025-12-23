-- ============================================================================
-- Migration: Fix Super Admin Validation
-- Description: Corrige validação de superadmin na RPC (usar superadmin_id)
-- Date: 2025-10-25
-- ============================================================================

DROP FUNCTION IF EXISTS public.fn_provisionar_nova_empresa(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.fn_provisionar_nova_empresa(
  p_nome_empresa TEXT,
  p_cnpj TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_chamador_id UUID := auth.uid();
  v_eh_superadmin BOOLEAN := FALSE;
  v_empresa_id INTEGER;
  v_empresa_uuid UUID;
  v_filial_id INTEGER;
  v_filial_uuid UUID;
  v_assinatura_id INTEGER;
  v_plano_trial_id INTEGER;
  v_novo_user_id UUID;
  v_novo_profile_id UUID;
  v_senha_gerada TEXT;
  v_email_gerado TEXT;
  v_cnpj_limpo TEXT;
BEGIN
  -- 1. VALIDAÇÕES DE SEGURANÇA
  IF v_chamador_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- CORRIGIDO: usar superadmin_id em vez de user_id
  SELECT EXISTS (
    SELECT 1
    FROM public.saas_superadmins sa
    WHERE sa.superadmin_id = v_chamador_id
  ) INTO v_eh_superadmin;

  IF NOT v_eh_superadmin THEN
    RAISE EXCEPTION 'Acesso negado: Apenas Super Admins podem provisionar empresas';
  END IF;

  -- Limpar CNPJ
  v_cnpj_limpo := regexp_replace(p_cnpj, '[^0-9]', '', 'g');
  
  IF length(v_cnpj_limpo) != 14 THEN
    RAISE EXCEPTION 'CNPJ inválido: deve conter 14 dígitos';
  END IF;

  IF EXISTS (SELECT 1 FROM public.saas_empresas WHERE cnpj = v_cnpj_limpo) THEN
    RAISE EXCEPTION 'CNPJ já cadastrado no sistema';
  END IF;

  -- 2. CRIAR EMPRESA
  INSERT INTO public.saas_empresas (
    nome, cnpj, ativa, plano
  ) VALUES (
    p_nome_empresa, v_cnpj_limpo, TRUE, 'Trial'
  ) RETURNING id, uuid_id INTO v_empresa_id, v_empresa_uuid;

  -- 3. CRIAR FILIAL MATRIZ
  INSERT INTO public.saas_filiais (
    empresa_id, nome, cnpj, matriz, ativa
  ) VALUES (
    v_empresa_id, 'Matriz', v_cnpj_limpo, TRUE, TRUE
  ) RETURNING id, uuid_id INTO v_filial_id, v_filial_uuid;

  -- 4. BUSCAR PLANO TRIAL
  SELECT id INTO v_plano_trial_id
  FROM public.saas_planos
  WHERE slug = 'trial' OR eh_trial = TRUE
  LIMIT 1;

  IF v_plano_trial_id IS NULL THEN
    RAISE EXCEPTION 'Plano Trial não encontrado no sistema';
  END IF;

  -- 5. CRIAR ASSINATURA TRIAL (30 DIAS)
  INSERT INTO public.saas_assinaturas (
    empresa_id,
    plano_id,
    data_inicio,
    data_fim,
    status,
    valor_mensal,
    observacoes
  ) VALUES (
    v_empresa_id,
    v_plano_trial_id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'ativa',
    0.00,
    'Assinatura Trial - Criada automaticamente no provisionamento'
  ) RETURNING id INTO v_assinatura_id;

  -- 6. CRIAR USUÁRIO ADMIN DA EMPRESA
  v_email_gerado := v_cnpj_limpo || '@cnpj.local';
  v_senha_gerada := v_cnpj_limpo;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    v_email_gerado,
    crypt(v_senha_gerada, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('nome', p_nome_empresa || ' - Admin'),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO v_novo_user_id;

  INSERT INTO public.profiles (
    profile_id,
    user_id,
    nome,
    email,
    role,
    empresa_id,
    filial_id,
    eh_primeiro_acesso,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_novo_user_id,
    p_nome_empresa || ' - Admin',
    v_email_gerado,
    'admin',
    v_empresa_uuid,
    v_filial_uuid,
    TRUE,
    NOW(),
    NOW()
  ) RETURNING profile_id INTO v_novo_profile_id;

  INSERT INTO public.saas_usuarios (
    profile_id,
    empresa_id,
    perfil,
    ativo
  ) VALUES (
    v_novo_profile_id,
    v_empresa_id,
    'Admin',
    TRUE
  );

  -- 7. REGISTRAR AUDITORIA
  PERFORM public.log_security_event(
    'empresa_provisionada',
    format('Empresa %s provisionada com sucesso por Super Admin', p_nome_empresa),
    jsonb_build_object(
      'empresa_id', v_empresa_id,
      'empresa_uuid', v_empresa_uuid,
      'cnpj', v_cnpj_limpo,
      'filial_uuid', v_filial_uuid,
      'assinatura_id', v_assinatura_id,
      'admin_profile_id', v_novo_profile_id,
      'superadmin_id', v_chamador_id
    )
  );

  -- 8. RETORNAR RESULTADO
  RETURN jsonb_build_object(
    'success', TRUE,
    'empresa_id', v_empresa_uuid,
    'filial_id', v_filial_uuid,
    'admin_email', v_email_gerado,
    'admin_senha', v_senha_gerada,
    'assinatura_valida_ate', CURRENT_DATE + INTERVAL '30 days',
    'message', format('Empresa %s provisionada com sucesso! Trial válido por 30 dias.', p_nome_empresa)
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_security_event(
      'empresa_provisionamento_erro',
      format('Erro ao provisionar empresa %s: %s', p_nome_empresa, SQLERRM),
      jsonb_build_object(
        'cnpj', p_cnpj,
        'error', SQLERRM,
        'superadmin_id', v_chamador_id
      )
    );
    
    RAISE;
END;
$function$;