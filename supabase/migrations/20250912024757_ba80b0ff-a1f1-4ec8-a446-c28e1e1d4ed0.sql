-- Corrigir VIEW de compatibilidade com colunas que existem
-- 1) VIEW de compatibilidade de Contatos (corrigida)
create or replace view public.vw_contatos_compat as
select 
  c.id::uuid                                            as id,
  c.nome_fantasia                                       as nome,
  c.cpf_cnpj                                            as documento,
  coalesce(c.celular, c.telefone)                       as telefone,
  c.email                                               as email,
  -- para compatibilidade de RLS por tenant, usamos user_id como tenant lógico
  c.user_id                                             as tenant_id
from public.contatos_v2 c;

revoke all on public.vw_contatos_compat from public;
grant select on public.vw_contatos_compat to authenticated;

-- 2) VIEW de compatibilidade de Contas Financeiras
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

-- 3) Trigger para preencher user_id quando vier nulo (inserção de financeiro)
create or replace function public.fn_fill_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end $$;

-- Só cria o trigger se a tabela existir e o trigger não existir
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