-- ============================================================================
-- CADASTRO MULTIEMPRESA COM CNPJ - Fluxo completo
-- ============================================================================

-- 1. Ativar RLS em usuario_filial_perfis (se não ativo)
alter table public.usuario_filial_perfis enable row level security;

-- Remover políticas antigas se existirem
drop policy if exists "read_by_tenant" on public.usuario_filial_perfis;
drop policy if exists "write_by_tenant" on public.usuario_filial_perfis;

-- Criar novas políticas
create policy "read_by_tenant" on public.usuario_filial_perfis
for select using (
  user_id = auth.uid() 
  or has_role('admin'::app_role)
);

create policy "write_by_tenant" on public.usuario_filial_perfis
for insert with check (
  user_id = auth.uid()
  or has_role('admin'::app_role)
);

-- 2. Ativar RLS em contatos_v2 (já existe, apenas garantir políticas)
alter table public.contatos_v2 enable row level security;

-- 3. Criar função principal de cadastro multiempresa
create or replace function public.fn_register_user_with_cnpj_or_choice(
  p_user_id uuid,
  p_email text,
  p_nome text,
  p_cnpj text default null,
  p_nome_empresa text default null,
  p_choice text default null
)
returns jsonb 
language plpgsql 
security definer
set search_path = public
as $$
declare
  v_empresa record;
  v_filial record;
  v_tenant_id uuid;
  v_empresa_id integer;
  v_filial_id integer;
  v_action text;
  v_perfil text;
