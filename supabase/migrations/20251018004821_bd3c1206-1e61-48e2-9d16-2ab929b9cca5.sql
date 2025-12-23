-- 1️⃣ Dropar views existentes primeiro
drop view if exists public.vw_wa_contatos cascade;
drop view if exists public.vw_wa_threads cascade;

-- 2️⃣ Limpeza segura (remover gatilhos e policies incorretas)
drop function if exists public.enforce_tenant_scope() cascade;

do $$
declare r record;
begin
  for r in
    select t.schemaname, t.tablename
    from pg_tables t
    join information_schema.columns c
      on c.table_schema=t.schemaname and c.table_name=t.tablename
    where t.schemaname='public'
      and c.column_name='tenant_id'
  loop
    execute format('drop trigger if exists trg_enforce_tenant_scope on %I.%I', r.schemaname, r.tablename);
  end loop;
end $$;

-- 3️⃣ Recriação de políticas RLS somente para WhatsApp
alter table public.wa_messages      enable row level security;
alter table public.wa_contacts      enable row level security;
alter table public.wa_atendimentos  enable row level security;
alter table public.wa_contas        enable row level security;

-- Limpar policies antigas
drop policy if exists wa_messages_user_access  on public.wa_messages;
drop policy if exists wa_messages_user_insert  on public.wa_messages;
drop policy if exists wa_messages_user_update  on public.wa_messages;
drop policy if exists wa_contacts_user_access  on public.wa_contacts;
drop policy if exists wa_atendimentos_user_access on public.wa_atendimentos;
drop policy if exists wa_contas_admin_access on public.wa_contas;

-- Criar novas policies
create policy wa_messages_select on public.wa_messages
  for select using (auth.uid() = user_id or has_role('admin'));

create policy wa_messages_insert on public.wa_messages
  for insert with check (auth.uid() = user_id or has_role('admin'));

create policy wa_messages_update on public.wa_messages
  for update using (auth.uid() = user_id or has_role('admin'));

create policy wa_contacts_all on public.wa_contacts
  for all using (auth.uid() = user_id or has_role('admin'))
  with check (auth.uid() = user_id or has_role('admin'));

create policy wa_atendimentos_all on public.wa_atendimentos
  for all using (auth.uid() = user_id or has_role('admin'))
  with check (auth.uid() = user_id or has_role('admin'));

create policy wa_contas_select on public.wa_contas
  for select using (auth.uid() = user_id or has_role('admin'));

create policy wa_contas_write on public.wa_contas
  for all using (has_role('admin'))
  with check (has_role('admin'));

-- 4️⃣ Recriar views padronizadas
create or replace view public.vw_wa_contatos as
select
  c.id                               as contato_id,
  c.user_id                          as user_id,
  coalesce(c.nome_fantasia, 'Sem nome') as nome_exibicao,
  w.wa_phone_e164                    as numero_whatsapp,
  w.profile_name,
  w.opt_in_status,
  w.last_seen_at,
  w.created_at                       as data_vinculo
from public.wa_contacts w
join public.contatos_v2 c on c.id = w.contato_id
where w.contato_id is not null;

create or replace view public.vw_wa_threads as
select
  a.id                     as thread_id,
  a.wa_contact_id,
  wc.contato_id,
  a.user_id,
  a.status,
  a.responsavel_id,
  a.last_message_at        as ultima_mensagem,
  count(m.id)              as total_mensagens,
  sum(case when m.direction='in' and m.read_at is null then 1 else 0 end) as mensagens_nao_lidas,
  max(m.timestamp)         as timestamp_ultima_mensagem,
  coalesce(cv.nome_fantasia, 'Sem nome') as contato_nome
from public.wa_atendimentos a
left join public.wa_contacts wc on wc.id = a.wa_contact_id
left join public.contatos_v2 cv on cv.id = wc.contato_id
left join public.wa_messages m on m.thread_id = a.id
group by a.id, a.wa_contact_id, wc.contato_id, a.user_id, a.status, a.responsavel_id, a.last_message_at, cv.nome_fantasia;

-- 5️⃣ Auditoria WhatsApp
create or replace function public.log_wa_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.security_audit_log (event_type, module, action, target, actor, tenant_id, "timestamp")
  values (
    'system',
    'whatsapp',
    case when new.direction='in' then 'mensagem_recebida' else 'mensagem_enviada' end,
    new.thread_id::text,
    coalesce(new.user_id::text, 'system'),
    null,
    now()
  );
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_audit_wa_messages on public.wa_messages;
create trigger trg_audit_wa_messages
  after insert on public.wa_messages
  for each row execute function public.log_wa_message();

-- 6️⃣ Atualizar timestamp do atendimento
create or replace function public.update_wa_atendimento_last_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.wa_atendimentos
  set last_message_at = new.timestamp,
      updated_at = now()
  where id = new.thread_id;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists trg_update_atendimento_timestamp on public.wa_messages;
create trigger trg_update_atendimento_timestamp
  after insert on public.wa_messages
  for each row execute function public.update_wa_atendimento_last_message();

-- 7️⃣ Log da padronização
insert into public.security_audit_log (event_type, module, action, target, actor, tenant_id)
values ('system', 'whatsapp', 'padronizacao_modulo_whatsapp', 'wa_messages,wa_contacts,wa_atendimentos', 'system', null);