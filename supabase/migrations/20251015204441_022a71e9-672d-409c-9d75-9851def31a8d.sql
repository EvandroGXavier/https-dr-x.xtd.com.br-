-- =====================================================
-- 🛡️ CORREÇÕES DE SEGURANÇA COMPLETA
-- =====================================================

-- 1️⃣ Garantir RLS em todas as tabelas públicas
DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('schema_migrations', 'supabase_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

-- 2️⃣ Criar políticas padrão para tabelas sem políticas
DO $$
DECLARE
  tab RECORD;
  has_tenant_id BOOLEAN;
  has_user_id BOOLEAN;
BEGIN
  FOR tab IN
    SELECT c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT IN ('schema_migrations', 'supabase_migrations', 'profiles', 'security_audit_log', 'auditorias')
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p WHERE p.tablename = c.relname
      )
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = tab.tablename 
        AND column_name = 'tenant_id'
    ) INTO has_tenant_id;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = tab.tablename 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    IF has_tenant_id THEN
      EXECUTE format(
        'CREATE POLICY default_tenant_select_%I ON public.%I FOR SELECT USING (tenant_id = auth.uid());',
        tab.tablename, tab.tablename
      );
      EXECUTE format(
        'CREATE POLICY default_tenant_insert_%I ON public.%I FOR INSERT WITH CHECK (tenant_id = auth.uid());',
        tab.tablename, tab.tablename
      );
      EXECUTE format(
        'CREATE POLICY default_tenant_update_%I ON public.%I FOR UPDATE USING (tenant_id = auth.uid());',
        tab.tablename, tab.tablename
      );
      EXECUTE format(
        'CREATE POLICY default_tenant_delete_%I ON public.%I FOR DELETE USING (tenant_id = auth.uid());',
        tab.tablename, tab.tablename
      );
    ELSIF has_user_id THEN
      EXECUTE format(
        'CREATE POLICY default_user_select_%I ON public.%I FOR SELECT USING (user_id = auth.uid());',
        tab.tablename, tab.tablename
      );
      EXECUTE format(
        'CREATE POLICY default_user_insert_%I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid());',
        tab.tablename, tab.tablename
      );
      EXECUTE format(
        'CREATE POLICY default_user_update_%I ON public.%I FOR UPDATE USING (user_id = auth.uid());',
        tab.tablename, tab.tablename
      );
      EXECUTE format(
        'CREATE POLICY default_user_delete_%I ON public.%I FOR DELETE USING (user_id = auth.uid());',
        tab.tablename, tab.tablename
      );
    END IF;
  END LOOP;
END $$;

-- 3️⃣ Função segura de verificação de admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE user_id = auth.uid() 
      AND role = 'admin'::app_role
  );
END;
$$;

-- 4️⃣ Função de validação de senha forte
CREATE OR REPLACE FUNCTION public.validate_strong_password(password TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
  errors TEXT[] := '{}';
  is_valid BOOLEAN := true;
BEGIN
  IF length(password) < 10 THEN
    is_valid := false;
    errors := array_append(errors, 'Senha deve ter pelo menos 10 caracteres');
  END IF;
  
  IF password !~ '[A-Z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Senha deve conter pelo menos uma letra maiúscula');
  END IF;
  
  IF password !~ '[a-z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Senha deve conter pelo menos uma letra minúscula');
  END IF;
  
  IF password !~ '[0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Senha deve conter pelo menos um número');
  END IF;
  
  IF password !~ '[^A-Za-z0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Senha deve conter pelo menos um caractere especial');
  END IF;
  
  result := jsonb_build_object(
    'is_valid', is_valid,
    'errors', to_jsonb(errors),
    'strength_score', CASE 
      WHEN array_length(errors, 1) IS NULL THEN 100
      WHEN array_length(errors, 1) <= 1 THEN 75
      WHEN array_length(errors, 1) <= 2 THEN 50
      ELSE 25
    END
  );
  
  RETURN result;
END;
$$;

-- 5️⃣ View de status de segurança
CREATE OR REPLACE VIEW public.security_status AS
SELECT
  t.tablename,
  COUNT(p.policyname) AS policy_count,
  c.relrowsecurity AS rls_enabled,
  CASE 
    WHEN COUNT(p.policyname) = 0 AND c.relrowsecurity THEN 'WARNING'
    WHEN COUNT(p.policyname) > 0 AND c.relrowsecurity THEN 'OK'
    WHEN NOT c.relrowsecurity THEN 'CRITICAL'
    ELSE 'UNKNOWN'
  END AS status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename, c.relrowsecurity
ORDER BY status, t.tablename;