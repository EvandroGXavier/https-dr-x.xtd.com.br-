-- Corrigir políticas RLS de saas_empresas para não acessar auth.users diretamente
DROP POLICY IF EXISTS saas_empresas_select_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_insert_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_update_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_delete_policy ON public.saas_empresas;
DROP POLICY IF EXISTS superadmin_access_empresas ON public.saas_empresas;
DROP POLICY IF EXISTS superadmin_can_view_all_empresas ON public.saas_empresas;
DROP POLICY IF EXISTS superadmin_full_access_empresas ON public.saas_empresas;

-- Policy para SELECT: superadmin ou própria empresa
CREATE POLICY saas_empresas_select_policy
ON public.saas_empresas
FOR SELECT
TO authenticated
USING (
  -- Superadmin pode ver todas
  is_superadmin(auth.jwt()->>'email')
  -- Ou usuário vinculado à empresa
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Policy para INSERT: apenas superadmin
CREATE POLICY saas_empresas_insert_policy
ON public.saas_empresas
FOR INSERT
TO authenticated
WITH CHECK (
  is_superadmin(auth.jwt()->>'email')
);

-- Policy para UPDATE: superadmin ou própria empresa
CREATE POLICY saas_empresas_update_policy
ON public.saas_empresas
FOR UPDATE
TO authenticated
USING (
  is_superadmin(auth.jwt()->>'email')
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  is_superadmin(auth.jwt()->>'email')
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Policy para DELETE: apenas superadmin
CREATE POLICY saas_empresas_delete_policy
ON public.saas_empresas
FOR DELETE
TO authenticated
USING (
  is_superadmin(auth.jwt()->>'email')
);

-- Também corrigir saas_filiais
DROP POLICY IF EXISTS saas_filiais_select_policy ON public.saas_filiais;
DROP POLICY IF EXISTS saas_filiais_insert_policy ON public.saas_filiais;
DROP POLICY IF EXISTS saas_filiais_update_policy ON public.saas_filiais;
DROP POLICY IF EXISTS saas_filiais_delete_policy ON public.saas_filiais;

CREATE POLICY saas_filiais_select_policy
ON public.saas_filiais
FOR SELECT
TO authenticated
USING (
  is_superadmin(auth.jwt()->>'email')
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY saas_filiais_insert_policy
ON public.saas_filiais
FOR INSERT
TO authenticated
WITH CHECK (
  is_superadmin(auth.jwt()->>'email')
);

CREATE POLICY saas_filiais_update_policy
ON public.saas_filiais
FOR UPDATE
TO authenticated
USING (
  is_superadmin(auth.jwt()->>'email')
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY saas_filiais_delete_policy
ON public.saas_filiais
FOR DELETE
TO authenticated
USING (
  is_superadmin(auth.jwt()->>'email')
);