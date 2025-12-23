-- Criar estrutura completa do sistema SaaS
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

-- 3. Tabela de SuperAdmins
CREATE TABLE IF NOT EXISTS public.saas_superadmins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de perfis de usuário com empresa/filial
CREATE TABLE IF NOT EXISTS public.usuario_filial_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id INTEGER NOT NULL REFERENCES public.saas_empresas(id) ON DELETE CASCADE,
  filial_id INTEGER REFERENCES public.saas_filiais(id) ON DELETE CASCADE,
  perfil VARCHAR(50) DEFAULT 'usuario',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, empresa_id, filial_id)
);

-- 5. Inserir empresa master
INSERT INTO public.saas_empresas (id, nome, cnpj, email, plano, ativa) 
VALUES (1, 'Empresa Master', '00.000.000/0001-00', 'master@sistema.com', 'master', true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  email = EXCLUDED.email,
  plano = EXCLUDED.plano;

-- 6. Inserir filial principal
INSERT INTO public.saas_filiais (id, empresa_id, nome, ativa) 
VALUES (1, 1, 'Filial Principal', true)
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  empresa_id = EXCLUDED.empresa_id;

-- 7. Inserir evandro como SuperAdmin
INSERT INTO public.saas_superadmins (email, ativo) 
VALUES ('evandro@conectionmg.com.br', true)
ON CONFLICT (email) DO UPDATE SET ativo = true;

-- 8. Atualizar perfil do evandro com empresa e filial master
UPDATE public.profiles 
SET 
  empresa_id = 1,
  filial_id = 1,
  current_empresa_id = 1,
  current_filial_id = 1,
  role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'evandro@conectionmg.com.br'
);

-- 9. Inserir perfil de usuário para evandro
INSERT INTO public.usuario_filial_perfis (user_id, empresa_id, filial_id, perfil, ativo)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'evandro@conectionmg.com.br'),
  1, 1, 'superadmin', true
)
ON CONFLICT (user_id, empresa_id, filial_id) DO UPDATE SET
  perfil = 'superadmin',
  ativo = true;

-- 10. Habilitar RLS nas novas tabelas
ALTER TABLE public.saas_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_filial_perfis ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para SuperAdmins
CREATE POLICY "SuperAdmins can manage empresas" ON public.saas_empresas
FOR ALL TO authenticated
USING (is_superadmin(get_current_user_email()));

CREATE POLICY "SuperAdmins can manage filiais" ON public.saas_filiais
FOR ALL TO authenticated
USING (is_superadmin(get_current_user_email()));

CREATE POLICY "SuperAdmins can view superadmins" ON public.saas_superadmins
FOR SELECT TO authenticated
USING (is_superadmin(get_current_user_email()));

CREATE POLICY "SuperAdmins can manage user profiles" ON public.usuario_filial_perfis
FOR ALL TO authenticated
USING (is_superadmin(get_current_user_email()));

-- 12. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_saas_empresas_updated_at BEFORE UPDATE ON public.saas_empresas
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_saas_filiais_updated_at BEFORE UPDATE ON public.saas_filiais
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_usuario_filial_perfis_updated_at BEFORE UPDATE ON public.usuario_filial_perfis
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();