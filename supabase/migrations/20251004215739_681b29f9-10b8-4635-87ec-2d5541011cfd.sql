-- =====================================================
-- CORREÇÃO COMPLETA DO MÓDULO SaaS
-- Data: 2025-10-04
-- =====================================================

-- =====================================================
-- 1. Garantir UUID e tenant_id em saas_empresas
-- =====================================================
alter table public.saas_empresas
  add column if not exists uuid_id uuid default gen_random_uuid() unique,
  add column if not exists tenant_id uuid,
  add column if not exists created_at timestamp with time zone default now(),
  add column if not exists updated_at timestamp with time zone default now();

-- Preencher uuid_id e tenant_id onde estiverem nulos
update public.saas_empresas set uuid_id = gen_random_uuid() where uuid_id is null;
update public.saas_empresas set tenant_id = uuid_id where tenant_id is null;

create unique index if not exists idx_saas_empresas_cnpj on public.saas_empresas (cnpj) where cnpj is not null;

-- =====================================================
-- 2. Corrigir saas_planos → ID UUID
-- =====================================================
alter table public.saas_planos add column if not exists uuid_id uuid default gen_random_uuid() unique;
update public.saas_planos set uuid_id = gen_random_uuid() where uuid_id is null;

-- =====================================================
-- 3. Corrigir saas_filiais → UUID + tenant_id
-- =====================================================
alter table public.saas_filiais add column if not exists uuid_id uuid default gen_random_uuid() unique;
update public.saas_filiais set uuid_id = gen_random_uuid() where uuid_id is null;

alter table public.saas_filiais add column if not exists empresa_uuid uuid;
update public.saas_filiais f set empresa_uuid = e.uuid_id 
from public.saas_empresas e
where f.empresa_id = e.id;

alter table public.saas_filiais add column if not exists tenant_id uuid;
update public.saas_filiais f set tenant_id = e.tenant_id 
from public.saas_empresas e
where f.empresa_uuid = e.uuid_id;

-- =====================================================
-- 4. Corrigir saas_assinaturas → UUID + tenant_id
-- =====================================================
alter table public.saas_assinaturas add column if not exists uuid_id uuid default gen_random_uuid() unique;
update public.saas_assinaturas set uuid_id = gen_random_uuid() where uuid_id is null;

alter table public.saas_assinaturas add column if not exists empresa_uuid uuid;
update public.saas_assinaturas a set empresa_uuid = e.uuid_id 
from public.saas_empresas e
where a.empresa_id = e.id;

alter table public.saas_assinaturas add column if not exists plano_uuid uuid;
update public.saas_assinaturas a set plano_uuid = p.uuid_id 
from public.saas_planos p
where a.plano_id = p.id;

alter table public.saas_assinaturas add column if not exists tenant_id uuid;
update public.saas_assinaturas a set tenant_id = e.tenant_id 
from public.saas_empresas e
where a.empresa_uuid = e.uuid_id;

-- =====================================================
-- 5. Garantir tenant_id em usuario_filial_perfis
-- =====================================================
alter table public.usuario_filial_perfis add column if not exists tenant_id uuid;
alter table public.usuario_filial_perfis add column if not exists empresa_uuid uuid;
alter table public.usuario_filial_perfis add column if not exists filial_uuid uuid;

update public.usuario_filial_perfis u set empresa_uuid = e.uuid_id 
from public.saas_empresas e
where u.empresa_id = e.id;

update public.usuario_filial_perfis u set filial_uuid = f.uuid_id 
from public.saas_filiais f
where u.filial_id = f.id;

update public.usuario_filial_perfis u set tenant_id = e.tenant_id 
from public.saas_empresas e
where u.empresa_uuid = e.uuid_id;

-- =====================================================
-- 6. Recriar policies RLS (sem recursão)
-- =====================================================

-- saas_empresas
alter table public.saas_empresas enable row level security;
drop policy if exists "empresas_by_tenant" on public.saas_empresas;
drop policy if exists "superadmin_can_view_all_empresas" on public.saas_empresas;

create policy "superadmin_can_view_all_empresas" on public.saas_empresas
for all using (
  exists (
    select 1 from public.saas_superadmins
    where email = auth.jwt()->>'email'
  )
);

-- saas_filiais
alter table public.saas_filiais enable row level security;
drop policy if exists "filiais_by_tenant" on public.saas_filiais;
drop policy if exists "superadmin_can_view_all_filiais" on public.saas_filiais;

create policy "superadmin_can_view_all_filiais" on public.saas_filiais
for all using (
  exists (
    select 1 from public.saas_superadmins
    where email = auth.jwt()->>'email'
  )
);

-- saas_planos
alter table public.saas_planos enable row level security;
drop policy if exists "planos_public_read" on public.saas_planos;
drop policy if exists "superadmin_can_manage_planos" on public.saas_planos;

create policy "planos_public_read" on public.saas_planos
for select using (true);

create policy "superadmin_can_manage_planos" on public.saas_planos
for all using (
  exists (
    select 1 from public.saas_superadmins
    where email = auth.jwt()->>'email'
  )
);

-- saas_assinaturas
alter table public.saas_assinaturas enable row level security;
drop policy if exists "assinaturas_by_tenant" on public.saas_assinaturas;
drop policy if exists "superadmin_can_view_all_assinaturas" on public.saas_assinaturas;

create policy "superadmin_can_view_all_assinaturas" on public.saas_assinaturas
for all using (
  exists (
    select 1 from public.saas_superadmins
    where email = auth.jwt()->>'email'
  )
);

-- usuario_filial_perfis
alter table public.usuario_filial_perfis enable row level security;
drop policy if exists "usuario_perfis_by_tenant" on public.usuario_filial_perfis;
drop policy if exists "usuarios_can_view_own_perfis" on public.usuario_filial_perfis;
drop policy if exists "superadmin_can_manage_perfis" on public.usuario_filial_perfis;

create policy "usuarios_can_view_own_perfis" on public.usuario_filial_perfis
for select using (user_id = auth.uid());

create policy "superadmin_can_manage_perfis" on public.usuario_filial_perfis
for all using (
  exists (
    select 1 from public.saas_superadmins
    where email = auth.jwt()->>'email'
  )
);

-- =====================================================
-- 7. Atualizar função saas_list_empresas_com_assinatura
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
set search_path to 'public'
as $$
begin
  return query
  select 
    e.id as empresa_id,
    e.nome::text as razao_social,
    e.nome::text as nome_fantasia,
    coalesce(p.nome, e.plano, 'Sem plano')::text as plano,
    coalesce(a.valor_mensal, e.valor_plano, 0)::numeric as valor,
    coalesce(a.dia_vencimento, 10)::int as dia_vencimento,
    coalesce(a.status, case when e.ativa then 'ATIVA' else 'INATIVA' end)::text as status,
    coalesce(e.updated_at, e.created_at) as updated_at
  from public.saas_empresas e
  left join public.saas_assinaturas a on e.id = a.empresa_id
  left join public.saas_planos p on a.plano_uuid = p.uuid_id
  order by e.created_at desc;
end;
$$;

-- =====================================================
-- 8. Registrar auditoria da correção
-- =====================================================
insert into public.security_audit_log (user_id, event_type, event_description, metadata)
values (
  auth.uid(),
  'saas_structure_migration',
  'Correção de IDs integer → UUID e RLS ajustado',
  jsonb_build_object(
    'autor', 'Lovable AI',
    'descricao', 'Migração para UUID e tenant_id',
    'tabelas_afetadas', array['saas_empresas', 'saas_filiais', 'saas_planos', 'saas_assinaturas', 'usuario_filial_perfis']
  )
);