-- Fix critical security vulnerability: Update RLS policies for contatos table
-- The current policies reference undefined functions (has_write_role, current_tenant_id)
-- This could cause policy failures and unauthorized data access

-- Drop existing policies that reference undefined functions
DROP POLICY IF EXISTS "Admins can delete contatos" ON public.contatos;
DROP POLICY IF EXISTS "Users can view their own contatos" ON public.contatos;
DROP POLICY IF EXISTS "Write role users can create contatos" ON public.contatos;
DROP POLICY IF EXISTS "Write role users can update contatos" ON public.contatos;

-- Ensure RLS is enabled
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- Create secure SELECT policy - users can only view their own contacts
CREATE POLICY "Users can view their own contatos" 
ON public.contatos 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Create secure INSERT policy - users can only create contacts for themselves
CREATE POLICY "Users can create their own contatos" 
ON public.contatos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create secure UPDATE policy - users can only update their own contacts
CREATE POLICY "Users can update their own contatos" 
ON public.contatos 
FOR UPDATE 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Create secure DELETE policy - users can only delete their own contacts (admins can delete any)
CREATE POLICY "Users can delete their own contatos" 
ON public.contatos 
FOR DELETE 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Log this critical security fix
SELECT public.log_security_event(
  'rls_policies_fixed',
  'Fixed broken RLS policies for contatos table that contained undefined function references',
  jsonb_build_object(
    'table_name', 'contatos',
    'issue', 'undefined_functions_in_policies',
    'functions_removed', 'has_write_role, current_tenant_id',
    'security_level', 'critical',
    'data_protected', 'personal_information_cpf_cnpj_emails_phones_addresses'
  )
);