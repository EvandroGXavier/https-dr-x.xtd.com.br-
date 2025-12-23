-- Tornar o bucket documentos público para compatibilidade com URLs existentes
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documentos';

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuarios podem visualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios podem deletar seus documentos" ON storage.objects;

-- Política para visualizar documentos (SELECT) - permite ver próprios arquivos
CREATE POLICY "Usuarios podem visualizar seus documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos' 
  AND (
    -- Arquivos na estrutura antiga ou nova com user_id na pasta
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    -- Ou se o owner do objeto é o usuário atual
    owner = auth.uid()
  )
);

-- Política para fazer upload (INSERT) - cria na estrutura user_id/filename
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
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR owner = auth.uid()
  )
);

-- Política para deletar documentos (DELETE)
CREATE POLICY "Usuarios podem deletar seus documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR owner = auth.uid()
  )
);