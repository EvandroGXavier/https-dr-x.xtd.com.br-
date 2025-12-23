-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de filiais
CREATE TABLE public.filiais (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES public.empresas(id),
  nome TEXT NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir empresa padrão
INSERT INTO public.empresas (id, nome) VALUES (1, 'Empresa Principal');

-- Inserir filial padrão
INSERT INTO public.filiais (id, empresa_id, nome) VALUES (1, 1, 'Filial Principal');

-- Adicionar campos empresa_id e filial_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN empresa_id INTEGER REFERENCES public.empresas(id) DEFAULT 1,
ADD COLUMN filial_id INTEGER REFERENCES public.filiais(id) DEFAULT 1;

-- Atualizar todos os usuários existentes para usar empresa e filial padrão
UPDATE public.profiles SET empresa_id = 1, filial_id = 1 WHERE empresa_id IS NULL OR filial_id IS NULL;

-- Criar RLS policies para empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their empresa" ON public.empresas
  FOR SELECT USING (true);

-- Criar RLS policies para filiais  
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their filial" ON public.filiais
  FOR SELECT USING (true);