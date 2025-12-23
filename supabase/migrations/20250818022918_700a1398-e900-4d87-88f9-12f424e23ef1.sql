-- Create etiquetas table
CREATE TABLE public.etiquetas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL,
  cor TEXT DEFAULT '#6B7280',
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  UNIQUE (empresa_id, filial_id, slug)
);

-- Create etiqueta_vinculos table (polymorphic association)
CREATE TABLE public.etiqueta_vinculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
  referencia_tipo TEXT NOT NULL, -- 'contatos', 'empresas', 'negócios', etc.
  referencia_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiqueta_vinculos ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_etiquetas_empresa_filial ON public.etiquetas(empresa_id, filial_id);
CREATE INDEX idx_etiquetas_slug ON public.etiquetas(slug);
CREATE INDEX idx_etiqueta_vinculos_etiqueta ON public.etiqueta_vinculos(etiqueta_id);
CREATE INDEX idx_etiqueta_vinculos_referencia ON public.etiqueta_vinculos(referencia_tipo, referencia_id);
CREATE INDEX idx_etiqueta_vinculos_empresa_filial ON public.etiqueta_vinculos(empresa_id, filial_id);

-- Create RLS policies for etiquetas
CREATE POLICY "Users can view their etiquetas" 
ON public.etiquetas 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'::app_role));

CREATE POLICY "Users can create their etiquetas" 
ON public.etiquetas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their etiquetas" 
ON public.etiquetas 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'::app_role));

CREATE POLICY "Users can delete their etiquetas" 
ON public.etiquetas 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'::app_role));

-- Create RLS policies for etiqueta_vinculos
CREATE POLICY "Users can view their etiqueta_vinculos" 
ON public.etiqueta_vinculos 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'::app_role));

CREATE POLICY "Users can create their etiqueta_vinculos" 
ON public.etiqueta_vinculos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their etiqueta_vinculos" 
ON public.etiqueta_vinculos 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'::app_role));

CREATE POLICY "Users can delete their etiqueta_vinculos" 
ON public.etiqueta_vinculos 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'::app_role));

-- Create function to generate slug from nome
CREATE OR REPLACE FUNCTION public.generate_etiqueta_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug = lower(
    regexp_replace(
      unaccent(NEW.nome),
      '[^a-zA-Z0-9]',
      '',
      'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slug generation
CREATE TRIGGER generate_etiqueta_slug_trigger
  BEFORE INSERT OR UPDATE ON public.etiquetas
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_etiqueta_slug();

-- Create trigger for updating updated_at
CREATE TRIGGER update_etiquetas_updated_at
  BEFORE UPDATE ON public.etiquetas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();