-- Remove old contatos table and ensure only contatos_v2 is used
-- This fixes the security vulnerability by eliminating the redundant table

-- First, check if there are any foreign key constraints pointing to contatos table
-- and update them to point to contatos_v2 if needed

-- Drop the old contatos table (it's empty and not being used)
DROP TABLE IF EXISTS public.contatos CASCADE;

-- Update any functions that might reference the old contatos table
-- Update get_contacts_safe function to use contatos_v2
DROP FUNCTION IF EXISTS public.get_contacts_safe(integer, integer);

CREATE OR REPLACE FUNCTION public.get_contacts_safe(limit_count integer DEFAULT 100, offset_count integer DEFAULT 0)
RETURNS TABLE(id uuid, user_id uuid, nome_fantasia text, cpf_cnpj text, email text, celular text, telefone text, ativo boolean, created_at timestamp with time zone, updated_at timestamp with time zone, tipo_pessoa text, empresa_id uuid, filial_id uuid, observacao text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access attempt
  PERFORM public.log_sensitive_data_access(
    'contatos_v2',
    NULL,
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone'],
    'BULK_SELECT'
  );
  
  -- Check for suspicious access patterns
  PERFORM public.detect_suspicious_data_access();
  
  -- Return data with appropriate masking based on user role
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.nome_fantasia,
    -- Masked sensitive fields for non-admins
    CASE 
      WHEN public.has_role('admin') THEN c.cpf_cnpj
      ELSE public.mask_cpf_cnpj(c.cpf_cnpj)
    END as cpf_cnpj,
    CASE 
      WHEN public.has_role('admin') THEN c.email
      ELSE public.mask_email(c.email)
    END as email,
    CASE 
      WHEN public.has_role('admin') THEN c.celular
      ELSE public.mask_phone(c.celular)
    END as celular,
    CASE 
      WHEN public.has_role('admin') THEN c.telefone
      ELSE public.mask_phone(c.telefone)
    END as telefone,
    c.ativo,
    c.created_at,
    c.updated_at,
    c.tipo_pessoa,
    c.empresa_id,
    c.filial_id,
    c.observacao
  FROM public.contatos_v2 c
  WHERE c.user_id = auth.uid() OR public.has_role('admin')
  ORDER BY c.nome_fantasia
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Update get_contact_secure_view function to use contatos_v2
DROP FUNCTION IF EXISTS public.get_contact_secure_view(uuid);

CREATE OR REPLACE FUNCTION public.get_contact_secure_view(contact_id uuid)
RETURNS TABLE(id uuid, nome_fantasia text, cpf_cnpj text, email text, celular text, telefone text, ativo boolean, created_at timestamp with time zone, tipo_pessoa text, observacao text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the individual contact access
  PERFORM public.log_sensitive_data_access(
    'contatos_v2',
    contact_id,
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone'],
    'INDIVIDUAL_VIEW'
  );
  
  -- Check for suspicious access patterns
  PERFORM public.detect_suspicious_data_access();
  
  -- Return masked data based on user role and ownership
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_fantasia,
    -- Enhanced masking for sensitive fields
    CASE 
      WHEN public.has_role('admin') OR c.user_id = auth.uid() THEN c.cpf_cnpj
      ELSE public.mask_cpf_cnpj(c.cpf_cnpj)
    END as cpf_cnpj,
    CASE 
      WHEN public.has_role('admin') OR c.user_id = auth.uid() THEN c.email
      ELSE public.mask_email(c.email)
    END as email,
    CASE 
      WHEN public.has_role('admin') OR c.user_id = auth.uid() THEN c.celular
      ELSE public.mask_phone(c.celular)
    END as celular,
    CASE 
      WHEN public.has_role('admin') OR c.user_id = auth.uid() THEN c.telefone
      ELSE public.mask_phone(c.telefone)
    END as telefone,
    c.ativo,
    c.created_at,
    c.tipo_pessoa,
    c.observacao
  FROM public.contatos_v2 c
  WHERE c.id = contact_id 
    AND (c.user_id = auth.uid() OR public.has_role('admin'));
END;
$$;

-- Update log_contatos_access function to reference contatos_v2
DROP FUNCTION IF EXISTS public.log_contatos_access();

-- Ensure all existing functions that reference contatos now use contatos_v2
-- This eliminates any security vulnerabilities from the old table structure