-- Tabela principal de anexos
CREATE TABLE public.anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  empresa_id UUID NULL,
  modulo TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  hash_sha256 TEXT NULL,
  source_method TEXT NOT NULL CHECK (source_method IN ('upload', 'paste', 'dragdrop', 'camera', 'whatsapp', 'email', 'pdf-import', 'screenshot', 'clipboard', 'url')),
  status TEXT NOT NULL DEFAULT 'stored' CHECK (status IN ('stored', 'processing', 'processed', 'error')),
  virus_scan_status TEXT NOT NULL DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'skipped')),
  retention_policy TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'running', 'success', 'failed', 'skipped')),
  ocr_text TEXT NULL,
  ocr_confidence NUMERIC(5,2) NULL,
  extracted_entities JSONB NOT NULL DEFAULT '{}',
  visibility JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_deleted BOOLEAN DEFAULT false
);

-- Fila de processamento
CREATE TABLE public.anexo_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  anexo_id UUID NOT NULL,
  job_type TEXT NOT NULL CHECK (job_type IN ('ocr', 'virus_scan', 'entity_extract')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'error', 'retrying')),
  retries INTEGER DEFAULT 0,
  error_message TEXT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Relacionamentos múltiplos
CREATE TABLE public.anexo_relacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  anexo_id UUID NOT NULL,
  modulo TEXT NOT NULL,
  record_type TEXT NOT NULL,
  record_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_anexos_tenant_modulo_record ON public.anexos (tenant_id, modulo, record_id);
CREATE UNIQUE INDEX idx_anexos_hash_unique ON public.anexos (hash_sha256) WHERE is_deleted = false AND hash_sha256 IS NOT NULL;
CREATE INDEX idx_anexos_status ON public.anexos (status, ocr_status, virus_scan_status);
CREATE INDEX idx_anexo_jobs_status ON public.anexo_jobs (status, job_type);
CREATE INDEX idx_anexo_relacoes_tenant_record ON public.anexo_relacoes (tenant_id, modulo, record_id);

-- Foreign keys
ALTER TABLE public.anexo_jobs ADD CONSTRAINT fk_anexo_jobs_anexo_id FOREIGN KEY (anexo_id) REFERENCES public.anexos(id) ON DELETE CASCADE;
ALTER TABLE public.anexo_relacoes ADD CONSTRAINT fk_anexo_relacoes_anexo_id FOREIGN KEY (anexo_id) REFERENCES public.anexos(id) ON DELETE CASCADE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_anexos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_anexos_updated_at
  BEFORE UPDATE ON public.anexos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_anexos_updated_at();

CREATE TRIGGER update_anexo_jobs_updated_at
  BEFORE UPDATE ON public.anexo_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_anexos_updated_at();

-- RLS Policies para anexos
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own anexos" 
ON public.anexos 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  has_role('admin'::app_role)
);

CREATE POLICY "Users can create their own anexos" 
ON public.anexos 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can update their own anexos" 
ON public.anexos 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  has_role('admin'::app_role)
);

CREATE POLICY "Users can delete their own anexos" 
ON public.anexos 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  has_role('admin'::app_role)
);

-- RLS Policies para anexo_jobs
ALTER TABLE public.anexo_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their anexo_jobs" 
ON public.anexo_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.anexos 
    WHERE anexos.id = anexo_jobs.anexo_id 
    AND (anexos.created_by = auth.uid() OR has_role('admin'::app_role))
  )
);

CREATE POLICY "System can manage anexo_jobs" 
ON public.anexo_jobs 
FOR ALL 
USING (has_role('admin'::app_role));

-- RLS Policies para anexo_relacoes  
ALTER TABLE public.anexo_relacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their anexo_relacoes" 
ON public.anexo_relacoes 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  has_role('admin'::app_role)
);

CREATE POLICY "Users can create anexo_relacoes" 
ON public.anexo_relacoes 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by
);

CREATE POLICY "Users can delete anexo_relacoes" 
ON public.anexo_relacoes 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  has_role('admin'::app_role)
);

-- Storage bucket para anexos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('anexos', 'anexos', false);

-- Storage policies
CREATE POLICY "Users can upload their anexos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'anexos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their anexos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'anexos' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('admin'::app_role)
  )
);

CREATE POLICY "Users can delete their anexos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'anexos' AND 
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    has_role('admin'::app_role)
  )
);

-- Função para obter tenant_id do usuário (placeholder)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid(); -- Por enquanto retorna user_id, depois implementar tenant_id
$$;