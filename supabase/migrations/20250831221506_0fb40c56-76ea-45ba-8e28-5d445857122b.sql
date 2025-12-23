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