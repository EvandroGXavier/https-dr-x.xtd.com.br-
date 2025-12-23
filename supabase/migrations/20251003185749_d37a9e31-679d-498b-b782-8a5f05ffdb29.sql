-- =====================================================
-- LIMPEZA TOTAL: REMOVER SISTEMA LEGADO DE ANEXOS/DOCUMENTOS
-- Parte 2: Configurar políticas RLS do bucket 'docs'
-- =====================================================

-- 1. Remover políticas antigas do bucket 'docs' se existirem
DROP POLICY IF EXISTS "Users can upload to docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own docs" ON storage.objects;

-- 2. Criar políticas RLS do bucket 'docs'
CREATE POLICY "Users can upload to docs bucket"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own docs"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'docs' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own docs"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'docs' AND auth.uid() IS NOT NULL);

-- 3. Habilitar RLS nas tabelas docs
ALTER TABLE docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs_etiquetas ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS para a tabela docs
CREATE POLICY "Users can view their own docs"
ON docs FOR SELECT
TO public
USING (tenant_id = auth.uid());

CREATE POLICY "Users can create their own docs"
ON docs FOR INSERT
TO public
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own docs"
ON docs FOR UPDATE
TO public
USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own docs"
ON docs FOR DELETE
TO public
USING (tenant_id = auth.uid());

-- 5. Criar políticas RLS para docs_vinculos
CREATE POLICY "Users can view their own doc links"
ON docs_vinculos FOR SELECT
TO public
USING (tenant_id = auth.uid());

CREATE POLICY "Users can create their own doc links"
ON docs_vinculos FOR INSERT
TO public
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own doc links"
ON docs_vinculos FOR DELETE
TO public
USING (tenant_id = auth.uid());

-- 6. Criar políticas RLS para docs_etiquetas
CREATE POLICY "Users can view their own doc tags"
ON docs_etiquetas FOR SELECT
TO public
USING (tenant_id = auth.uid());

CREATE POLICY "Users can create their own doc tags"
ON docs_etiquetas FOR INSERT
TO public
WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own doc tags"
ON docs_etiquetas FOR DELETE
TO public
USING (tenant_id = auth.uid());

-- =====================================================
-- SISTEMA COMPLETO: docs, docs_vinculos, docs_etiquetas com RLS
-- =====================================================