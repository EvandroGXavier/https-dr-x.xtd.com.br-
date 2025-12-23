-- 🔥 1️⃣ Remover bucket indevido (whatsapp-media) e seus objetos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'whatsapp-media') THEN
    DELETE FROM storage.objects WHERE bucket_id = 'whatsapp-media';
    DELETE FROM storage.buckets WHERE id = 'whatsapp-media';
  END IF;
END $$;

-- 🔍 Limpar políticas antigas ligadas ao bucket removido
DROP POLICY IF EXISTS "Users can read their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
DROP POLICY IF EXISTS "wa_media_read" ON storage.objects;
DROP POLICY IF EXISTS "wa_media_write" ON storage.objects;

-- 🧱 2️⃣ Garantir existência do bucket correto
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wa-midia',
  'wa-midia',
  false,
  52428800, -- 50 MB
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

-- 🔒 Recriar políticas corretas para o bucket oficial
DROP POLICY IF EXISTS "wa_midia_read" ON storage.objects;
DROP POLICY IF EXISTS "wa_midia_write" ON storage.objects;

CREATE POLICY "wa_midia_read" ON storage.objects
FOR SELECT USING (bucket_id = 'wa-midia');

CREATE POLICY "wa_midia_write" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'wa-midia');

-- 🧾 3️⃣ Corrigir URLs no banco (substituir whatsapp-media → wa-midia)
UPDATE wa_messages
SET content = jsonb_set(
  content,
  '{media_url}',
  to_jsonb(replace(content->>'media_url', 'whatsapp-media', 'wa-midia'))
)
WHERE content->>'media_url' LIKE '%whatsapp-media%';

-- 🔍 5️⃣ Auditoria e log da padronização
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
)
VALUES (
  NULL,
  'system_maintenance',
  'Padronização de bucket WhatsApp: removido whatsapp-media, mantido wa-midia',
  jsonb_build_object(
    'action', 'padronizacao_bucket_wa-midia',
    'module', 'whatsapp',
    'target', 'storage',
    'timestamp', now()
  )
);