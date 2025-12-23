-- ============================================================================
-- CORREÇÃO GERAL WHATSAPP - Compatibilidade, RLS, Storage e Auditoria
-- ============================================================================

-- 1️⃣ View de compatibilidade wa_threads/wa_atendimentos
DROP VIEW IF EXISTS public.vw_wa_threads CASCADE;

CREATE VIEW public.vw_wa_threads AS
SELECT 
  id AS thread_id,
  user_id,
  wa_contact_id,
  status,
  responsavel_id,
  last_message_at,
  created_at,
  updated_at
FROM public.wa_atendimentos;

-- 2️⃣ Garantir RLS em todas as tabelas WhatsApp
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_atendimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_contas ENABLE ROW LEVEL SECURITY;

-- Políticas wa_messages
DROP POLICY IF EXISTS wa_messages_user_access ON public.wa_messages;
CREATE POLICY wa_messages_user_access ON public.wa_messages
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

DROP POLICY IF EXISTS wa_messages_user_insert ON public.wa_messages;
CREATE POLICY wa_messages_user_insert ON public.wa_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id OR has_role('admin'));

DROP POLICY IF EXISTS wa_messages_user_update ON public.wa_messages;
CREATE POLICY wa_messages_user_update ON public.wa_messages
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

-- 3️⃣ Storage bucket para mídias WhatsApp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  false,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/amr',
    'video/mp4', 'video/3gpp',
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS do bucket whatsapp-media  
DROP POLICY IF EXISTS "wa_media_read" ON storage.objects;
CREATE POLICY "wa_media_read" ON storage.objects
FOR SELECT USING (bucket_id = 'whatsapp-media');

DROP POLICY IF EXISTS "wa_media_write" ON storage.objects;
CREATE POLICY "wa_media_write" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'whatsapp-media');

-- 4️⃣ Função de auditoria de status
CREATE OR REPLACE FUNCTION log_wa_status_change()
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
    'wa_status_change',
    format('WhatsApp message status changed: %s -> %s', OLD.status, NEW.status),
    jsonb_build_object(
      'message_id', NEW.wa_message_id,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'thread_id', NEW.thread_id
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger de auditoria
DROP TRIGGER IF EXISTS trg_audit_wa_status ON public.wa_messages;
CREATE TRIGGER trg_audit_wa_status
AFTER UPDATE OF status ON public.wa_messages
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_wa_status_change();