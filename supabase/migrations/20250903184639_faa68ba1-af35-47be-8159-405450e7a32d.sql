-- Fix critical security vulnerability: Add missing RLS policies for contato_financeiro_config table
-- This protects sensitive financial data like bank accounts, PIX keys, and credit limits

-- Ensure RLS is enabled (should already be enabled, but confirming)
ALTER TABLE public.contato_financeiro_config ENABLE ROW LEVEL SECURITY;

-- Add INSERT policy to allow users to create financial config for their own contacts
CREATE POLICY "Users can create financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contatos c 
  WHERE c.id = contato_financeiro_config.contato_id 
  AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
));

-- Add UPDATE policy to allow users to modify financial config for their own contacts
CREATE POLICY "Users can update financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contatos c 
  WHERE c.id = contato_financeiro_config.contato_id 
  AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
));

-- Add DELETE policy to allow users to delete financial config for their own contacts
CREATE POLICY "Users can delete financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.contatos c 
  WHERE c.id = contato_financeiro_config.contato_id 
  AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
));

-- Log this critical security fix
SELECT public.log_security_event(
  'rls_policies_added',
  'Added missing INSERT/UPDATE/DELETE policies for contato_financeiro_config table to prevent financial data exposure',
  jsonb_build_object(
    'table_name', 'contato_financeiro_config',
    'policies_added', 'INSERT, UPDATE, DELETE',
    'security_level', 'critical',
    'data_protected', 'bank_accounts_pix_keys_credit_limits'
  )
);