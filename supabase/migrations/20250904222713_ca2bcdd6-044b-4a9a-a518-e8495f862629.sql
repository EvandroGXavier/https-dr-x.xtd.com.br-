-- SECURITY FIX: Add missing RLS policies for remaining publicly accessible tables

-- Secure the profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create comprehensive profile policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role('admin'::app_role));

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Secure processos table
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

-- Secure transacoes_financeiras table
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

-- Log this security fix
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
) VALUES (
  auth.uid(),
  'critical_security_fix',
  'Secured publicly accessible tables with proper RLS policies',
  jsonb_build_object(
    'tables_secured', ARRAY['profiles', 'processos', 'transacoes_financeiras'],
    'vulnerability_type', 'publicly_readable_sensitive_data',
    'severity', 'critical'
  )
);