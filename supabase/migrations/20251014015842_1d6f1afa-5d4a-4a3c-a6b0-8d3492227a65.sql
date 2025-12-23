-- ============================================================================
-- CORREÇÃO E PADRONIZAÇÃO DO MÓDULO AGENDA V2.4
-- ============================================================================

-- 1. CRIAR ENUM PARA PRIORIDADE
DO $$ BEGIN
  CREATE TYPE public.agenda_prioridade AS ENUM ('baixa', 'media', 'alta', 'urgente');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. CONSOLIDAR COLUNAS DE DATA (remover duplicação inicio/fim)
UPDATE public.agendas 
SET inicio = COALESCE(data_inicio, inicio),
    fim = COALESCE(data_fim, fim)
WHERE inicio IS NULL OR fim IS NULL;

ALTER TABLE public.agendas 
  DROP COLUMN IF EXISTS data_inicio CASCADE,
  DROP COLUMN IF EXISTS data_fim CASCADE;

ALTER TABLE public.agendas 
  RENAME COLUMN inicio TO data_inicio;
  
ALTER TABLE public.agendas 
  RENAME COLUMN fim TO data_fim;

ALTER TABLE public.agendas 
  ALTER COLUMN data_inicio SET NOT NULL,
  ALTER COLUMN data_fim SET NOT NULL;

-- 3. CONVERTER PRIORIDADE PARA ENUM
UPDATE public.agendas 
SET prioridade = CASE 
  WHEN LOWER(prioridade) IN ('baixa', 'low') THEN 'baixa'
  WHEN LOWER(prioridade) IN ('alta', 'high') THEN 'alta'
  WHEN LOWER(prioridade) IN ('urgente', 'urgent', 'crítica', 'critical') THEN 'urgente'
  ELSE 'media'
END
WHERE prioridade IS NOT NULL;

UPDATE public.agendas 
SET prioridade = 'media' 
WHERE prioridade IS NULL;

-- Remover default antes de alterar tipo
ALTER TABLE public.agendas 
  ALTER COLUMN prioridade DROP DEFAULT;

-- Converter coluna para enum
ALTER TABLE public.agendas 
  ALTER COLUMN prioridade TYPE public.agenda_prioridade 
  USING prioridade::public.agenda_prioridade;

-- Adicionar default novamente
ALTER TABLE public.agendas 
  ALTER COLUMN prioridade SET DEFAULT 'media'::public.agenda_prioridade;

-- 4. GARANTIR INTEGRIDADE REFERENCIAL
ALTER TABLE public.agenda_partes 
  DROP CONSTRAINT IF EXISTS fk_agenda,
  DROP CONSTRAINT IF EXISTS fk_contato;

ALTER TABLE public.agenda_etapas 
  DROP CONSTRAINT IF EXISTS fk_agenda;

ALTER TABLE public.agenda_locais 
  DROP CONSTRAINT IF EXISTS fk_agenda;

ALTER TABLE public.agenda_etiquetas 
  DROP CONSTRAINT IF EXISTS fk_agenda,
  DROP CONSTRAINT IF EXISTS fk_etiqueta;