begin
  -- Validar entrada
  if p_user_id is null or p_email is null or p_nome is null then
    raise exception 'Dados obrigatórios ausentes: user_id, email ou nome';
  end if;

  -- ============================================================================
  -- 1. DETERMINAR EMPRESA E FILIAL
  -- ============================================================================
  
  if p_cnpj is not null and p_cnpj != '' then
    -- Buscar empresa pelo CNPJ
    select * into v_empresa 
    from saas_empresas 
    where cnpj = p_cnpj 
    limit 1;

    if found then
      -- Empresa existe
      v_empresa_id := v_empresa.id;
      v_tenant_id := v_empresa.uuid_id;
      v_action := 'signup_existing_company';
      v_perfil := 'Cliente';
      
      -- Buscar filial matriz
      select * into v_filial
      from saas_filiais
      where empresa_id = v_empresa_id
        and matriz = true
      limit 1;
      
      if found then
        v_filial_id := v_filial.id;
      else
        -- Criar filial matriz se não existir
        insert into saas_filiais (
          empresa_id, nome, cnpj, matriz, ativa
        ) values (
          v_empresa_id, 'Matriz', p_cnpj, true, true
        ) returning id into v_filial_id;
      end if;
    else
      -- Criar nova empresa
      insert into saas_empresas (
        nome, cnpj, ativa, plano
      ) values (
        coalesce(p_nome_empresa, p_nome), p_cnpj, true, 'Básico'
      ) returning id, uuid_id into v_empresa_id, v_tenant_id;
      
      v_action := 'signup_new_company';
      v_perfil := 'Admin';
      
      -- Criar filial matriz
      insert into saas_filiais (
        empresa_id, nome, cnpj, matriz, ativa
      ) values (
        v_empresa_id, 'Matriz', p_cnpj, true, true
      ) returning id into v_filial_id;
    end if;

  else
    -- Sem CNPJ - decisão guiada
    if p_choice = 'nova' then
      -- Criar nova empresa sem CNPJ
      insert into saas_empresas (
        nome, ativa, plano
      ) values (
        coalesce(p_nome_empresa, concat(p_nome, ' - Empresa')), true, 'Básico'
      ) returning id, uuid_id into v_empresa_id, v_tenant_id;
      
      v_action := 'signup_new_company';
      v_perfil := 'Admin';
      
      -- Criar filial padrão
      insert into saas_filiais (
        empresa_id, nome, matriz, ativa
      ) values (
        v_empresa_id, 'Filial Principal', true, true
      ) returning id into v_filial_id;

    elsif p_choice = 'teste' then
      -- Buscar empresa de teste padrão (criar se não existir)
      select * into v_empresa 
      from saas_empresas 
      where cnpj = '00.000.000/0001-00' 
      limit 1;
      
      if not found then
        insert into saas_empresas (
          nome, cnpj, ativa, plano
        ) values (
          'Empresa Teste', '00.000.000/0001-00', true, 'Teste'
        ) returning id, uuid_id into v_empresa_id, v_tenant_id;
        
        insert into saas_filiais (
          empresa_id, nome, cnpj, matriz, ativa
        ) values (
          v_empresa_id, 'Filial Teste', '00.000.000/0001-00', true, true
        ) returning id into v_filial_id;
      else
        v_empresa_id := v_empresa.id;
        v_tenant_id := v_empresa.uuid_id;
        
        select id into v_filial_id
        from saas_filiais
        where empresa_id = v_empresa_id
          and matriz = true
        limit 1;
      end if;
      
      v_action := 'signup_default_tenant';
      v_perfil := 'Cliente';

    elsif p_choice = 'existente' then
      raise exception 'Para entrar em empresa existente, informe o CNPJ da empresa';
    else
      raise exception 'Escolha inválida. Opções: nova, teste, existente (com CNPJ)';
    end if;
  end if;

  -- ============================================================================
  -- 2. VERIFICAR E CRIAR VÍNCULO USUÁRIO-FILIAL
  -- ============================================================================
  
  -- Evitar vínculo duplicado
  if exists (
    select 1 
    from usuario_filial_perfis 
    where user_id = p_user_id 
      and empresa_id = v_empresa_id
      and filial_id = v_filial_id
  ) then
    raise notice 'Usuário já vinculado a esta empresa/filial';
  else
    insert into usuario_filial_perfis (
      user_id, 
      empresa_id, 
      filial_id, 
      perfil, 
      ativo, 
      tenant_id
    ) values (
      p_user_id,
      v_empresa_id,
      v_filial_id,
      v_perfil,
      true,
      v_tenant_id
    );
  end if;

  -- ============================================================================
  -- 3. CRIAR CONTATO AUTOMÁTICO
  -- ============================================================================
  
  if not exists (
    select 1 
    from contatos_v2 
    where email = p_email 
      and tenant_id = v_tenant_id
  ) then
    insert into contatos_v2 (
      nome,
      nome_fantasia,
      email,
      tipo_pessoa,
      pessoa_tipo,
      ativo,
      observacao,
      user_id,
      tenant_id
    ) values (
      p_nome,
      p_nome,
      p_email,
      'lead',
      'cliente',
      true,
      'Contato criado automaticamente no cadastro de usuário',
      p_user_id,
      v_tenant_id
    );
    
    perform log_security_event(
      'contact_auto_created_from_signup',
      format('Contato criado automaticamente para %s', p_email),
      jsonb_build_object(
        'email', p_email,
        'nome', p_nome,
        'tenant_id', v_tenant_id
      )
    );
  end if;

  -- ============================================================================
  -- 4. AUDITORIA
  -- ============================================================================
  
  perform log_security_event(
    v_action,
    format('Cadastro multiempresa: %s - %s', p_email, v_action),
    jsonb_build_object(
      'email', p_email,
      'cnpj', p_cnpj,
      'choice', p_choice,
      'empresa_id', v_empresa_id,
      'filial_id', v_filial_id,
      'tenant_id', v_tenant_id,
      'perfil', v_perfil
    )
  );

  -- ============================================================================
  -- 5. RETORNO
  -- ============================================================================
  
  return jsonb_build_object(
    'status', 'ok',
    'action', v_action,
    'tenant_id', v_tenant_id,
    'empresa_id', v_empresa_id,
    'filial_id', v_filial_id,
    'perfil', v_perfil
  );
end;
$$;