-- CRITICAL SECURITY FIX: Implement comprehensive RLS policies for contact-related tables
-- This migration fixes the public readability of sensitive customer data

-- Fix missing SELECT policy for main contatos table
CREATE POLICY "Users can view their own contatos" 
ON public.contatos 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Secure the profiles table that was publicly readable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

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

-- Secure WhatsApp related tables
ALTER TABLE public.wa_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wa_contacts" 
ON public.wa_contacts 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

CREATE POLICY "Users can manage their own wa_contacts" 
ON public.wa_contacts 
FOR ALL 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role))
WITH CHECK ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Secure whatsapp_contacts_link table
ALTER TABLE public.whatsapp_contacts_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own whatsapp_contacts_link" 
ON public.whatsapp_contacts_link 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contatos c 
  WHERE c.id = whatsapp_contacts_link.contato_id 
  AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
));

CREATE POLICY "Users can manage their own whatsapp_contacts_link" 
ON public.whatsapp_contacts_link 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.contatos c 
  WHERE c.id = whatsapp_contacts_link.contato_id 
  AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contatos c 
  WHERE c.id = whatsapp_contacts_link.contato_id 
  AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
));

-- Secure contatos_v2 table (if it exists and needs securing)
ALTER TABLE public.contatos_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contatos_v2" 
ON public.contatos_v2 
FOR SELECT 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

CREATE POLICY "Users can create their own contatos_v2" 
ON public.contatos_v2 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own contatos_v2" 
ON public.contatos_v2 
FOR UPDATE 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

CREATE POLICY "Users can delete their own contatos_v2" 
ON public.contatos_v2 
FOR DELETE 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- Log this critical security fix
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
) VALUES (
  auth.uid(),
  'critical_security_fix',
  'Implemented comprehensive RLS policies to protect sensitive customer data from public access',
  jsonb_build_object(
    'tables_secured', ARRAY['contatos', 'profiles', 'processos', 'transacoes_financeiras', 'wa_contacts', 'whatsapp_contacts_link', 'contatos_v2'],
    'vulnerability_type', 'publicly_readable_sensitive_data',
    'severity', 'critical'
  )
);