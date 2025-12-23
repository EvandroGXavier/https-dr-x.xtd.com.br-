-- SECURITY FIX: Replace insecure public policies with proper authentication-based policies

-- First, drop the dangerously permissive policies
DROP POLICY IF EXISTS "Users can view their empresa" ON public.empresas;
DROP POLICY IF EXISTS "Users can view their filial" ON public.filiais;

-- Add user_id column to empresas table for proper tenant isolation (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'empresas' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.empresas ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Add user_id column to filiais table for proper tenant isolation (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'filiais' 
                   AND column_name = 'user_id') THEN
        ALTER TABLE public.filiais ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create secure RLS policies for empresas table
CREATE POLICY "Authenticated users can view their own empresas" 
ON public.empresas 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY "Authenticated users can create their own empresas" 
ON public.empresas 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own empresas" 
ON public.empresas 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() OR has_role('admin'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY "Admins can delete empresas" 
ON public.empresas 
FOR DELETE 
TO authenticated 
USING (has_role('admin'::app_role));

-- Create secure RLS policies for filiais table
CREATE POLICY "Authenticated users can view their own filiais" 
ON public.filiais 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY "Authenticated users can create their own filiais" 
ON public.filiais 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own filiais" 
ON public.filiais 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() OR has_role('admin'::app_role))
WITH CHECK (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY "Admins can delete filiais" 
ON public.filiais 
FOR DELETE 
TO authenticated 
USING (has_role('admin'::app_role));

-- Log the security fix
PERFORM public.log_security_event(
  'security_vulnerability_fixed',
  'Fixed critical RLS vulnerability on empresas and filiais tables',
  jsonb_build_object(
    'severity', 'critical',
    'tables_affected', ARRAY['empresas', 'filiais'],
    'vulnerability_type', 'public_data_exposure',
    'fix_applied', 'proper_rls_policies_with_authentication'
  )
);