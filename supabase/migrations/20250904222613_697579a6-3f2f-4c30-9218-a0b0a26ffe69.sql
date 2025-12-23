-- SECURITY FIX: Add missing RLS policies for remaining publicly accessible tables
-- Check for existing policies and only add what's missing

-- Only add missing policies that don't already exist

-- Secure the profiles table if not already secured
DO $$ 
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'profiles' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Add profile policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (has_role('admin'::app_role));
  END IF;
END $$;

-- Secure processos table if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'processos' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own processos" 
    ON public.processos 
    FOR SELECT 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

    CREATE POLICY "Users can create their own processos" 
    ON public.processos 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update their own processos" 
    ON public.processos 
    FOR UPDATE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

    CREATE POLICY "Users can delete their own processos" 
    ON public.processos 
    FOR DELETE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;
END $$;

-- Secure transacoes_financeiras table if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'transacoes_financeiras' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR SELECT 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

    CREATE POLICY "Users can create their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());

    CREATE POLICY "Users can update their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR UPDATE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

    CREATE POLICY "Users can delete their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR DELETE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;
END $$;

-- Log this security improvement
PERFORM public.log_security_event(
  'rls_policy_audit',
  'Verified and secured missing RLS policies for sensitive data tables',
  jsonb_build_object(
    'tables_checked', ARRAY['profiles', 'processos', 'transacoes_financeiras'],
    'vulnerability_type', 'missing_rls_policies',
    'severity', 'high'
  )
);