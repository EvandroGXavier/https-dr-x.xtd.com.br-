-- Fix RLS policy issue for contato_documentos table
-- This table has RLS enabled but no policies, which creates a security gap

-- Check current policies on contato_documentos
-- Add proper RLS policies for contato_documentos table

CREATE POLICY "Users can view their own contato_documentos" 
ON public.contato_documentos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.contatos_v2 c
  WHERE c.id = contato_documentos.contato_id 
  AND (c.user_id = auth.uid() OR has_role('admin'))
));

CREATE POLICY "Users can create contato_documentos for their own contacts" 
ON public.contato_documentos 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.contatos_v2 c
  WHERE c.id = contato_documentos.contato_id 
  AND (c.user_id = auth.uid() OR has_role('admin'))
));

CREATE POLICY "Users can update their own contato_documentos" 
ON public.contato_documentos 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.contatos_v2 c
  WHERE c.id = contato_documentos.contato_id 
  AND (c.user_id = auth.uid() OR has_role('admin'))
));

CREATE POLICY "Users can delete their own contato_documentos" 
ON public.contato_documentos 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.contatos_v2 c
  WHERE c.id = contato_documentos.contato_id 
  AND (c.user_id = auth.uid() OR has_role('admin'))
));