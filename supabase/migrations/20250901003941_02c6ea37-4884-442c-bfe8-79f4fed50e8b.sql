-- Feature SaaS V1 - Criação das tabelas necessárias
-- IMPORTANTE: NÃO criar tabelas de empresa/filial/usuários (já existem)

-- 0) Superadmins (controle do painel)
CREATE TABLE IF NOT EXISTS public.saas_superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (position('@' in email) > 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmins_select"
ON public.saas_superadmins
FOR SELECT USING (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
);

CREATE POLICY "superadmins_write"
ON public.saas_superadmins
FOR ALL USING (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
);

-- 1) Catálogo de Planos
CREATE TABLE IF NOT EXISTS public.saas_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor_padrao numeric(12,2) NOT NULL DEFAULT 0,
  limite_usuarios int,
  limite_filiais int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planos_rw_superadmin"
ON public.saas_planos
FOR ALL USING (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
);

-- 2) Assinaturas por Empresa (referencia EMPRESA existente)
CREATE TABLE IF NOT EXISTS public.saas_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id integer NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES public.saas_planos(id) ON DELETE RESTRICT,
  valor_mensal numeric(12,2) NOT NULL,
  dia_vencimento int NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 28),
  status text NOT NULL DEFAULT 'ATIVA', -- ATIVA | INADIMPLENTE | CANCELADA
  trial_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saas_assinaturas_empresa_idx ON public.saas_assinaturas(empresa_id);

ALTER TABLE public.saas_assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assinaturas_rw_superadmin"
ON public.saas_assinaturas
FOR ALL USING (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
);

-- 3) Convites de Usuário Admin Inicial (sem duplicar profiles)
CREATE TABLE IF NOT EXISTS public.saas_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id integer NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  filial_id integer REFERENCES public.filiais(id) ON DELETE SET NULL, -- opcional
  email text NOT NULL CHECK (position('@' in email) > 1),
  status text NOT NULL DEFAULT 'pendente', -- pendente | aceito | expirado | cancelado
  token text NOT NULL UNIQUE, -- para fluxo de convite
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saas_convites_empresa_idx ON public.saas_convites(empresa_id);

ALTER TABLE public.saas_convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convites_rw_superadmin"
ON public.saas_convites
FOR ALL USING (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
)
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email())
);

-- Função para listar empresas com assinaturas
CREATE OR REPLACE FUNCTION public.saas_list_empresas_com_assinatura()
RETURNS TABLE(
  empresa_id integer,
  razao_social text,
  nome_fantasia text,
  plano text,
  valor numeric,
  dia_vencimento int,
  status text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se é superadmin
  IF NOT EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email()) 
     AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    e.id as empresa_id,
    e.nome as razao_social,
    COALESCE(e.nome, '') as nome_fantasia,
    COALESCE(p.nome, 'Sem plano') as plano,
    COALESCE(a.valor_mensal, 0) as valor,
    COALESCE(a.dia_vencimento, 1) as dia_vencimento,
    COALESCE(a.status, 'INATIVA') as status,
    COALESCE(a.updated_at, e.updated_at) as updated_at
  FROM public.empresas e
  LEFT JOIN public.saas_assinaturas a ON a.empresa_id = e.id
  LEFT JOIN public.saas_planos p ON p.id = a.plano_id
  ORDER BY e.nome;
END;
$$;

-- Seed inicial do superadmin
INSERT INTO public.saas_superadmins(email) 
VALUES ('evandro@conectionmg.com.br') 
ON CONFLICT (email) DO NOTHING;

-- Planos iniciais
INSERT INTO public.saas_planos (nome, descricao, valor_padrao, limite_usuarios, limite_filiais)
VALUES 
  ('Básico', 'Plano básico para pequenos escritórios', 99.90, 5, 1),
  ('Profissional', 'Plano profissional para médios escritórios', 199.90, 15, 3),
  ('Empresarial', 'Plano empresarial para grandes escritórios', 399.90, 50, 10)
ON CONFLICT DO NOTHING;