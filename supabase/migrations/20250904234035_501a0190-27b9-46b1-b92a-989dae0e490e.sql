-- SaaS Core: Multi-tenant/Multi-branch system with RBAC
-- Working with existing empresas/filiais tables that use integer IDs

-- Create perfil_role type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.perfil_role AS ENUM ('admin','advogado','financeiro','cliente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabela de perfis/roles
CREATE TABLE IF NOT EXISTS public.perfis (
  slug text PRIMARY KEY,
  nome text NOT NULL
);

INSERT INTO public.perfis (slug, nome) VALUES
  ('admin','Administrador'),
  ('advogado','Advogado'),
  ('financeiro','Financeiro'),
  ('cliente','Cliente')
ON CONFLICT DO NOTHING;

-- Superadmins da plataforma (podem criar empresas)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Função utilitária de updated_at se não existir
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

-- Adicionar colunas SaaS nas tabelas existentes de empresas se não existirem
ALTER TABLE public.empresas 
  ADD COLUMN IF NOT EXISTS plano text,
  ADD COLUMN IF NOT EXISTS valor numeric(12,2),
  ADD COLUMN IF NOT EXISTS vencimento date;

-- VÍNCULO USUÁRIO x EMPRESA/FILIAL x PAPEL (usando integer IDs das tabelas existentes)
CREATE TABLE IF NOT EXISTS public.usuario_filial_perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id integer NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  filial_id integer REFERENCES public.filiais(id) ON DELETE SET NULL,
  perfil_slug text NOT NULL REFERENCES public.perfis(slug),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Adicionar indexes
CREATE INDEX IF NOT EXISTS ufp_usuario_idx ON public.usuario_filial_perfis(user_id);
CREATE INDEX IF NOT EXISTS ufp_empresa_filial_idx ON public.usuario_filial_perfis(empresa_id, filial_id);

-- Adicionar contexto atual no profiles sem quebrar funcionalidade existente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_empresa_id integer,
  ADD COLUMN IF NOT EXISTS current_filial_id integer;

-- RPC segura: setar contexto de sessão (tenant/filial) - usando integer IDs
CREATE OR REPLACE FUNCTION public.set_context(p_empresa integer, p_filial integer DEFAULT NULL)
RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_ok boolean;
BEGIN
  IF v_uid IS NULL THEN 
    RAISE EXCEPTION 'not_authenticated'; 
  END IF;

  -- superadmin pode usar qualquer contexto
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = v_uid
  ) INTO v_ok;
  
  IF NOT v_ok THEN
    -- valida vínculo do usuário com empresa/filial
    SELECT EXISTS (
      SELECT 1 FROM public.usuario_filial_perfis ufp
      WHERE ufp.user_id = v_uid
        AND ufp.empresa_id = p_empresa
        AND ufp.ativo = true
        AND (p_filial IS NULL OR ufp.filial_id = p_filial OR ufp.filial_id IS NULL)
    ) INTO v_ok;
  END IF;

  IF NOT v_ok THEN 
    RAISE EXCEPTION 'forbidden_context'; 
  END IF;

  PERFORM set_config('app.tenant_id', p_empresa::text, true);
  PERFORM set_config('app.filial_id', COALESCE(p_filial::text, ''), true);
END; $$;

-- Habilitar RLS
ALTER TABLE public.usuario_filial_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Policies VÍNCULOS
CREATE POLICY ufp_select_self_or_admin ON public.usuario_filial_perfis
FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis adminv
    WHERE adminv.user_id = auth.uid()
      AND adminv.empresa_id = usuario_filial_perfis.empresa_id
      AND adminv.perfil_slug = 'admin'
      AND adminv.ativo = true
  ) OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
);

CREATE POLICY ufp_write_admin_or_platform ON public.usuario_filial_perfis
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis adminv
    WHERE adminv.user_id = auth.uid()
      AND adminv.empresa_id = usuario_filial_perfis.empresa_id
      AND adminv.perfil_slug = 'admin'
      AND adminv.ativo = true
  )
);

-- Platform admins
CREATE POLICY platform_admins_self_only ON public.platform_admins
FOR SELECT USING (user_id = auth.uid());

-- Perfis
CREATE POLICY perfis_read_auth ON public.perfis
FOR SELECT USING (auth.uid() IS NOT NULL);