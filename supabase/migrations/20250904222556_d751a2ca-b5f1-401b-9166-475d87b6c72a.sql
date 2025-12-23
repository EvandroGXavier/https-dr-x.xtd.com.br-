-- SECURITY FIX: Final verification and missing RLS policies
-- Check existing tables and secure any that are missing RLS

-- Check if profiles table needs RLS (safe approach)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add profiles policies only if they don't exist (using IF NOT EXISTS pattern)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT 
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE 
    USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" 
    ON public.profiles 
    FOR SELECT 
    USING (has_role('admin'::app_role));
  END IF;
END $$;

-- Secure processos table
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'processos' 
    AND policyname = 'Users can view their own processos'
  ) THEN
    CREATE POLICY "Users can view their own processos" 
    ON public.processos 
    FOR SELECT 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'processos' 
    AND policyname = 'Users can create their own processos'
  ) THEN
    CREATE POLICY "Users can create their own processos" 
    ON public.processos 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'processos' 
    AND policyname = 'Users can update their own processos'
  ) THEN
    CREATE POLICY "Users can update their own processos" 
    ON public.processos 
    FOR UPDATE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'processos' 
    AND policyname = 'Users can delete their own processos'
  ) THEN
    CREATE POLICY "Users can delete their own processos" 
    ON public.processos 
    FOR DELETE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;
END $$;

-- Secure transacoes_financeiras table
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can view their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can view their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR SELECT 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can create their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can create their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR INSERT 
    WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can update their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can update their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR UPDATE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'transacoes_financeiras' 
    AND policyname = 'Users can delete their own transacoes_financeiras'
  ) THEN
    CREATE POLICY "Users can delete their own transacoes_financeiras" 
    ON public.transacoes_financeiras 
    FOR DELETE 
    USING ((user_id = auth.uid()) OR has_role('admin'::app_role));
  END IF;
END $$;