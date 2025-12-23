-- Criar apenas as tabelas essenciais do sistema SaaS
-- 1. Tabela de empresas (SaaS tenants)
CREATE TABLE IF NOT EXISTS public.saas_empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  ativa BOOLEAN DEFAULT true,
  plano VARCHAR(50) DEFAULT 'basico',
  valor_plano DECIMAL(10,2) DEFAULT 0,
  data_vencimento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de filiais
CREATE TABLE IF NOT EXISTS public.saas_filiais (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES public.saas_empresas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  email VARCHAR(255),
  telefone VARCHAR(20),
  endereco TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Inserir empresa master (usando UPSERT seguro)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.saas_empresas WHERE id = 1) THEN
    INSERT INTO public.saas_empresas (id, nome, cnpj, email, plano, ativa) 
    VALUES (1, 'Empresa Master', '00.000.000/0001-00', 'master@sistema.com', 'master', true);
  END IF;
END $$;

-- 4. Inserir filial principal (usando UPSERT seguro)  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.saas_filiais WHERE id = 1) THEN
    INSERT INTO public.saas_filiais (id, empresa_id, nome, ativa) 
    VALUES (1, 1, 'Filial Principal', true);
  END IF;
END $$;

-- 5. Inserir evandro como SuperAdmin
INSERT INTO public.saas_superadmins (email) 
VALUES ('evandro@conectionmg.com.br')
ON CONFLICT (email) DO NOTHING;

-- 6. Habilitar RLS nas novas tabelas
ALTER TABLE public.saas_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_filiais ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS básicas para SuperAdmins
DROP POLICY IF EXISTS "SuperAdmins can manage empresas" ON public.saas_empresas;
CREATE POLICY "SuperAdmins can manage empresas" ON public.saas_empresas
FOR ALL TO authenticated
USING (is_superadmin(get_current_user_email()));

DROP POLICY IF EXISTS "SuperAdmins can manage filiais" ON public.saas_filiais;
CREATE POLICY "SuperAdmins can manage filiais" ON public.saas_filiais
FOR ALL TO authenticated
USING (is_superadmin(get_current_user_email()));