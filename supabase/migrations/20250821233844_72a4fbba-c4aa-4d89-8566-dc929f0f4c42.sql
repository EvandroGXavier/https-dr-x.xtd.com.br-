-- Fix security warnings by setting proper search paths and removing security definer view

-- 1. Fix search path mutable warnings by setting search_path on all functions
ALTER FUNCTION public.encrypt_sensitive_data(text, text) SET search_path = public;
ALTER FUNCTION public.decrypt_sensitive_data(text, text) SET search_path = public;
ALTER FUNCTION public.mask_cpf_cnpj(text) SET search_path = public;
ALTER FUNCTION public.mask_email(text) SET search_path = public;
ALTER FUNCTION public.mask_phone(text) SET search_path = public;
ALTER FUNCTION public.log_sensitive_data_access(text, uuid, text[], text) SET search_path = public;
ALTER FUNCTION public.detect_suspicious_data_access() SET search_path = public;
ALTER FUNCTION public.log_contatos_access() SET search_path = public;
ALTER FUNCTION public.cleanup_old_sensitive_data() SET search_path = public;
ALTER FUNCTION public.enhanced_password_validation(text) SET search_path = public;

-- 2. Drop the security definer view and replace with a safer approach
DROP VIEW IF EXISTS public.contatos_safe;

-- 3. Create a function instead of view for safely accessing contact data
CREATE OR REPLACE FUNCTION public.get_contacts_safe(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  nome text,
  nome_fantasia text,
  cpf_cnpj text,
  email text,
  celular text,
  telefone text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  observacoes text,
  ativo boolean,
  created_at timestamptz,
  updated_at timestamptz,
  nome_mae text,
  limite_credito numeric,
  data_nascimento date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the access attempt
  PERFORM public.log_sensitive_data_access(
    'contatos',
    NULL,
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone', 'nome_mae', 'limite_credito'],
    'BULK_SELECT'
  );
  
  -- Check for suspicious access patterns
  PERFORM public.detect_suspicious_data_access();
  
  -- Return data with appropriate masking based on user role
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.nome,
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
    -- Non-sensitive fields remain unchanged
    c.endereco,
    c.numero,
    c.complemento,
    c.bairro,
    c.cidade,
    c.estado,
    c.cep,
    c.observacoes,
    c.ativo,
    c.created_at,
    c.updated_at,
    -- Hide extremely sensitive fields from non-admins
    CASE 
      WHEN public.has_role('admin') THEN c.nome_mae
      ELSE NULL
    END as nome_mae,
    CASE 
      WHEN public.has_role('admin') THEN c.limite_credito
      ELSE NULL
    END as limite_credito,
    CASE 
      WHEN public.has_role('admin') THEN c.data_nascimento
      ELSE NULL
    END as data_nascimento
  FROM public.contatos c
  WHERE c.user_id = auth.uid() OR public.has_role('admin')
  ORDER BY c.nome
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_contacts_safe(integer, integer) TO authenticated;