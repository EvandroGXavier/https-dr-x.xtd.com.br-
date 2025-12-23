-- Criar políticas RLS para contato_meios_contato seguindo padrão multi-tenant

-- Policy para SELECT: usuários podem ver meios de contato do seu tenant
CREATE POLICY "contato_meios_contato_select_policy"
ON public.contato_meios_contato
FOR SELECT
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy para INSERT: usuários podem inserir meios de contato do seu tenant
CREATE POLICY "contato_meios_contato_insert_policy"
ON public.contato_meios_contato
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy para UPDATE: usuários podem atualizar meios de contato do seu tenant
CREATE POLICY "contato_meios_contato_update_policy"
ON public.contato_meios_contato
FOR UPDATE
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy para DELETE: usuários podem deletar meios de contato do seu tenant
CREATE POLICY "contato_meios_contato_delete_policy"
ON public.contato_meios_contato
FOR DELETE
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    UNION
    SELECT filial_id FROM public.profiles WHERE user_id = auth.uid()
  )
);