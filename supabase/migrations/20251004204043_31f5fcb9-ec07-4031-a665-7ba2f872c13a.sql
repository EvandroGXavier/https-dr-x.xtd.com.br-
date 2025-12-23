-- Edge Function RPC para criar empresa completa com filial e admin
CREATE OR REPLACE FUNCTION public.create_empresa_completa(
  p_nome text,
  p_cnpj text,
  p_email_admin text,
  p_nome_admin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_filial_id uuid;
  v_tenant_id uuid;
  v_user_id uuid;
  v_result jsonb;
BEGIN
  -- Validar se é superadmin
  IF NOT is_superadmin(get_current_user_email()) THEN
    RAISE EXCEPTION 'Acesso negado. Apenas superadmins podem criar empresas';
  END IF;

  -- Gerar tenant_id único
  v_tenant_id := gen_random_uuid();

  -- 1. Criar empresa
  INSERT INTO public.saas_empresas (
    nome, cnpj, ativa, tenant_id
  ) VALUES (
    p_nome, p_cnpj, true, v_tenant_id
  ) RETURNING uuid_id INTO v_empresa_id;

  -- 2. Criar filial matriz
  INSERT INTO public.saas_filiais (
    empresa_id, nome, cnpj, matriz, ativa
  ) 
  SELECT id, 'Matriz', p_cnpj, true, true
  FROM public.saas_empresas 
  WHERE uuid_id = v_empresa_id
  RETURNING uuid_id INTO v_filial_id;

  -- 3. Buscar ou criar usuário admin
  -- Primeiro verificar se usuário já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email_admin;

  -- Se não existe, registrar que precisa ser criado manualmente
  IF v_user_id IS NULL THEN
    -- Auditoria de pendência
    PERFORM log_security_event(
      'empresa_criada_admin_pendente',
      format('Empresa %s criada. Admin %s precisa ser convidado', p_nome, p_email_admin),
      jsonb_build_object(
        'empresa_id', v_empresa_id,
        'filial_id', v_filial_id,
        'email_admin', p_email_admin,
        'nome_admin', p_nome_admin
      )
    );
  ELSE
    -- 4. Vincular usuário existente à empresa/filial
    INSERT INTO public.usuario_filial_perfis (
      user_id, empresa_id, filial_id, perfil, ativo, tenant_id
    ) VALUES (
      v_user_id, v_empresa_id, v_filial_id, 'Admin', true, v_tenant_id
    );

    -- Auditoria de sucesso completo
    PERFORM log_security_event(
      'empresa_criada_completa',
      format('Empresa %s criada e admin %s vinculado', p_nome, p_email_admin),
      jsonb_build_object(
        'empresa_id', v_empresa_id,
        'filial_id', v_filial_id,
        'admin_id', v_user_id
      )
    );
  END IF;

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'empresa_id', v_empresa_id,
    'filial_id', v_filial_id,
    'tenant_id', v_tenant_id,
    'user_id', v_user_id,
    'admin_pendente', v_user_id IS NULL,
    'email_admin', p_email_admin
  );

  RETURN v_result;
END;
$$;