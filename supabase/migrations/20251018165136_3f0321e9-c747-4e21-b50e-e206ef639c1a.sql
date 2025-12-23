-- 🔒 Corrigir políticas do bucket wa-midia para permitir reprodução de mídia

-- Garantir que o bucket wa-midia esteja configurado corretamente
UPDATE storage.buckets
SET 
  public = false,
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/amr',
    'video/mp4', 'video/3gpp',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
WHERE id = 'wa-midia';

-- Remover políticas antigas e recriar políticas corretas
DROP POLICY IF EXISTS "wa_midia_read" ON storage.objects;
DROP POLICY IF EXISTS "wa_midia_write" ON storage.objects;
DROP POLICY IF EXISTS "wa_midia_delete" ON storage.objects;

-- Política de leitura: permitir acesso a URLs assinadas (signed URLs)
CREATE POLICY "wa_midia_read" ON storage.objects
FOR SELECT
USING (bucket_id = 'wa-midia');

-- Política de escrita: permitir upload apenas via service role (Edge Functions)
CREATE POLICY "wa_midia_write" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'wa-midia');

-- Política de deleção: permitir apenas via service role
CREATE POLICY "wa_midia_delete" ON storage.objects
FOR DELETE
USING (bucket_id = 'wa-midia');

-- 🧾 Registrar auditoria
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
)
VALUES (
  NULL,
  'system_maintenance',
  'Correção de políticas do bucket wa-midia para permitir reprodução de mídia via signed URLs',
  jsonb_build_object(
    'action', 'correcao_bucket_wa_midia',
    'module', 'whatsapp',
    'bucket', 'wa-midia',
    'public', false,
    'signed_urls', true,
    'timestamp', now()
  )
);