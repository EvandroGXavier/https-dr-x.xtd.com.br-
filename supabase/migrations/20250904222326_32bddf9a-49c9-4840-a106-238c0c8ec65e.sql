-- CRITICAL SECURITY FIX: Target only tables missing RLS policies
-- This fixes the publicly readable sensitive data vulnerability

-- Check if profiles table has RLS enabled, if not enable it
DO $$
BEGIN
    -- Enable RLS on profiles if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'profiles' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Create profiles policies if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        EXECUTE 'CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (has_role(''admin''::app_role))';
    END IF;
END $$;

-- Secure processos table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'processos' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processos' 
        AND policyname = 'Users can view their own processos'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own processos" ON public.processos FOR SELECT USING ((user_id = auth.uid()) OR has_role(''admin''::app_role))';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processos' 
        AND policyname = 'Users can create their own processos'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can create their own processos" ON public.processos FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processos' 
        AND policyname = 'Users can update their own processos'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their own processos" ON public.processos FOR UPDATE USING ((user_id = auth.uid()) OR has_role(''admin''::app_role))';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processos' 
        AND policyname = 'Users can delete their own processos'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete their own processos" ON public.processos FOR DELETE USING ((user_id = auth.uid()) OR has_role(''admin''::app_role))';
    END IF;
END $$;

-- Secure transacoes_financeiras table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'transacoes_financeiras' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transacoes_financeiras' 
        AND policyname = 'Users can view their own transacoes_financeiras'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can view their own transacoes_financeiras" ON public.transacoes_financeiras FOR SELECT USING ((user_id = auth.uid()) OR has_role(''admin''::app_role))';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transacoes_financeiras' 
        AND policyname = 'Users can create their own transacoes_financeiras'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can create their own transacoes_financeiras" ON public.transacoes_financeiras FOR INSERT WITH CHECK (user_id = auth.uid())';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transacoes_financeiras' 
        AND policyname = 'Users can update their own transacoes_financeiras'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can update their own transacoes_financeiras" ON public.transacoes_financeiras FOR UPDATE USING ((user_id = auth.uid()) OR has_role(''admin''::app_role))';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'transacoes_financeiras' 
        AND policyname = 'Users can delete their own transacoes_financeiras'
    ) THEN
        EXECUTE 'CREATE POLICY "Users can delete their own transacoes_financeiras" ON public.transacoes_financeiras FOR DELETE USING ((user_id = auth.uid()) OR has_role(''admin''::app_role))';
    END IF;
END $$;

-- Log this critical security fix
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
) VALUES (
  auth.uid(),
  'critical_security_fix',
  'Applied RLS policies to protect sensitive data from public access',
  jsonb_build_object(
    'tables_secured', ARRAY['profiles', 'processos', 'transacoes_financeiras'],
    'vulnerability_type', 'publicly_readable_sensitive_data',
    'severity', 'critical'
  )
);