-- Criar bucket para mídias do WhatsApp
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'whatsapp-media',
  'whatsapp-media',
  false, -- Não público, usaremos URLs assinadas
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/amr',
    'video/mp4', 'video/3gpp',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;

-- RLS para whatsapp-media bucket
CREATE POLICY "Users can read their own media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'whatsapp-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role('admin'::app_role))
);

CREATE POLICY "Users can upload their own media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'whatsapp-media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own media"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'whatsapp-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role('admin'::app_role))
);

CREATE POLICY "Users can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'whatsapp-media' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR has_role('admin'::app_role))
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_wa_messages_thread_timestamp 
ON wa_messages(thread_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_wa_messages_contato 
ON wa_messages(contato_id) 
WHERE contato_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wa_messages_type 
ON wa_messages((content->>'type'));

-- Registrar no log de auditoria
INSERT INTO security_audit_log (user_id, event_type, event_description, metadata)
VALUES (
  auth.uid(),
  'whatsapp_storage_setup',
  'WhatsApp media storage bucket and policies created',
  jsonb_build_object(
    'bucket', 'whatsapp-media',
    'timestamp', now()
  )
);