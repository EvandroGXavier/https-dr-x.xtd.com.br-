-- Criar funções helpers para RLS multi-tenant
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Por enquanto retorna user_id como tenant_id
  -- Futuramente pode buscar tenant_id real de uma tabela de usuários
  SELECT auth.uid();
$$;

-- Função para verificar permissões de escrita
CREATE OR REPLACE FUNCTION public.has_write_role()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Verifica se o usuário tem papel de escrita (admin ou user)
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'user'),
    false
  );
$$;

-- Trigger function para definir tenant_id automaticamente
CREATE OR REPLACE FUNCTION public.set_tenant_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se tenant_id não foi fornecido, define como current_tenant_id()
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  -- Para compatibilidade, se houver campo tenant_id e não foi definido
  IF TG_TABLE_NAME IN ('anexos', 'anexo_relacoes', 'anexo_jobs') THEN
    IF NEW.tenant_id IS NULL THEN
      NEW.tenant_id = public.current_tenant_id();
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Aplicar trigger nas tabelas principais (apenas onde não existe)
DO $$
DECLARE
  table_name text;
  trigger_exists boolean;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['contatos', 'agendas', 'documentos', 'contas_financeiras', 'transacoes_financeiras', 'biblioteca_modelos', 'email_contas'])
  LOOP
    -- Verificar se o trigger já existe
    SELECT EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = table_name 
      AND trigger_name = 'set_tenant_on_insert_trigger'
    ) INTO trigger_exists;
    
    -- Criar trigger apenas se não existir
    IF NOT trigger_exists THEN
      EXECUTE format('
        CREATE TRIGGER set_tenant_on_insert_trigger
        BEFORE INSERT ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.set_tenant_on_insert();
      ', table_name);
    END IF;
  END LOOP;
END $$;

-- Atualizar políticas RLS para usar as novas funções helper
-- Remover políticas antigas e criar novas padronizadas

-- CONTATOS
DROP POLICY IF EXISTS "Users can view their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can create their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can update their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can delete their own contatos" ON public.contatos;

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

-- DOCUMENTOS
DROP POLICY IF EXISTS "Users can view their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can create their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can update their own documentos" ON public.documentos;
DROP POLICY IF EXISTS "Users can delete their own documentos" ON public.documentos;

CREATE POLICY "Tenant users can view documentos" 
ON public.documentos FOR SELECT 
USING (user_id = public.current_tenant_id() OR has_role('admin'));

CREATE POLICY "Write role users can create documentos" 
ON public.documentos FOR INSERT 
WITH CHECK (public.has_write_role() AND user_id = public.current_tenant_id());

CREATE POLICY "Write role users can update documentos" 
ON public.documentos FOR UPDATE 
USING (user_id = public.current_tenant_id() AND public.has_write_role());

CREATE POLICY "Admins can delete documentos" 
ON public.documentos FOR DELETE 
USING (has_role('admin') OR (user_id = public.current_tenant_id() AND public.has_write_role()));

-- TRANSAÇÕES FINANCEIRAS  
DROP POLICY IF EXISTS "Users can view their own transacoes_financeiras" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Users can create their own transacoes_financeiras" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Users can update their own transacoes_financeiras" ON public.transacoes_financeiras;
DROP POLICY IF EXISTS "Users can delete their own transacoes_financeiras" ON public.transacoes_financeiras;

CREATE POLICY "Tenant users can view transacoes_financeiras" 
ON public.transacoes_financeiras FOR SELECT 
USING (user_id = public.current_tenant_id() OR has_role('admin'));

CREATE POLICY "Write role users can create transacoes_financeiras" 
ON public.transacoes_financeiras FOR INSERT 
WITH CHECK (public.has_write_role() AND user_id = public.current_tenant_id());

CREATE POLICY "Write role users can update transacoes_financeiras" 
ON public.transacoes_financeiras FOR UPDATE 
USING (user_id = public.current_tenant_id() AND public.has_write_role());

CREATE POLICY "Admins can delete transacoes_financeiras" 
ON public.transacoes_financeiras FOR DELETE 
USING (has_role('admin') OR (user_id = public.current_tenant_id() AND public.has_write_role()));

-- CONTAS FINANCEIRAS
DROP POLICY IF EXISTS "Users can view their own contas_financeiras" ON public.contas_financeiras;
DROP POLICY IF EXISTS "Users can create their own contas_financeiras" ON public.contas_financeiras;
DROP POLICY IF EXISTS "Users can update their own contas_financeiras" ON public.contas_financeiras;
DROP POLICY IF EXISTS "Users can delete their own contas_financeiras" ON public.contas_financeiras;

CREATE POLICY "Tenant users can view contas_financeiras" 
ON public.contas_financeiras FOR SELECT 
USING (user_id = public.current_tenant_id() OR has_role('admin'));

CREATE POLICY "Write role users can create contas_financeiras" 
ON public.contas_financeiras FOR INSERT 
WITH CHECK (public.has_write_role() AND user_id = public.current_tenant_id());

CREATE POLICY "Write role users can update contas_financeiras" 
ON public.contas_financeiras FOR UPDATE 
USING (user_id = public.current_tenant_id() AND public.has_write_role());

CREATE POLICY "Admins can delete contas_financeiras" 
ON public.contas_financeiras FOR DELETE 
USING (has_role('admin') OR (user_id = public.current_tenant_id() AND public.has_write_role()));

-- Log das mudanças
PERFORM public.log_security_event(
  'rls_policies_normalized',
  'Políticas RLS normalizadas com funções helper multi-tenant para todos os módulos CRUD',
  jsonb_build_object(
    'tables_updated', ARRAY['contatos', 'agendas', 'documentos', 'transacoes_financeiras', 'contas_financeiras'],
    'helper_functions', ARRAY['current_tenant_id', 'has_write_role', 'set_tenant_on_insert'],
    'trigger_applied', true
  )
);