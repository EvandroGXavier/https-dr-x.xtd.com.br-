-- Criar tabela de logs técnicos do WhatsApp (se não existir)
CREATE TABLE IF NOT EXISTS public.wa_events_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- RLS para wa_events_log
ALTER TABLE public.wa_events_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wa_events_log_read" ON public.wa_events_log;
CREATE POLICY "wa_events_log_read" ON public.wa_events_log
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "wa_events_log_insert" ON public.wa_events_log;
CREATE POLICY "wa_events_log_insert" ON public.wa_events_log
  FOR INSERT WITH CHECK (true);

-- Função de log de eventos outbound
CREATE OR REPLACE FUNCTION public.log_wa_outbound_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Só loga se for mensagem outbound
  IF NEW.direction = 'OUTBOUND' THEN
    INSERT INTO public.wa_events_log (user_id, event, details, created_at)
    VALUES (
      NEW.user_id,
      CONCAT('outbound_', NEW.status),
      jsonb_build_object(
        'wa_message_id', NEW.wa_message_id,
        'status', NEW.status,
        'thread_id', NEW.thread_id,
        'message_type', NEW.message_type
      ),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para log de eventos outbound
DROP TRIGGER IF EXISTS trg_log_wa_outbound_event ON public.wa_messages;
CREATE TRIGGER trg_log_wa_outbound_event
AFTER UPDATE OF status ON public.wa_messages
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_wa_outbound_event();

-- Melhorar função de auditoria de status
CREATE OR REPLACE FUNCTION public.log_wa_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  )
  VALUES (
    NEW.user_id,
    'whatsapp_status_change',
    format('WhatsApp message status changed from %s to %s', OLD.status, NEW.status),
    jsonb_build_object(
      'wa_message_id', NEW.wa_message_id,
      'message_id', NEW.id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'thread_id', NEW.thread_id,
      'direction', NEW.direction
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar trigger de auditoria
DROP TRIGGER IF EXISTS trg_audit_wa_status ON public.wa_messages;
CREATE TRIGGER trg_audit_wa_status
AFTER UPDATE OF status ON public.wa_messages
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.log_wa_status_change();