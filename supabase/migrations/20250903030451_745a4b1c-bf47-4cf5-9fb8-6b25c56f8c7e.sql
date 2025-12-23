-- Criar tabela contatos_v2 para o novo sistema de contatos
CREATE TABLE IF NOT EXISTS public.contatos_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  empresa_id UUID NULL,
  filial_id UUID NULL,
  
  -- Dados principais
  nome_fantasia TEXT NOT NULL,
  celular TEXT NOT NULL,
  telefone TEXT NULL,
  email TEXT NULL,
  cpf_cnpj TEXT NULL,
  observacao TEXT NULL,
  
  -- Status e controle
  ativo BOOLEAN NOT NULL DEFAULT true,
  tipo_pessoa TEXT NULL CHECK (tipo_pessoa IN ('pf', 'pj', 'lead')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contatos_v2_user_id ON public.contatos_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_contatos_v2_cpf_cnpj ON public.contatos_v2(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contatos_v2_email ON public.contatos_v2(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contatos_v2_ativo ON public.contatos_v2(ativo);

-- RLS
ALTER TABLE public.contatos_v2 ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para contatos_v2
CREATE POLICY "Users can view their own contatos_v2" 
ON public.contatos_v2 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contatos_v2" 
ON public.contatos_v2 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contatos_v2" 
ON public.contatos_v2 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contatos_v2" 
ON public.contatos_v2 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contatos_v2_updated_at
  BEFORE UPDATE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();