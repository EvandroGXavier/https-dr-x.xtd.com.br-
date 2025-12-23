-- Criar tabela de documentos
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo_documento TEXT NOT NULL, -- 'contrato', 'proposta', 'carta', 'relatorio', etc.
  categoria TEXT, -- categoria do documento
  arquivo_nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_tamanho INTEGER,
  arquivo_tipo TEXT, -- MIME type
  versao INTEGER NOT NULL DEFAULT 1,
  versao_principal_id UUID, -- referência para o documento principal
  status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo', 'arquivado', 'deletado'
  tags TEXT[], -- array de tags
  modelo_base TEXT, -- template usado para gerar o documento
  gerado_ia BOOLEAN DEFAULT FALSE, -- se foi gerado por IA
  prompt_ia TEXT, -- prompt usado para gerar via IA
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vinculações de documentos
CREATE TABLE public.documento_vinculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  vinculo_tipo TEXT NOT NULL, -- 'contato', 'processo', 'projeto', etc.
  vinculo_id UUID NOT NULL, -- ID do registro vinculado
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de modelos de documentos
CREATE TABLE public.documento_modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT NOT NULL, -- 'contrato', 'proposta', 'carta', etc.
  template_content TEXT NOT NULL, -- conteúdo do template
  variaveis JSONB, -- variáveis disponíveis no template
  ativo BOOLEAN DEFAULT TRUE,
  prompt_ia TEXT, -- prompt base para geração via IA
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de documentos
CREATE TABLE public.documento_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acao TEXT NOT NULL, -- 'criado', 'editado', 'nova_versao', 'arquivado', etc.
  detalhes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para documentos
CREATE POLICY "Users can view their own documentos" 
ON public.documentos 
FOR SELECT 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can create their own documentos" 
ON public.documentos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documentos" 
ON public.documentos 
FOR UPDATE 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can delete their own documentos" 
ON public.documentos 
FOR DELETE 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

-- Políticas RLS para vinculações
CREATE POLICY "Users can view their own documento_vinculos" 
ON public.documento_vinculos 
FOR SELECT 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can create their own documento_vinculos" 
ON public.documento_vinculos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documento_vinculos" 
ON public.documento_vinculos 
FOR UPDATE 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can delete their own documento_vinculos" 
ON public.documento_vinculos 
FOR DELETE 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

-- Políticas RLS para modelos
CREATE POLICY "Users can view their own documento_modelos" 
ON public.documento_modelos 
FOR SELECT 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can create their own documento_modelos" 
ON public.documento_modelos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documento_modelos" 
ON public.documento_modelos 
FOR UPDATE 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can delete their own documento_modelos" 
ON public.documento_modelos 
FOR DELETE 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

-- Políticas RLS para histórico
CREATE POLICY "Users can view their own documento_historico" 
ON public.documento_historico 
FOR SELECT 
USING ((auth.uid() = user_id) OR has_role('admin'::app_role));

CREATE POLICY "Users can create their own documento_historico" 
ON public.documento_historico 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documento_modelos_updated_at
  BEFORE UPDATE ON public.documento_modelos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar storage bucket para documentos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', false);

-- Políticas de storage para documentos
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Criar índices para performance
CREATE INDEX idx_documentos_user_id ON public.documentos(user_id);
CREATE INDEX idx_documentos_tipo ON public.documentos(tipo_documento);
CREATE INDEX idx_documentos_status ON public.documentos(status);
CREATE INDEX idx_documentos_versao_principal ON public.documentos(versao_principal_id);
CREATE INDEX idx_documento_vinculos_user_id ON public.documento_vinculos(user_id);
CREATE INDEX idx_documento_vinculos_documento_id ON public.documento_vinculos(documento_id);
CREATE INDEX idx_documento_vinculos_tipo_id ON public.documento_vinculos(vinculo_tipo, vinculo_id);
CREATE INDEX idx_documento_modelos_user_id ON public.documento_modelos(user_id);
CREATE INDEX idx_documento_modelos_categoria ON public.documento_modelos(categoria);
CREATE INDEX idx_documento_historico_documento_id ON public.documento_historico(documento_id);