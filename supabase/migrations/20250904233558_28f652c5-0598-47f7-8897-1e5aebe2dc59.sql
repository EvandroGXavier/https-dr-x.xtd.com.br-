-- SaaS Core: Multi-tenant/Multi-branch system with RBAC
-- Tipos e catálogo de perfis
CREATE TYPE IF NOT EXISTS public.perfil_role AS ENUM ('admin','advogado','financeiro','cliente');

CREATE TABLE IF NOT EXISTS public.perfis (
  slug text PRIMARY KEY,  -- 'admin' | 'advogado' | 'financeiro' | 'cliente'
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

-- Função utilitária de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END; $$;

-- EMPRESAS (tenant master)
CREATE TABLE IF NOT EXISTS public.empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text UNIQUE,
  plano text,
  valor numeric(12,2),
  vencimento date,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER empresas_set_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- FILIAIS
CREATE TABLE IF NOT EXISTS public.filiais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  endereco jsonb,
  ativa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS filiais_empresa_idx ON public.filiais(empresa_id);

CREATE TRIGGER filiais_set_updated_at
  BEFORE UPDATE ON public.filiais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- VÍNCULO USUÁRIO x EMPRESA/FILIAL x PAPEL
CREATE TABLE IF NOT EXISTS public.usuario_filial_perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  filial_id uuid REFERENCES public.filiais(id) ON DELETE SET NULL,
  perfil_slug text NOT NULL REFERENCES public.perfis(slug),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, empresa_id, COALESCE(filial_id, '00000000-0000-0000-0000-000000000000'::uuid), perfil_slug)
);

CREATE INDEX IF NOT EXISTS ufp_usuario_idx ON public.usuario_filial_perfis(user_id);
CREATE INDEX IF NOT EXISTS ufp_empresa_filial_idx ON public.usuario_filial_perfis(empresa_id, filial_id);

-- Adicionar contexto atual no profiles sem quebrar funcionalidade existente
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_empresa_id uuid,
  ADD COLUMN IF NOT EXISTS current_filial_id uuid;

-- RPC segura: setar contexto de sessão (tenant/filial) após login/seleção
CREATE OR REPLACE FUNCTION public.set_context(p_empresa uuid, p_filial uuid)
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

  -- superadmin pode usar qualquer contexto (criação inicial de empresas)
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

REVOKE ALL ON FUNCTION public.set_context(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.set_context(uuid, uuid) TO authenticated;

-- Habilitar RLS
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_filial_perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Políticas EMPRESAS
CREATE POLICY emp_select_by_vinculo ON public.empresas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid()
      AND ufp.empresa_id = empresas.id
      AND ufp.ativo = true
  ) OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
);

CREATE POLICY emp_write_admin_or_platform ON public.empresas
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid()
      AND ufp.empresa_id = empresas.id
      AND ufp.perfil_slug = 'admin'
      AND ufp.ativo = true
  )
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid()
      AND ufp.empresa_id = empresas.id
      AND ufp.perfil_slug = 'admin'
      AND ufp.ativo = true
  )
);

-- Políticas FILIAIS
CREATE POLICY fil_select_by_vinculo ON public.filiais
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid()
      AND ufp.empresa_id = filiais.empresa_id
      AND ufp.ativo = true
      AND (ufp.filial_id IS NULL OR ufp.filial_id = filiais.id)
  ) OR EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
);

CREATE POLICY fil_write_admin_or_platform ON public.filiais
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid()
      AND ufp.empresa_id = filiais.empresa_id
      AND ufp.perfil_slug = 'admin'
      AND ufp.ativo = true
  )
) WITH CHECK (true);

-- Políticas VÍNCULOS
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
) WITH CHECK (true);

-- Platform admins: apenas o próprio usuário pode ver se é platform admin
CREATE POLICY platform_admins_self_only ON public.platform_admins
FOR SELECT USING (user_id = auth.uid());

-- Perfis (catálogo): leitura liberada a autenticados
CREATE POLICY perfis_read_auth ON public.perfis
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Log da implementação do SaaS Core
PERFORM public.log_security_event(
  'saas_core_implementation',
  'SaaS Core system implemented with multi-tenant RBAC',
  jsonb_build_object(
    'tables_created', ARRAY['empresas', 'filiais', 'usuario_filial_perfis', 'perfis', 'platform_admins'],
    'rpc_functions', ARRAY['set_context'],
    'security_level', 'multi_tenant_rbac'
  )
);