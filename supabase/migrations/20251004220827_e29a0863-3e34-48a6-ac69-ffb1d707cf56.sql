-- =====================================================
-- SaaS UUID: DROP policies dependentes antes
-- Data: 2025-10-04
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- 1) DROP policies que dependem das colunas INT
-- =====================================================
drop policy if exists "ufp_select_self_or_admin" on public.usuario_filial_perfis;
drop policy if exists "ufp_write_admin_or_platform" on public.usuario_filial_perfis;
drop policy if exists "usuario_perfis_by_tenant" on public.usuario_filial_perfis;
drop policy if exists "usuarios_can_view_own_perfis" on public.usuario_filial_perfis;
drop policy if exists "superadmin_can_manage_perfis" on public.usuario_filial_perfis;

-- =====================================================
-- 2) DROP FKs dependentes
-- =====================================================
alter table public.saas_filiais drop constraint if exists saas_filiais_empresa_id_fkey cascade;
alter table public.saas_assinaturas drop constraint if exists saas_assinaturas_empresa_id_fkey cascade;
alter table public.saas_assinaturas drop constraint if exists saas_assinaturas_plano_id_fkey cascade;
alter table public.usuario_filial_perfis drop constraint if exists usuario_filial_perfis_empresa_id_fkey cascade;
alter table public.usuario_filial_perfis drop constraint if exists usuario_filial_perfis_filial_id_fkey cascade;

-- =====================================================
-- 3) saas_empresas: UUID PK
-- =====================================================
alter table public.saas_empresas add column if not exists uuid_id uuid;
alter table public.saas_empresas add column if not exists tenant_id uuid;
alter table public.saas_empresas add column if not exists created_at timestamptz default now();
alter table public.saas_empresas add column if not exists updated_at timestamptz default now();

update public.saas_empresas set uuid_id = coalesce(uuid_id, gen_random_uuid());
update public.saas_empresas set tenant_id = coalesce(tenant_id, uuid_id);

alter table public.saas_empresas drop constraint if exists saas_empresas_pkey cascade;
alter table public.saas_empresas add constraint saas_empresas_pkey primary key (uuid_id);
alter table public.saas_empresas rename column id to id_int;
alter table public.saas_empresas rename column uuid_id to id;

create unique index if not exists idx_saas_empresas_cnpj on public.saas_empresas(cnpj) where cnpj is not null;

-- =====================================================
-- 4) saas_planos: UUID PK
-- =====================================================
alter table public.saas_planos add column if not exists uuid_id uuid;
update public.saas_planos set uuid_id = coalesce(uuid_id, gen_random_uuid());

alter table public.saas_planos drop constraint if exists saas_planos_pkey cascade;
alter table public.saas_planos add constraint saas_planos_pkey primary key (uuid_id);
alter table public.saas_planos rename column id to id_int;
alter table public.saas_planos rename column uuid_id to id;

-- =====================================================
-- 5) saas_filiais: UUID PK + FK UUID
-- =====================================================
alter table public.saas_filiais add column if not exists uuid_id uuid;
update public.saas_filiais set uuid_id = coalesce(uuid_id, gen_random_uuid());

alter table public.saas_filiais add column if not exists empresa_id_uuid uuid;
alter table public.saas_filiais add column if not exists tenant_id uuid;

update public.saas_filiais f
set empresa_id_uuid = e.id,
    tenant_id = e.tenant_id
from public.saas_empresas e
where f.empresa_id = e.id_int;

alter table public.saas_filiais drop constraint if exists saas_filiais_pkey cascade;
alter table public.saas_filiais add constraint saas_filiais_pkey primary key (uuid_id);
alter table public.saas_filiais rename column id to id_int;
alter table public.saas_filiais rename column uuid_id to id;

alter table public.saas_filiais drop column empresa_id cascade;
alter table public.saas_filiais rename column empresa_id_uuid to empresa_id;

alter table public.saas_filiais
  add constraint saas_filiais_empresa_id_fkey
  foreign key (empresa_id) references public.saas_empresas(id) on delete cascade;

-- =====================================================
-- 6) saas_assinaturas: UUID PK + FKs UUID
-- =====================================================
alter table public.saas_assinaturas add column if not exists uuid_id uuid;
update public.saas_assinaturas set uuid_id = coalesce(uuid_id, gen_random_uuid());

alter table public.saas_assinaturas add column if not exists empresa_id_uuid uuid;
alter table public.saas_assinaturas add column if not exists plano_id_uuid uuid;
alter table public.saas_assinaturas add column if not exists tenant_id uuid;

update public.saas_assinaturas a
set empresa_id_uuid = e.id,
    tenant_id = e.tenant_id
from public.saas_empresas e
where a.empresa_id = e.id_int;

update public.saas_assinaturas a
set plano_id_uuid = p.id
from public.saas_planos p
where a.plano_id = p.id_int;

alter table public.saas_assinaturas drop constraint if exists saas_assinaturas_pkey cascade;
alter table public.saas_assinaturas add constraint saas_assinaturas_pkey primary key (uuid_id);
alter table public.saas_assinaturas rename column id to id_int;
alter table public.saas_assinaturas rename column uuid_id to id;

