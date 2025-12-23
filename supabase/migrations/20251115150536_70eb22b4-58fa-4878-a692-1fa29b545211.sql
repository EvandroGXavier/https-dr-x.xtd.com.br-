-- Remover políticas que acabamos de criar (conflitam com a política existente)
DROP POLICY IF EXISTS "contato_meios_contato_select_policy" ON public.contato_meios_contato;
DROP POLICY IF EXISTS "contato_meios_contato_insert_policy" ON public.contato_meios_contato;
DROP POLICY IF EXISTS "contato_meios_contato_update_policy" ON public.contato_meios_contato;
DROP POLICY IF EXISTS "contato_meios_contato_delete_policy" ON public.contato_meios_contato;

-- Remover política antiga
DROP POLICY IF EXISTS "contato_meios_contato_by_tenant" ON public.contato_meios_contato;

-- Recriar política unificada incluindo tanto empresa_id quanto filial_id
CREATE POLICY "contato_meios_contato_by_tenant"
ON public.contato_meios_contato
FOR ALL
USING (
  (tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )) 
  OR has_role('admin'::app_role)
)
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )
);