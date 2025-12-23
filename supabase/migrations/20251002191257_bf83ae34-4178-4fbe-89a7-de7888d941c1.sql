-- Garantir que o bucket documentos existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Authenticated users can view own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own files" ON storage.objects;

-- Política para visualizar documentos (SELECT)
CREATE POLICY "Usuarios podem visualizar documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para fazer upload (INSERT)
CREATE POLICY "Usuarios podem fazer upload de documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para atualizar documentos (UPDATE)
CREATE POLICY "Usuarios podem atualizar seus documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política para deletar documentos (DELETE)
CREATE POLICY "Usuarios podem deletar seus documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);