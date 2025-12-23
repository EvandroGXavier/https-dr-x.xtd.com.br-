-- Fix RLS policies for contato_enderecos to allow INSERT operations
-- The current "ALL" policy may not be working correctly for inserts

-- Drop the existing "ALL" policy and create specific policies
DROP POLICY IF EXISTS "Users can manage their own contato_enderecos" ON public.contato_enderecos;

-- Create specific policies for each operation
CREATE POLICY "Users can insert contato_enderecos for their own contacts"
ON public.contato_enderecos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contatos c
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can update contato_enderecos for their own contacts"
ON public.contato_enderecos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.contatos c
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can delete contato_enderecos for their own contacts"
ON public.contato_enderecos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.contatos c
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  )
);