-- Implementação das tabelas para Agenda V2
-- Não altera tabela 'agendas' existente, apenas adiciona novas tabelas relacionadas

-- 1) Tabela de Fluxos (templates em Configurações)
CREATE TABLE IF NOT EXISTS public.agenda_fluxos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Etapas-modelo de cada Fluxo (ordem, rótulo, offset relativo à data da agenda)
CREATE TABLE IF NOT EXISTS public.agenda_fluxo_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  fluxo_id uuid NOT NULL REFERENCES public.agenda_fluxos(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  titulo text NOT NULL,
  descricao text,
  offset_dias int DEFAULT 0,      -- dias relativos à data/hora da agenda
  obrigatoria boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Partes vinculadas a uma agenda (solicitante, responsável, envolvidos)
CREATE TABLE IF NOT EXISTS public.agenda_partes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES public.contatos_v2(id) ON DELETE RESTRICT,
  papel text NOT NULL CHECK (papel IN ('SOLICITANTE','RESPONSAVEL','ENVOLVIDO')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Campos de Local (1:1) para não mexer na tabela agendas existente
CREATE TABLE IF NOT EXISTS public.agenda_locais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agenda_id uuid NOT NULL UNIQUE REFERENCES public.agendas(id) ON DELETE CASCADE,
  modalidade text NOT NULL CHECK (modalidade IN ('ONLINE','PRESENCIAL')),
  endereco text,
  link text,
  pasta_arquivos text, -- caminho local/rede (armazenar como texto)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5) Etapas instanciadas por agenda (derivadas do fluxo escolhido)
CREATE TABLE IF NOT EXISTS public.agenda_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  agenda_id uuid NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
  ordem int NOT NULL,
  titulo text NOT NULL,
  descricao text,
  prevista_para timestamptz,
  status text NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE','EM_ANDAMENTO','CONCLUIDA','CANCELADA')),
  responsavel_contato_id uuid REFERENCES public.contatos_v2(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agenda_fluxos_tenant ON public.agenda_fluxos(tenant_id, ativo);
CREATE INDEX IF NOT EXISTS idx_agenda_fluxo_etapas_fluxo ON public.agenda_fluxo_etapas(fluxo_id, ordem);
CREATE INDEX IF NOT EXISTS idx_agenda_partes_agenda ON public.agenda_partes(agenda_id, papel);
CREATE INDEX IF NOT EXISTS idx_agenda_locais_agenda ON public.agenda_locais(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_etapas_agenda ON public.agenda_etapas(agenda_id, status, ordem);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.agenda_fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_fluxo_etapas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_partes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda_etapas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS por tenant_id para agenda_fluxos
CREATE POLICY "agenda_fluxos_read_by_tenant" ON public.agenda_fluxos
FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "agenda_fluxos_write_by_tenant" ON public.agenda_fluxos
FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Políticas RLS por tenant_id para agenda_fluxo_etapas
CREATE POLICY "agenda_fluxo_etapas_read_by_tenant" ON public.agenda_fluxo_etapas
FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "agenda_fluxo_etapas_write_by_tenant" ON public.agenda_fluxo_etapas
FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Políticas RLS por tenant_id para agenda_partes
CREATE POLICY "agenda_partes_read_by_tenant" ON public.agenda_partes
FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "agenda_partes_write_by_tenant" ON public.agenda_partes
FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Políticas RLS por tenant_id para agenda_locais
CREATE POLICY "agenda_locais_read_by_tenant" ON public.agenda_locais
FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "agenda_locais_write_by_tenant" ON public.agenda_locais
FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Políticas RLS por tenant_id para agenda_etapas
CREATE POLICY "agenda_etapas_read_by_tenant" ON public.agenda_etapas
FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "agenda_etapas_write_by_tenant" ON public.agenda_etapas
FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Log da migração
INSERT INTO public.security_audit_log (
  event_type, 
  event_description, 
  metadata
) VALUES (
  'migration_agenda_v2',
  'Criadas tabelas para Agenda V2: fluxos, partes, locais e etapas',
  jsonb_build_object(
    'tables_created', ARRAY['agenda_fluxos', 'agenda_fluxo_etapas', 'agenda_partes', 'agenda_locais', 'agenda_etapas'],
    'rls_enabled', true,
    'indexes_created', true
  )
);