ALTER TABLE public.agenda_partes
  ADD CONSTRAINT fk_agenda_partes_agenda 
    FOREIGN KEY (agenda_id) 
    REFERENCES public.agendas(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT fk_agenda_partes_contato 
    FOREIGN KEY (contato_id) 
    REFERENCES public.contatos_v2(id) 
    ON DELETE SET NULL;

ALTER TABLE public.agenda_etapas
  ADD CONSTRAINT fk_agenda_etapas_agenda 
    FOREIGN KEY (agenda_id) 
    REFERENCES public.agendas(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT fk_agenda_etapas_responsavel 
    FOREIGN KEY (responsavel_contato_id) 
    REFERENCES public.contatos_v2(id) 
    ON DELETE SET NULL;

ALTER TABLE public.agenda_locais
  ADD CONSTRAINT fk_agenda_locais_agenda 
    FOREIGN KEY (agenda_id) 
    REFERENCES public.agendas(id) 
    ON DELETE CASCADE;

ALTER TABLE public.agenda_etiquetas
  ADD CONSTRAINT fk_agenda_etiquetas_agenda 
    FOREIGN KEY (agenda_id) 
    REFERENCES public.agendas(id) 
    ON DELETE CASCADE,
  ADD CONSTRAINT fk_agenda_etiquetas_etiqueta 
    FOREIGN KEY (etiqueta_id) 
    REFERENCES public.etiquetas(id) 
    ON DELETE CASCADE;

-- 5. MELHORAR POLÍTICAS RLS
DROP POLICY IF EXISTS agendas_read_by_tenant ON public.agendas;
DROP POLICY IF EXISTS agendas_write_by_tenant ON public.agendas;
DROP POLICY IF EXISTS agendas_select_by_tenant ON public.agendas;
DROP POLICY IF EXISTS agendas_insert_by_tenant ON public.agendas;
DROP POLICY IF EXISTS agendas_update_by_tenant ON public.agendas;
DROP POLICY IF EXISTS agendas_delete_by_tenant ON public.agendas;

CREATE POLICY agendas_select_by_tenant 
ON public.agendas 
FOR SELECT 
USING (tenant_id = auth.uid() OR has_role('admin'));

CREATE POLICY agendas_insert_by_tenant 
ON public.agendas 
FOR INSERT 
WITH CHECK (
  tenant_id = auth.uid() 
  AND user_id = auth.uid()
);

CREATE POLICY agendas_update_by_tenant 
ON public.agendas 
FOR UPDATE 
USING (tenant_id = auth.uid() OR has_role('admin'))
WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

CREATE POLICY agendas_delete_by_tenant 
ON public.agendas 
FOR DELETE 
USING (tenant_id = auth.uid() OR has_role('admin'));

-- 6. CRIAR/MELHORAR TRIGGER DE AUDITORIA
CREATE OR REPLACE FUNCTION public.audit_agenda_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_details jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_details := jsonb_build_object(
      'agenda_id', OLD.id,
      'titulo', OLD.titulo,
      'status', OLD.status,
      'deleted_at', now()
    );
    
    PERFORM log_security_event(
      'agenda_deleted',
      format('Agenda "%s" deletada', OLD.titulo),
      v_details
    );
    
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    v_details := jsonb_build_object(
      'agenda_id', NEW.id,
      'titulo', NEW.titulo,
      'changes', jsonb_build_object(
        'status', jsonb_build_object('old', OLD.status, 'new', NEW.status),
        'prioridade', jsonb_build_object('old', OLD.prioridade, 'new', NEW.prioridade)
      )
    );
    
    PERFORM log_security_event(
      'agenda_updated',
      format('Agenda "%s" atualizada', NEW.titulo),
      v_details
    );
    
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    v_details := jsonb_build_object(
      'agenda_id', NEW.id,
      'titulo', NEW.titulo,
      'status', NEW.status,
      'prioridade', NEW.prioridade
    );
    
    PERFORM log_security_event(
      'agenda_created',
      format('Agenda "%s" criada', NEW.titulo),
      v_details
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_agenda ON public.agendas;

CREATE TRIGGER tr_audit_agenda
AFTER INSERT OR UPDATE OR DELETE ON public.agendas
FOR EACH ROW EXECUTE FUNCTION public.audit_agenda_changes();

-- 7. CORRIGIR DADOS CORROMPIDOS
UPDATE public.agendas
SET titulo = 'Agenda Importada - Corrigida',
    descricao = COALESCE(descricao, 'Registro ajustado após importação'),
    observacoes = NULL
WHERE titulo LIKE 'https://%' OR titulo LIKE 'http://%';

-- 8. GARANTIR TIMESTAMPS CONSISTENTES
CREATE OR REPLACE FUNCTION public.update_agendas_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_update_agendas_timestamp ON public.agendas;

CREATE TRIGGER tr_update_agendas_timestamp
BEFORE UPDATE ON public.agendas
FOR EACH ROW EXECUTE FUNCTION public.update_agendas_timestamp();

-- 9. ADICIONAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agendas_tenant_id ON public.agendas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agendas_status ON public.agendas(status);
CREATE INDEX IF NOT EXISTS idx_agendas_data_inicio ON public.agendas(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendas_processo_id ON public.agendas(processo_id);
CREATE INDEX IF NOT EXISTS idx_agenda_partes_agenda_id ON public.agenda_partes(agenda_id);
CREATE INDEX IF NOT EXISTS idx_agenda_etapas_agenda_id ON public.agenda_etapas(agenda_id);