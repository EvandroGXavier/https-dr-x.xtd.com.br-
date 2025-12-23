-- Create contato_anexo table for file attachments
CREATE TABLE public.contato_anexo (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contato_id uuid NOT NULL,
  arquivo_nome_original text NOT NULL,
  arquivo_nome_sanitizado text NOT NULL,
  arquivo_caminho text NOT NULL,
  arquivo_extensao varchar(16) NOT NULL,
  mimetype varchar(128) NOT NULL,
  tamanho_bytes bigint NOT NULL,
  sha256 char(64) NOT NULL UNIQUE,
  visivel_para_cliente boolean DEFAULT false,
  assinatura_status text DEFAULT 'nao_assinado' CHECK (assinatura_status IN ('nao_assinado', 'assinado_externo', 'assinado_govbr')),
  assinatura_metadata jsonb,
  upload_at timestamp with time zone NOT NULL DEFAULT now(),
  upload_by uuid NOT NULL,
  deleted_at timestamp with time zone,
  deleted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create contato_anexo_log table for audit logs
CREATE TABLE public.contato_anexo_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contato_anexo_id uuid NOT NULL,
  acao text NOT NULL CHECK (acao IN ('upload', 'download', 'delete')),
  ip inet,
  user_agent text,
  executado_por uuid NOT NULL,
  executado_em timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_contato_anexo_contato_id ON public.contato_anexo(contato_id);
CREATE INDEX idx_contato_anexo_user_id ON public.contato_anexo(user_id);
CREATE INDEX idx_contato_anexo_upload_at ON public.contato_anexo(upload_at);
CREATE INDEX idx_contato_anexo_sha256 ON public.contato_anexo(sha256);
CREATE INDEX idx_contato_anexo_deleted_at ON public.contato_anexo(deleted_at);
CREATE INDEX idx_contato_anexo_log_contato_anexo_id ON public.contato_anexo_log(contato_anexo_id);
CREATE INDEX idx_contato_anexo_log_executado_em ON public.contato_anexo_log(executado_em);

-- Create GIN index for assinatura_metadata jsonb
CREATE INDEX idx_contato_anexo_assinatura_metadata ON public.contato_anexo USING gin(assinatura_metadata);

-- Enable RLS
ALTER TABLE public.contato_anexo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_anexo_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for contato_anexo
CREATE POLICY "Users can view their own contato_anexo" 
ON public.contato_anexo 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own contato_anexo" 
ON public.contato_anexo 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contato_anexo" 
ON public.contato_anexo 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own contato_anexo" 
ON public.contato_anexo 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS policies for contato_anexo_log
CREATE POLICY "Users can view their own contato_anexo_log" 
ON public.contato_anexo_log 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own contato_anexo_log" 
ON public.contato_anexo_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_contato_anexo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_contato_anexo_updated_at
  BEFORE UPDATE ON public.contato_anexo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contato_anexo_updated_at();