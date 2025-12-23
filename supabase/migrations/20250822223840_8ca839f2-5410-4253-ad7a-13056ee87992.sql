-- Criar bucket de armazenamento para documentos financeiros
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-financeiros', 'documentos-financeiros', false)
ON CONFLICT (id) DO NOTHING;

-- Criar políticas para o bucket de documentos financeiros
CREATE POLICY "Users can view their own financial documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documentos-financeiros' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own financial documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documentos-financeiros' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own financial documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documentos-financeiros' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own financial documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documentos-financeiros' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Adicionar colunas para armazenar referência do documento
ALTER TABLE public.transacoes_financeiras 
ADD COLUMN IF NOT EXISTS arquivo_url TEXT,
ADD COLUMN IF NOT EXISTS arquivo_nome TEXT,
ADD COLUMN IF NOT EXISTS arquivo_tipo TEXT;