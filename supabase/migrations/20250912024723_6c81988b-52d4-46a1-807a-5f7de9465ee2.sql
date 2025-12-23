-- Fase A – Hotfix compatível (mínima)
-- 1) VIEW de compatibilidade de Contatos
create or replace view public.vw_contatos_compat as
select 
  c.id::uuid                                            as id,
  coalesce(c.nome_fantasia, c.nome, c.razao_social)     as nome,
  c.cpf_cnpj                                            as documento,
  coalesce(c.celular, c.telefone)                       as telefone,
  c.email                                               as email,
  -- para compatibilidade de RLS por tenant, usamos user_id como tenant lógico
  c.user_id                                             as tenant_id
from public.contatos_v2 c;

revoke all on public.vw_contatos_compat from public;
grant select on public.vw_contatos_compat to authenticated;

-- Habilitar RLS na base (contatos_v2) se ainda não estiver
alter table if exists public.contatos_v2 enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where polname='contatos_v2_read_by_tenant') then
    create policy "contatos_v2_read_by_tenant" on public.contatos_v2
    for select using (
      (user_id = auth.uid()) OR has_role('admin')
    );
  end if;
end $$;

-- 2) VIEW de compatibilidade de Contas Financeiras apontando para contas_financeiras
create or replace view public.vw_contas_compat as
select 
  cf.id::uuid        as id,
  cf.nome            as nome,
  cf.tipo            as tipo,
  cf.banco           as banco,
  cf.agencia         as agencia,
  cf.conta           as conta,
  cf.user_id         as tenant_id
from public.contas_financeiras cf;

revoke all on public.vw_contas_compat from public;
grant select on public.vw_contas_compat to authenticated;

alter table if exists public.contas_financeiras enable row level security;

-- Garantir políticas padrão por usuário (mantendo RBAC admin)
do $$ begin
  if not exists (select 1 from pg_policies where polname='contas_financeiras_read_by_owner_or_admin') then
    create policy "contas_financeiras_read_by_owner_or_admin" on public.contas_financeiras
    for select using ((user_id = auth.uid()) OR has_role('admin'));
  end if;
end $$;

-- 3) Trigger para preencher tenant/contexto quando aplicável nos lançamentos
-- Nosso módulo usa transacoes_financeiras; criar trigger seguro para user_id se necessário
create or replace function public.fn_fill_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

-- Só cria o trigger se a tabela existir e o trigger não
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='transacoes_financeiras') then
    if not exists (
      select 1 from pg_trigger where tgname = 'tr_transacoes_financeiras_fill_user'
    ) then
      create trigger tr_transacoes_financeiras_fill_user
      before insert on public.transacoes_financeiras
      for each row execute function public.fn_fill_user_id();
    end if;
  end if;
end $$;

-- Opcional: garantir FK de contato_id já feita anteriormente, manter
-- e garantir relação com conta_financeira_id -> contas_financeiras.id
do $$ begin
  if exists (select 1 from information_schema.columns 
             where table_schema='public' and table_name='transacoes_financeiras' and column_name='conta_financeira_id') then
    if not exists (
      select 1 from information_schema.table_constraints tc
      join information_schema.key_column_usage kcu on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
      where tc.table_schema = 'public'
        and tc.table_name = 'transacoes_financeiras'
        and tc.constraint_type = 'FOREIGN KEY'
        and kcu.column_name = 'conta_financeira_id'
    ) then
      alter table public.transacoes_financeiras
      add constraint transacoes_financeiras_conta_financeira_id_fkey
      foreign key (conta_financeira_id) references public.contas_financeiras(id) on update cascade on delete set null;
    end if;
  end if;
end $$;