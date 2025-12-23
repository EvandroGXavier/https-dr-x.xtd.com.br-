-- Fix critical security vulnerability: Add missing SELECT policy for contatos table
-- This prevents unauthorized access to sensitive customer contact information

-- Add SELECT policy to restrict access to user-owned contact data only
CREATE POLICY "Users can view their own contatos" 
ON public.contatos 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Log this critical security fix
SELECT public.log_security_event(
  'rls_policy_added',
  'Added missing SELECT policy for contatos table to prevent data theft',
  jsonb_build_object(
    'table_name', 'contatos',
    'policy_type', 'SELECT',
    'security_level', 'critical',
    'data_protected', 'customer_contact_information'
  )
);