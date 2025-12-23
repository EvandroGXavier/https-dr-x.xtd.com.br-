-- Criar tabelas para Biblioteca AID
-- Tabela principal de jobs de análise
CREATE TABLE public.aid_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  created_by UUID NOT NULL,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'succeeded', 'failed', 'cancelled')),
  source_module TEXT NOT NULL,
  source_ref_id UUID,
  contato_id UUID,
  sha256 TEXT,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  storage_path TEXT,
  meta JSONB DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de resultados da análise
CREATE TABLE public.aid_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL UNIQUE,
  plain_text TEXT NOT NULL,
  structured JSONB DEFAULT '{}',
  labels JSONB DEFAULT '[]',
  confidence NUMERIC(5,2),
  pages_meta JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (job_id) REFERENCES public.aid_jobs(id) ON DELETE CASCADE
);

-- Tabela de templates de extração
CREATE TABLE public.aid_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL DEFAULT 'documento',
  config JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mapeamentos
CREATE TABLE public.aid_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  template_id UUID NOT NULL,
  target_module TEXT NOT NULL,
  target_fields JSONB DEFAULT '{}',
  post_actions JSONB DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (template_id) REFERENCES public.aid_templates(id) ON DELETE CASCADE,
  UNIQUE (empresa_id, template_id, target_module)
);

-- Tabela de auditoria
CREATE TABLE public.aid_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  job_id UUID,
  action TEXT NOT NULL CHECK (action IN ('create_job', 'view_result', 'apply_mapping', 'dedupe_hit', 'delete_job')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (job_id) REFERENCES public.aid_jobs(id) ON DELETE SET NULL
);

-- Índices para performance
CREATE INDEX idx_aid_jobs_empresa_sha256 ON public.aid_jobs(empresa_id, sha256);
CREATE INDEX idx_aid_jobs_status ON public.aid_jobs(status);
CREATE INDEX idx_aid_jobs_created_by ON public.aid_jobs(created_by);
CREATE INDEX idx_aid_jobs_source_module ON public.aid_jobs(source_module);
CREATE INDEX idx_aid_audit_job_id ON public.aid_audit(job_id);
CREATE INDEX idx_aid_audit_action ON public.aid_audit(action);

-- GIN indexes para campos JSONB
CREATE INDEX idx_aid_jobs_meta_gin ON public.aid_jobs USING GIN(meta);
CREATE INDEX idx_aid_results_structured_gin ON public.aid_results USING GIN(structured);
CREATE INDEX idx_aid_results_labels_gin ON public.aid_results USING GIN(labels);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.aid_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aid_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aid_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aid_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aid_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para aid_jobs
CREATE POLICY "Users can create their own aid_jobs" 
ON public.aid_jobs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own aid_jobs" 
ON public.aid_jobs FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own aid_jobs" 
ON public.aid_jobs FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Admins can delete aid_jobs" 
ON public.aid_jobs FOR DELETE 
USING (has_role('admin'));

-- Políticas RLS para aid_results
CREATE POLICY "Users can view their aid_results" 
ON public.aid_results FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.aid_jobs 
  WHERE aid_jobs.id = aid_results.job_id 
  AND (aid_jobs.user_id = auth.uid() OR has_role('admin'))
));

-- Políticas RLS para aid_templates
CREATE POLICY "Users can create their own aid_templates" 
ON public.aid_templates FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their aid_templates" 
ON public.aid_templates FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own aid_templates" 
ON public.aid_templates FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own aid_templates" 
ON public.aid_templates FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Políticas RLS para aid_mappings
CREATE POLICY "Users can create their own aid_mappings" 
ON public.aid_mappings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their aid_mappings" 
ON public.aid_mappings FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own aid_mappings" 
ON public.aid_mappings FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own aid_mappings" 
ON public.aid_mappings FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Políticas RLS para aid_audit
CREATE POLICY "Users can create audit logs" 
ON public.aid_audit FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their audit logs" 
ON public.aid_audit FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

-- Criar bucket privado para uploads AID
INSERT INTO storage.buckets (id, name, public) 
VALUES ('aid_uploads', 'aid_uploads', false);

-- Políticas para o bucket aid_uploads
CREATE POLICY "Users can upload their files" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'aid_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their files" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'aid_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their files" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'aid_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their files" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'aid_uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_aid_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_aid_jobs_updated_at
  BEFORE UPDATE ON public.aid_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aid_updated_at();

CREATE TRIGGER update_aid_templates_updated_at
  BEFORE UPDATE ON public.aid_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aid_updated_at();

CREATE TRIGGER update_aid_mappings_updated_at
  BEFORE UPDATE ON public.aid_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aid_updated_at();