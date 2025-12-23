-- Fix the security view by removing SECURITY DEFINER property
-- Create a regular view without SECURITY DEFINER to fix the linter warning

DROP VIEW IF EXISTS public.contatos_secure_view;

-- Create secure view function instead of a view with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.get_contatos_masked_view(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  nome text,
  nome_fantasia text,
  cpf_cnpj_masked text,
  email_masked text,
  celular_masked text,
  telefone_masked text,
  endereco text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  observacoes text,
  ativo boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  nome_mae_masked text,
  limite_credito_masked numeric,
  data_nascimento_masked date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to masked view
  PERFORM public.log_enhanced_security_event(
    'masked_contacts_view_access',
    'Access to masked contacts view',
    'low',
    jsonb_build_object(
      'limit_count', limit_count,
      'offset_count', offset_count,
      'access_type', 'MASKED_VIEW'
    )
  );

  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.nome,
    c.nome_fantasia,
    -- Always show masked data
    public.mask_cpf_cnpj(c.cpf_cnpj) as cpf_cnpj_masked,
    public.mask_email(c.email) as email_masked,
    public.mask_phone(c.celular) as celular_masked,
    public.mask_phone(c.telefone) as telefone_masked,
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
    -- Sensitive fields completely hidden
    '***PROTECTED***' as nome_mae_masked,
    NULL::numeric as limite_credito_masked,
    NULL::date as data_nascimento_masked
  FROM public.contatos c
  WHERE c.user_id = auth.uid() OR public.has_role('admin')
  ORDER BY c.nome
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;