-- ============================================================================
-- MÓDULO DE COMPRAS + ESTOQUE + FISCAL
-- ============================================================================

-- 1️⃣ TABELA DE PRODUTOS
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  codigo_interno varchar(50) not null,
  codigo_barras varchar(50),
  descricao text not null,
  ncm varchar(8),
  cest varchar(7),
  cfop_padrao varchar(10),
  cst varchar(5),
  tipo varchar(20) check (tipo in ('produto','servico')),
  origem_fiscal smallint default 0,
  unidade_principal varchar(10),
  unidade_compra varchar(10),
  fator_conversao numeric(12,4) default 1,
  controla_estoque boolean default true,
  custo_medio numeric(14,4) default 0,
  preco_venda numeric(14,2),
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(tenant_id, codigo_interno)
);

-- 2️⃣ CÓDIGOS ALTERNATIVOS
create table public.produtos_codigos_alternativos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid references produtos(id) on delete cascade,
  codigo varchar(50) not null,
  fornecedor_id uuid references contatos_v2(id),
  tipo varchar(20) check (tipo in ('fornecedor','fabricante','interno')),
  created_at timestamp with time zone default now()
);

-- 3️⃣ LOCALIZAÇÕES DE ESTOQUE
create table public.estoque_localizacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  nome varchar(100) not null,
  tipo varchar(20) check (tipo in ('principal','secundario','transito')),
  empresa_id uuid,
  filial_id uuid,
  endereco text,
  ativo boolean default true,
  created_at timestamp with time zone default now()
);

-- 4️⃣ MOVIMENTAÇÕES DE ESTOQUE
create table public.estoque_movimentacoes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  produto_id uuid references produtos(id),
  local_origem_id uuid references estoque_localizacoes(id),
  local_destino_id uuid references estoque_localizacoes(id),
  tipo_movimentacao varchar(20) check (tipo_movimentacao in ('entrada','saida','ajuste','transferencia')),
  quantidade numeric(14,4) not null,
  valor_unitario numeric(14,4),
  valor_total numeric(14,2),
  documento_origem varchar(100),
  chave_nfe varchar(50),
  origem_modulo varchar(50),
  referencia_id uuid,
  data_movimentacao timestamp with time zone default now(),
  observacao text,
  created_at timestamp with time zone default now()
);

-- 5️⃣ SALDOS DE ESTOQUE
create table public.estoque_saldos (
  produto_id uuid references produtos(id) on delete cascade,
  localizacao_id uuid references estoque_localizacoes(id) on delete cascade,
  quantidade numeric(14,4) default 0,
  custo_medio numeric(14,4) default 0,
  updated_at timestamp with time zone default now(),
  primary key (produto_id, localizacao_id)
);

