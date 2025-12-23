-- Fix RLS policies for contato_enderecos table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert contato_enderecos for their own contacts" ON public.contato_enderecos;
DROP POLICY IF EXISTS "Users can update contato_enderecos for their own contacts" ON public.contato_enderecos;
DROP POLICY IF EXISTS "Users can delete contato_enderecos for their own contacts" ON public.contato_enderecos;
DROP POLICY IF EXISTS "Users can view their own contato_enderecos" ON public.contato_enderecos;

-- Create new policies with proper user checking
CREATE POLICY "Users can view contato_enderecos for their own contacts" 
ON public.contato_enderecos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "Users can insert contato_enderecos for their own contacts" 
ON public.contato_enderecos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "Users can update contato_enderecos for their own contacts" 
ON public.contato_enderecos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'))
  )
);

CREATE POLICY "Users can delete contato_enderecos for their own contacts" 
ON public.contato_enderecos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'))
  )
);