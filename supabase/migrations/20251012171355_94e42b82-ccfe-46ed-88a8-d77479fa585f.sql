-- 3.1 processos — reforço mínimo (fases por ETIQUETA)
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS advogado_id uuid,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamp with time zone DEFAULT now();

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_processos_advogado ON public.processos(advogado_id);
CREATE INDEX IF NOT EXISTS idx_processos_atualizado_em ON public.processos(atualizado_em);

-- 3.2 Pivot de etiquetas de processo (reforçar unicidade da FASE)
CREATE OR REPLACE FUNCTION public.fn_enforce_single_fase()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.tipo = 'fase') THEN
    DELETE FROM public.processo_etiquetas
      WHERE processo_id = NEW.processo_id
        AND tipo = 'fase'
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_single_fase ON public.processo_etiquetas;
CREATE TRIGGER tg_single_fase
BEFORE INSERT OR UPDATE ON public.processo_etiquetas
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_single_fase();

-- 3.3 agenda — unificar Tarefa/Evento
ALTER TABLE public.agendas
  ADD COLUMN IF NOT EXISTS processo_id uuid REFERENCES public.processos(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS responsavel_id uuid,
  ADD COLUMN IF NOT EXISTS inicio timestamp with time zone,
  ADD COLUMN IF NOT EXISTS fim timestamp with time zone,
  ADD COLUMN IF NOT EXISTS todo_concluido_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS lembrete_em timestamp with time zone,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS compartilhado_com_cliente boolean DEFAULT false;

-- Renomear colunas existentes se necessário
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendas' AND column_name='user_id') THEN
    ALTER TABLE public.agendas RENAME COLUMN user_id TO tenant_id;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agendas' AND column_name='created_at') THEN
    ALTER TABLE public.agendas RENAME COLUMN created_at TO criado_em;
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_agenda_processo ON public.agendas(processo_id);
CREATE INDEX IF NOT EXISTS idx_agenda_responsavel ON public.agendas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_agenda_inicio ON public.agendas(inicio);
CREATE INDEX IF NOT EXISTS idx_agendas_tenant ON public.agendas(tenant_id);

-- 3.4 Etiquetas da agenda (pivot) - usar tabela existente agenda_etiquetas
ALTER TABLE public.agenda_etiquetas
  ADD COLUMN IF NOT EXISTS tipo text;

CREATE INDEX IF NOT EXISTS idx_agenda_etiquetas_agenda ON public.agenda_etiquetas(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_etiquetas_tipo ON public.agenda_etiquetas(tipo);

-- 3.5 Auditoria padrão
CREATE TABLE IF NOT EXISTS public.auditorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  actor uuid,
  action text,
  module text,
  target text,
  payload jsonb,
  criado_em timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditorias_tenant ON public.auditorias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auditorias_actor ON public.auditorias(actor);
CREATE INDEX IF NOT EXISTS idx_auditorias_module ON public.auditorias(module);

-- Enable RLS on auditorias
ALTER TABLE public.auditorias ENABLE ROW LEVEL SECURITY;

-- Policy for auditorias
DROP POLICY IF EXISTS auditorias_tenant_select ON public.auditorias;
CREATE POLICY auditorias_tenant_select
  ON public.auditorias FOR SELECT
  USING (tenant_id = auth.uid());

DROP POLICY IF EXISTS auditorias_insert ON public.auditorias;
CREATE POLICY auditorias_insert
  ON public.auditorias FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Função de auditoria
CREATE OR REPLACE FUNCTION public.fn_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.auditorias(tenant_id, actor, action, module, target, payload)
  VALUES (
    COALESCE(NEW.tenant_id, auth.uid()),
    auth.uid(),
    TG_TABLE_NAME || ':' || TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE 
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

-- Triggers de auditoria
DROP TRIGGER IF EXISTS tg_audit_agendas ON public.agendas;
CREATE TRIGGER tg_audit_agendas
AFTER INSERT OR UPDATE OR DELETE ON public.agendas
FOR EACH ROW EXECUTE FUNCTION public.fn_audit();

DROP TRIGGER IF EXISTS tg_audit_proc_etq ON public.processo_etiquetas;
CREATE TRIGGER tg_audit_proc_etq
AFTER INSERT OR UPDATE OR DELETE ON public.processo_etiquetas
FOR EACH ROW EXECUTE FUNCTION public.fn_audit();

DROP TRIGGER IF EXISTS tg_audit_agenda_etq ON public.agenda_etiquetas;
CREATE TRIGGER tg_audit_agenda_etq
AFTER INSERT OR UPDATE OR DELETE ON public.agenda_etiquetas
FOR EACH ROW EXECUTE FUNCTION public.fn_audit();

-- 3.6 Automação: conclusão de agenda pode mudar FASE do processo
CREATE OR REPLACE FUNCTION public.fn_agenda_shift_fase()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  has_tarefa boolean;
  cat text;
  st_conc boolean;
  fase_atual text;
BEGIN
  -- Só reage quando marcar concluído
  IF (NEW.todo_concluido_em IS NULL OR OLD.todo_concluido_em IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  -- Verifica etiquetas da agenda
  SELECT
    bool_or(ae.etiqueta_id IN (SELECT id FROM public.etiquetas WHERE nome='tarefa')) AS is_tarefa,
    MAX(CASE WHEN e.nome IN ('proposta', 'contrato') THEN e.nome END) AS categoria,
    bool_or(ae.etiqueta_id IN (SELECT id FROM public.etiquetas WHERE nome='concluida')) AS status_concluida
  INTO has_tarefa, cat, st_conc
  FROM public.agenda_etiquetas ae
  LEFT JOIN public.etiquetas e ON ae.etiqueta_id = e.id
  WHERE ae.agenda_id = NEW.id;

  IF has_tarefa AND st_conc AND NEW.processo_id IS NOT NULL THEN
    -- Verifica fase atual do processo
    SELECT e.nome INTO fase_atual
    FROM public.processo_etiquetas pe
    JOIN public.etiquetas e ON pe.etiqueta_id = e.id
    WHERE pe.processo_id = NEW.processo_id 
      AND e.grupo = 'fase'
    LIMIT 1;

    -- Aplica mudança de fase por convenção
    IF cat = 'proposta' AND fase_atual != 'contrato' THEN
      -- Remove fase antiga
      DELETE FROM public.processo_etiquetas 
      WHERE processo_id = NEW.processo_id 
        AND etiqueta_id IN (SELECT id FROM public.etiquetas WHERE grupo = 'fase');
      
      -- Adiciona nova fase
      INSERT INTO public.processo_etiquetas(processo_id, etiqueta_id, user_id)
      SELECT NEW.processo_id, id, auth.uid()
      FROM public.etiquetas 
      WHERE nome = 'contrato' AND grupo = 'fase'
      LIMIT 1;
      
    ELSIF cat = 'contrato' AND fase_atual != 'execucao' THEN
      DELETE FROM public.processo_etiquetas 
      WHERE processo_id = NEW.processo_id 
        AND etiqueta_id IN (SELECT id FROM public.etiquetas WHERE grupo = 'fase');
      
      INSERT INTO public.processo_etiquetas(processo_id, etiqueta_id, user_id)
      SELECT NEW.processo_id, id, auth.uid()
      FROM public.etiquetas 
      WHERE nome = 'execucao' AND grupo = 'fase'
      LIMIT 1;
    END IF;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS tg_agenda_shift_fase ON public.agendas;
CREATE TRIGGER tg_agenda_shift_fase
AFTER UPDATE OF todo_concluido_em ON public.agendas
FOR EACH ROW EXECUTE FUNCTION public.fn_agenda_shift_fase();

-- 3.7 RLS adicional para agenda_etiquetas (já existe RLS em agendas)
ALTER TABLE public.agenda_etiquetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agenda_etq_tenant_all ON public.agenda_etiquetas;
CREATE POLICY agenda_etq_tenant_all
  ON public.agenda_etiquetas
  USING (EXISTS (
    SELECT 1 FROM public.agendas a 
    WHERE a.id = agenda_id AND a.tenant_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.agendas a 
    WHERE a.id = agenda_id AND a.tenant_id = auth.uid()
  ));