-- 6️⃣ COMPRAS
create table public.compras (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  empresa_id uuid,
  filial_id uuid,
  fornecedor_id uuid references contatos_v2(id),
  tipo varchar(20) check (tipo in ('consumo','revenda','servico')),
  numero_nfe varchar(20),
  chave_nfe varchar(50),
  data_emissao date,
  valor_total numeric(14,2),
  status varchar(20) default 'pendente' check (status in ('pendente','aprovada','cancelada')),
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7️⃣ ITENS DE COMPRA
create table public.compras_itens (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid references compras(id) on delete cascade,
  produto_id uuid references produtos(id),
  codigo_produto varchar(50),
  descricao text not null,
  ncm varchar(8),
  cfop varchar(10),
  unidade varchar(10),
  quantidade numeric(14,4) not null,
  valor_unitario numeric(14,4) not null,
  valor_total numeric(14,2) not null,
  aliquota_icms numeric(5,2),
  aliquota_pis numeric(5,2),
  aliquota_cofins numeric(5,2),
  valor_ipi numeric(14,2),
  created_at timestamp with time zone default now()
);

-- 8️⃣ PARCELAS (DUPLICATAS)
create table public.compras_parcelas (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid references compras(id) on delete cascade,
  numero_parcela smallint not null,
  data_vencimento date not null,
  valor numeric(14,2) not null,
  transacao_id uuid references transacoes_financeiras(id),
  created_at timestamp with time zone default now()
);

-- 9️⃣ ADICIONAR COLUNA compra_id EM transacoes_financeiras
alter table public.transacoes_financeiras 
add column if not exists compra_id uuid references compras(id);

-- 🔟 HABILITAR RLS
alter table public.produtos enable row level security;
alter table public.produtos_codigos_alternativos enable row level security;
alter table public.estoque_localizacoes enable row level security;
alter table public.estoque_movimentacoes enable row level security;
alter table public.estoque_saldos enable row level security;
alter table public.compras enable row level security;
alter table public.compras_itens enable row level security;
alter table public.compras_parcelas enable row level security;

-- 1️⃣1️⃣ POLÍTICAS RLS - PRODUTOS
create policy "produtos_select_by_tenant" on public.produtos
for select using (tenant_id = auth.uid());

create policy "produtos_insert_by_tenant" on public.produtos
for insert with check (tenant_id = auth.uid());

create policy "produtos_update_by_tenant" on public.produtos
for update using (tenant_id = auth.uid());

create policy "produtos_delete_by_tenant" on public.produtos
for delete using (tenant_id = auth.uid());

-- 1️⃣2️⃣ POLÍTICAS RLS - COMPRAS
create policy "compras_select_by_tenant" on public.compras
for select using (tenant_id = auth.uid());

create policy "compras_insert_by_tenant" on public.compras
for insert with check (tenant_id = auth.uid());

create policy "compras_update_by_tenant" on public.compras
for update using (tenant_id = auth.uid());

create policy "compras_delete_by_tenant" on public.compras
for delete using (tenant_id = auth.uid());

-- 1️⃣3️⃣ POLÍTICAS RLS - ESTOQUE
create policy "estoque_mov_select" on public.estoque_movimentacoes
for select using (tenant_id = auth.uid());

create policy "estoque_mov_insert" on public.estoque_movimentacoes
for insert with check (tenant_id = auth.uid());

create policy "estoque_loc_select" on public.estoque_localizacoes
for select using (tenant_id = auth.uid());

create policy "estoque_loc_insert" on public.estoque_localizacoes
for insert with check (tenant_id = auth.uid());

-- 1️⃣4️⃣ POLÍTICAS RLS - ITENS E PARCELAS
create policy "compras_itens_access" on public.compras_itens
for all using (
  exists (select 1 from compras where compras.id = compras_itens.compra_id and compras.tenant_id = auth.uid())
);

create policy "compras_parcelas_access" on public.compras_parcelas
for all using (
  exists (select 1 from compras where compras.id = compras_parcelas.compra_id and compras.tenant_id = auth.uid())
);

create policy "produtos_codigos_access" on public.produtos_codigos_alternativos
for all using (
  exists (select 1 from produtos where produtos.id = produtos_codigos_alternativos.produto_id and produtos.tenant_id = auth.uid())
);

create policy "estoque_saldos_access" on public.estoque_saldos
for all using (
  exists (select 1 from produtos where produtos.id = estoque_saldos.produto_id and produtos.tenant_id = auth.uid())
);

-- 1️⃣5️⃣ TRIGGER DE AUDITORIA PARA COMPRAS
create or replace function public.audit_compras() returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    insert into security_audit_log (user_id, event_type, event_description, metadata)
    values (auth.uid(), 'compra_deleted', 'Compra deletada', jsonb_build_object('compra_id', OLD.id, 'numero_nfe', OLD.numero_nfe));
    return OLD;
  else
    insert into security_audit_log (user_id, event_type, event_description, metadata)
    values (auth.uid(), 'compra_' || lower(TG_OP), 'Compra ' || TG_OP, jsonb_build_object('compra_id', NEW.id, 'numero_nfe', NEW.numero_nfe));
    return NEW;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_audit_compras
after insert or update or delete on public.compras
for each row execute function public.audit_compras();

-- 1️⃣6️⃣ TRIGGER DE ATUALIZAÇÃO DE ESTOQUE
create or replace function public.fn_atualiza_estoque() returns trigger as $$
declare
  saldo_atual numeric(14,4);
  custo_atual numeric(14,4);
  novo_custo numeric(14,4);
begin
  if NEW.tipo_movimentacao = 'entrada' and NEW.local_destino_id is not null then
    -- Buscar saldo atual
    select quantidade, custo_medio into saldo_atual, custo_atual
    from estoque_saldos 
    where produto_id = NEW.produto_id and localizacao_id = NEW.local_destino_id;

    -- Calcular novo custo médio ponderado
    if saldo_atual is null then
      saldo_atual := 0;
      custo_atual := 0;
    end if;

    novo_custo := ((saldo_atual * custo_atual) + (NEW.quantidade * coalesce(NEW.valor_unitario, 0))) 
                  / (saldo_atual + NEW.quantidade);

    -- Inserir ou atualizar saldo
    insert into estoque_saldos (produto_id, localizacao_id, quantidade, custo_medio)
    values (NEW.produto_id, NEW.local_destino_id, NEW.quantidade, novo_custo)
    on conflict (produto_id, localizacao_id)
    do update set 
      quantidade = estoque_saldos.quantidade + NEW.quantidade,
      custo_medio = novo_custo,
      updated_at = now();

    -- Atualizar custo médio no produto
    update produtos set custo_medio = novo_custo where id = NEW.produto_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

create trigger trg_atualiza_estoque
after insert on public.estoque_movimentacoes
for each row execute function public.fn_atualiza_estoque();

-- 1️⃣7️⃣ FUNÇÃO PARA GERAR TRANSAÇÕES FINANCEIRAS DA COMPRA
create or replace function public.gerar_financeiro_compra(compra_id_param uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  compra_rec record;
  parcela_rec record;
  total_gerado integer := 0;
begin
  -- Buscar dados da compra
  select * into compra_rec from compras where id = compra_id_param;
  
  if compra_rec is null then
    raise exception 'Compra não encontrada';
  end if;

  -- Gerar transações para cada parcela
  for parcela_rec in 
    select * from compras_parcelas where compra_id = compra_id_param order by numero_parcela
  loop
    insert into transacoes_financeiras (
      user_id, tipo, categoria, historico, numero_documento,
      data_emissao, data_vencimento, data_competencia,
      valor_documento, situacao, forma_pagamento,
      contato_id, compra_id, origem_tipo, origem_id
    ) values (
      compra_rec.tenant_id, 'pagar', 'COMPRAS',
      format('Compra NF-e %s - Parcela %s', compra_rec.numero_nfe, parcela_rec.numero_parcela),
      format('COMPRA-%s-%s', compra_rec.id::text, parcela_rec.numero_parcela),
      compra_rec.data_emissao, parcela_rec.data_vencimento, compra_rec.data_emissao,
      parcela_rec.valor, 'aberta', 'BOLETO',
      compra_rec.fornecedor_id, compra_id_param, 'compra', compra_id_param
    );
    total_gerado := total_gerado + 1;
  end loop;

  return jsonb_build_object('success', true, 'total_gerado', total_gerado);
end;
$$;