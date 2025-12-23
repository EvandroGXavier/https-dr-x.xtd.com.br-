-- Create biblioteca_grupos table (Áreas do Direito)
CREATE TABLE public.biblioteca_grupos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nome, empresa_id, filial_id)
);

-- Create biblioteca_modelos table
CREATE TABLE public.biblioteca_modelos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  grupo_id UUID NOT NULL REFERENCES public.biblioteca_grupos(id) ON DELETE CASCADE,
  descricao TEXT,
  formato TEXT NOT NULL DEFAULT 'html',
  conteudo TEXT NOT NULL,
  placeholders_suportados JSONB DEFAULT '[]'::jsonb,
  versao INTEGER DEFAULT 1,
  publicado BOOLEAN DEFAULT true,
  exige_contato BOOLEAN DEFAULT true,
  exige_processo BOOLEAN DEFAULT false,
  gatilho_financeiro BOOLEAN DEFAULT false,
  financeiro_config JSONB,
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ativo BOOLEAN DEFAULT true
);

-- Create documentos_geracoes table
CREATE TABLE public.documentos_geracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID NOT NULL REFERENCES public.biblioteca_modelos(id) ON DELETE CASCADE,
  documento_id UUID REFERENCES public.documentos(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  processo_id UUID REFERENCES public.processos(id) ON DELETE SET NULL,
  payload_variaveis JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho',
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_bib_grupos_empresa_filial ON public.biblioteca_grupos(empresa_id, filial_id);
CREATE INDEX idx_bib_grupos_slug ON public.biblioteca_grupos(slug);
CREATE INDEX idx_bib_modelos_grupo ON public.biblioteca_modelos(grupo_id);
CREATE INDEX idx_bib_modelos_empresa_filial ON public.biblioteca_modelos(empresa_id, filial_id);
CREATE INDEX idx_doc_geracoes_modelo ON public.documentos_geracoes(modelo_id);
CREATE INDEX idx_doc_geracoes_documento ON public.documentos_geracoes(documento_id);
CREATE INDEX idx_doc_geracoes_contato_processo ON public.documentos_geracoes(contato_id, processo_id);

-- Enable Row Level Security
ALTER TABLE public.biblioteca_grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_geracoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for biblioteca_grupos
CREATE POLICY "Users can create their own biblioteca_grupos" 
ON public.biblioteca_grupos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own biblioteca_grupos" 
ON public.biblioteca_grupos 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own biblioteca_grupos" 
ON public.biblioteca_grupos 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own biblioteca_grupos" 
ON public.biblioteca_grupos 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for biblioteca_modelos
CREATE POLICY "Users can create their own biblioteca_modelos" 
ON public.biblioteca_modelos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own biblioteca_modelos" 
ON public.biblioteca_modelos 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own biblioteca_modelos" 
ON public.biblioteca_modelos 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own biblioteca_modelos" 
ON public.biblioteca_modelos 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for documentos_geracoes
CREATE POLICY "Users can create their own documentos_geracoes" 
ON public.documentos_geracoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own documentos_geracoes" 
ON public.documentos_geracoes 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own documentos_geracoes" 
ON public.documentos_geracoes 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Function to create default groups for new users
CREATE OR REPLACE FUNCTION public.create_default_biblioteca_grupos()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default groups for new users
  INSERT INTO public.biblioteca_grupos (nome, slug, descricao, ordem, empresa_id, filial_id, user_id) VALUES
    ('Todos', 'todos', 'Todos os modelos', 0, NEW.empresa_id, NEW.filial_id, NEW.user_id),
    ('Cível', 'civel', 'Modelos para área cível', 1, NEW.empresa_id, NEW.filial_id, NEW.user_id),
    ('Trabalhista', 'trabalhista', 'Modelos para área trabalhista', 2, NEW.empresa_id, NEW.filial_id, NEW.user_id),
    ('Previdenciário', 'previdenciario', 'Modelos para área previdenciária', 3, NEW.empresa_id, NEW.filial_id, NEW.user_id),
    ('Penal', 'penal', 'Modelos para área penal', 4, NEW.empresa_id, NEW.filial_id, NEW.user_id),
    ('Tributário', 'tributario', 'Modelos para área tributária', 5, NEW.empresa_id, NEW.filial_id, NEW.user_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default groups when a new profile is created
CREATE TRIGGER create_default_grupos_trigger
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_biblioteca_grupos();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_biblioteca_grupos_updated_at
  BEFORE UPDATE ON public.biblioteca_grupos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_biblioteca_modelos_updated_at
  BEFORE UPDATE ON public.biblioteca_modelos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();