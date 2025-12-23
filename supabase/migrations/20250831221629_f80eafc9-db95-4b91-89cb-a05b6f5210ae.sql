-- Atualizar políticas RLS para usar as novas funções helper
-- Remover políticas antigas e criar novas padronizadas

-- CONTATOS
DROP POLICY IF EXISTS "Users can view their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can create their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can update their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can delete their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Tenant users can view contatos" ON public.contatos;
DROP POLICY IF EXISTS "Write role users can create contatos" ON public.contatos;
DROP POLICY IF EXISTS "Write role users can update contatos" ON public.contatos;
DROP POLICY IF EXISTS "Admins can delete contatos" ON public.contatos;

CREATE POLICY "Tenant users can view contatos" 
ON public.contatos FOR SELECT 
USING (user_id = public.current_tenant_id() OR has_role('admin'));

CREATE POLICY "Write role users can create contatos" 
ON public.contatos FOR INSERT 
WITH CHECK (public.has_write_role() AND user_id = public.current_tenant_id());

CREATE POLICY "Write role users can update contatos" 
ON public.contatos FOR UPDATE 
USING (user_id = public.current_tenant_id() AND public.has_write_role());

CREATE POLICY "Admins can delete contatos" 
ON public.contatos FOR DELETE 
USING (has_role('admin') OR (user_id = public.current_tenant_id() AND public.has_write_role()));

-- AGENDAS
DROP POLICY IF EXISTS "Users can view their own agendas" ON public.agendas;
DROP POLICY IF EXISTS "Users can create their own agendas" ON public.agendas;
DROP POLICY IF EXISTS "Users can update their own agendas" ON public.agendas;
DROP POLICY IF EXISTS "Users can delete their own agendas" ON public.agendas;
DROP POLICY IF EXISTS "Tenant users can view agendas" ON public.agendas;
DROP POLICY IF EXISTS "Write role users can create agendas" ON public.agendas;
DROP POLICY IF EXISTS "Write role users can update agendas" ON public.agendas;
DROP POLICY IF EXISTS "Admins can delete agendas" ON public.agendas;

CREATE POLICY "Tenant users can view agendas" 
ON public.agendas FOR SELECT 
USING (user_id = public.current_tenant_id() OR has_role('admin'));

CREATE POLICY "Write role users can create agendas" 
ON public.agendas FOR INSERT 
WITH CHECK (public.has_write_role() AND user_id = public.current_tenant_id());

CREATE POLICY "Write role users can update agendas" 
ON public.agendas FOR UPDATE 
USING (user_id = public.current_tenant_id() AND public.has_write_role());

CREATE POLICY "Admins can delete agendas" 
ON public.agendas FOR DELETE 
USING (has_role('admin') OR (user_id = public.current_tenant_id() AND public.has_write_role()));