-- Remover política antiga incorreta
DROP POLICY IF EXISTS "processos_tj_tenant_access" ON public.processos_tj;

-- Criar função auxiliar para obter empresa_id do usuário (se não existir)
CREATE OR REPLACE FUNCTION public.get_user_empresa_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Política para SELECT - usuários podem ver dados da sua empresa
CREATE POLICY "processos_tj_select_by_tenant" 
ON public.processos_tj 
FOR SELECT 
USING (tenant_id = public.get_user_empresa_id());

-- Política para INSERT - usuários podem inserir dados para sua empresa
CREATE POLICY "processos_tj_insert_by_tenant" 
ON public.processos_tj 
FOR INSERT 
WITH CHECK (tenant_id = public.get_user_empresa_id());

-- Política para UPDATE - usuários podem atualizar dados da sua empresa
CREATE POLICY "processos_tj_update_by_tenant" 
ON public.processos_tj 
FOR UPDATE 
USING (tenant_id = public.get_user_empresa_id());

-- Política para DELETE - usuários podem deletar dados da sua empresa
CREATE POLICY "processos_tj_delete_by_tenant" 
ON public.processos_tj 
FOR DELETE 
USING (tenant_id = public.get_user_empresa_id());