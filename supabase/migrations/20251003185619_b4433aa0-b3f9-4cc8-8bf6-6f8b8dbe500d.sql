-- =====================================================
-- LIMPEZA TOTAL: REMOVER SISTEMA LEGADO DE ANEXOS/DOCUMENTOS
-- Manter apenas: docs, docs_vinculos, docs_etiquetas e bucket 'docs'
-- =====================================================

-- 1. Dropar views primeiro (dependências)
DROP VIEW IF EXISTS vw_anexos_pt CASCADE;

-- 2. Dropar tabelas do sistema legado de ANEXOS
DROP TABLE IF EXISTS anexo_jobs CASCADE;
DROP TABLE IF EXISTS anexo_relacoes CASCADE;
DROP TABLE IF EXISTS anexos CASCADE;

-- 3. Dropar tabelas do sistema legado de CONTATO_ANEXO
DROP TABLE IF EXISTS contato_anexo_log CASCADE;
DROP TABLE IF EXISTS contato_anexo CASCADE;

-- 4. Dropar tabelas do sistema legado de PROCESSO_ANEXOS
DROP TABLE IF EXISTS processo_anexos CASCADE;

-- 5. Dropar tabelas do sistema legado de DOCUMENTOS
DROP TABLE IF EXISTS documentos_geracoes CASCADE;
DROP TABLE IF EXISTS documento_vinculos CASCADE;
DROP TABLE IF EXISTS documento_etiquetas CASCADE;
DROP TABLE IF EXISTS documento_historico CASCADE;
DROP TABLE IF EXISTS documento_modelos CASCADE;
DROP TABLE IF EXISTS documentos CASCADE;

-- 6. Dropar tabela legada de documentos de contato
DROP TABLE IF EXISTS contato_documentos CASCADE;

-- 7. Dropar tabela legada de documentos de honorários
DROP TABLE IF EXISTS processo_honorarios_documentos CASCADE;

-- 8. Deletar todos os objetos dos buckets legados primeiro
DELETE FROM storage.objects WHERE bucket_id IN ('documentos', 'documentos-financeiros');

-- 9. Agora pode remover os buckets legados
DELETE FROM storage.buckets WHERE name IN ('documentos', 'documentos-financeiros');

-- 10. Garantir que o bucket 'docs' existe e está público
INSERT INTO storage.buckets (id, name, public)
VALUES ('docs', 'docs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 11. Remover políticas antigas do bucket 'docs' se existirem
DROP POLICY IF EXISTS "Users can upload to docs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own docs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own docs" ON storage.objects;

-- 12. Criar políticas RLS do bucket 'docs'
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

-- =====================================================
-- SISTEMA LIMPO: Apenas docs, docs_vinculos, docs_etiquetas
-- =====================================================