alter table public.saas_assinaturas drop column empresa_id cascade;
alter table public.saas_assinaturas drop column plano_id cascade;
alter table public.saas_assinaturas rename column empresa_id_uuid to empresa_id;
alter table public.saas_assinaturas rename column plano_id_uuid to plano_id;

alter table public.saas_assinaturas
  add constraint saas_assinaturas_empresa_id_fkey
  foreign key (empresa_id) references public.saas_empresas(id) on delete cascade;

alter table public.saas_assinaturas
  add constraint saas_assinaturas_plano_id_fkey
  foreign key (plano_id) references public.saas_planos(id) on delete cascade;

-- =====================================================
-- 7) usuario_filial_perfis: UUID FKs
-- =====================================================
alter table public.usuario_filial_perfis add column if not exists empresa_id_uuid uuid;
alter table public.usuario_filial_perfis add column if not exists filial_id_uuid uuid;
alter table public.usuario_filial_perfis add column if not exists tenant_id uuid;

update public.usuario_filial_perfis u
set empresa_id_uuid = e.id,
    tenant_id = e.tenant_id
from public.saas_empresas e
where u.empresa_id = e.id_int;

update public.usuario_filial_perfis u
set filial_id_uuid = f.id
from public.saas_filiais f
where u.filial_id = f.id_int;

alter table public.usuario_filial_perfis drop column empresa_id cascade;
alter table public.usuario_filial_perfis drop column filial_id cascade;

alter table public.usuario_filial_perfis rename column empresa_id_uuid to empresa_id;
alter table public.usuario_filial_perfis rename column filial_id_uuid to filial_id;

alter table public.usuario_filial_perfis
  add constraint usuario_filial_perfis_empresa_id_fkey
  foreign key (empresa_id) references public.saas_empresas(id) on delete cascade;

alter table public.usuario_filial_perfis
  add constraint usuario_filial_perfis_filial_id_fkey
  foreign key (filial_id) references public.saas_filiais(id) on delete cascade;

-- =====================================================
-- 8) Recriar RLS
-- =====================================================
alter table public.saas_empresas enable row level security;
drop policy if exists "empresas_by_tenant" on public.saas_empresas;
drop policy if exists "superadmin_access_empresas" on public.saas_empresas;
drop policy if exists "superadmin_can_view_all_empresas" on public.saas_empresas;

create policy "superadmin_access_empresas" on public.saas_empresas
for all using (public.is_superadmin(auth.jwt()->>'email'));

alter table public.saas_filiais enable row level security;
drop policy if exists "filiais_by_tenant" on public.saas_filiais;
drop policy if exists "superadmin_access_filiais" on public.saas_filiais;
drop policy if exists "superadmin_can_view_all_filiais" on public.saas_filiais;

create policy "superadmin_access_filiais" on public.saas_filiais
for all using (public.is_superadmin(auth.jwt()->>'email'));

alter table public.saas_planos enable row level security;
drop policy if exists "planos_public_read" on public.saas_planos;
drop policy if exists "superadmin_can_manage_planos" on public.saas_planos;

create policy "planos_public_read" on public.saas_planos for select using (true);
create policy "superadmin_can_manage_planos" on public.saas_planos
for all using (public.is_superadmin(auth.jwt()->>'email'));

alter table public.saas_assinaturas enable row level security;
drop policy if exists "assinaturas_by_tenant" on public.saas_assinaturas;
drop policy if exists "superadmin_access_assinaturas" on public.saas_assinaturas;
drop policy if exists "superadmin_can_view_all_assinaturas" on public.saas_assinaturas;

create policy "superadmin_access_assinaturas" on public.saas_assinaturas
for all using (public.is_superadmin(auth.jwt()->>'email'));

alter table public.usuario_filial_perfis enable row level security;

create policy "usuarios_can_view_own_perfis" on public.usuario_filial_perfis
for select using (user_id = auth.uid());

create policy "superadmin_can_manage_perfis" on public.usuario_filial_perfis
for all using (public.is_superadmin(auth.jwt()->>'email'));

-- =====================================================
-- 9) RPC atualizado
-- =====================================================
create or replace function public.saas_list_empresas_com_assinatura()
returns table(
  empresa_id integer,
  razao_social text,
  nome_fantasia text,
  plano text,
  valor numeric,
  dia_vencimento integer,
  status text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select 
    e.id_int as empresa_id,
    e.nome::text as razao_social,
    e.nome::text as nome_fantasia,
    coalesce(p.nome, 'Sem plano')::text as plano,
    coalesce(a.valor_mensal, 0)::numeric as valor,
    coalesce(a.dia_vencimento, 10)::int as dia_vencimento,
    coalesce(a.status, case when e.ativa then 'ATIVA' else 'INATIVA' end)::text as status,
    coalesce(e.updated_at, e.created_at) as updated_at
  from public.saas_empresas e
  left join public.saas_assinaturas a on a.empresa_id = e.id
  left join public.saas_planos p on p.id = a.plano_id
  order by e.created_at desc;
end;
$$;