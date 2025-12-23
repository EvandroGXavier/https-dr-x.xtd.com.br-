-- Fix RLS policies for contato_meios_contato table
-- The issue is that empresa_id and filial_id are required but the policies don't check for them properly

-- First, let's check the current policy and update it
DROP POLICY IF EXISTS "Users can manage their own contato_meios_contato" ON public.contato_meios_contato;

-- Create new policies that properly handle the empresa_id and filial_id requirements
CREATE POLICY "Users can insert contato_meios_contato for their own contacts" 
ON public.contato_meios_contato 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_meios_contato.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can update contato_meios_contato for their own contacts" 
ON public.contato_meios_contato 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_meios_contato.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can delete contato_meios_contato for their own contacts" 
ON public.contato_meios_contato 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_meios_contato.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

-- Fix RLS policies for contato_financeiro_config table
-- Update the policies to check against contatos_v2 instead of contatos
DROP POLICY IF EXISTS "Users can create financial config for their own contacts" ON public.contato_financeiro_config;
DROP POLICY IF EXISTS "Users can update financial config for their own contacts" ON public.contato_financeiro_config;
DROP POLICY IF EXISTS "Users can delete financial config for their own contacts" ON public.contato_financeiro_config;
DROP POLICY IF EXISTS "Users can view their own contato_financeiro_config" ON public.contato_financeiro_config;

CREATE POLICY "Users can create financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can update financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can delete financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

CREATE POLICY "Users can view financial config for their own contacts" 
ON public.contato_financeiro_config 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role))
  )
);

-- Fix the UUID validation error in contato_vinculos
-- The issue is likely that empresa_id and filial_id are being passed as empty strings
-- Add a validation trigger to convert empty strings to NULL for UUID fields

CREATE OR REPLACE FUNCTION public.validate_uuid_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert empty strings to NULL for UUID fields to prevent validation errors
  IF NEW.empresa_id = '' THEN
    NEW.empresa_id := NULL;
  END IF;
  
  IF NEW.filial_id = '' THEN
    NEW.filial_id := NULL;
  END IF;
  
  IF NEW.vinculado_id = '' THEN
    RAISE EXCEPTION 'vinculado_id cannot be empty';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;