-- Enhanced RLS Security for Contatos Table
-- This migration strengthens data protection for sensitive customer information

-- First, create a more restrictive function for sensitive data access validation
CREATE OR REPLACE FUNCTION public.validate_contatos_access(
  access_type text,
  record_id uuid DEFAULT NULL,
  user_role app_role DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role app_role;
  access_allowed boolean := false;
  recent_access_count integer;
BEGIN
  -- Get current user role
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Check bulk access rate limiting (max 10 bulk accesses per hour for regular users)
  IF access_type = 'BULK_SELECT' THEN
    SELECT COUNT(*) INTO recent_access_count
    FROM public.security_audit_log
    WHERE user_id = auth.uid()
      AND event_type = 'sensitive_data_access'
      AND metadata->>'access_type' = 'BULK_SELECT'
      AND created_at > now() - interval '1 hour';
    
    -- Admins get higher limits
    IF current_user_role = 'admin' AND recent_access_count >= 50 THEN
      RETURN false;
    ELSIF current_user_role != 'admin' AND recent_access_count >= 10 THEN
      RETURN false;
    END IF;
  END IF;
  
  -- Individual record access - more lenient but still monitored
  IF access_type = 'INDIVIDUAL_SELECT' THEN
    SELECT COUNT(*) INTO recent_access_count
    FROM public.security_audit_log
    WHERE user_id = auth.uid()
      AND event_type = 'sensitive_data_access'
      AND created_at > now() - interval '10 minutes';
    
    -- Prevent rapid-fire individual access
    IF recent_access_count >= 100 THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- Enhanced secure contacts function with stricter access controls
CREATE OR REPLACE FUNCTION public.get_contacts_ultra_secure(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  export_purpose text DEFAULT 'view',
  require_justification text DEFAULT NULL
) RETURNS TABLE(
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  nome_mae text,
  limite_credito numeric,
  data_nascimento date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role app_role;
  access_validated boolean;
BEGIN
  -- Get user role
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Validate access permissions
  access_validated := public.validate_contatos_access('BULK_SELECT');
  
  IF NOT access_validated THEN
    RAISE EXCEPTION 'Access denied: Rate limit exceeded or insufficient permissions';
  END IF;
  
  -- Enhanced logging with more context
  PERFORM public.log_enhanced_security_event(
    'sensitive_data_bulk_access',
    format('Bulk contacts access: %s records for %s purpose', limit_count, export_purpose),
    CASE 
      WHEN export_purpose = 'export' THEN 'high'
      WHEN limit_count > 100 THEN 'medium'
      ELSE 'low'
    END,
    jsonb_build_object(
      'table_name', 'contatos',
      'access_type', 'BULK_SELECT',
      'limit_count', limit_count,
      'offset_count', offset_count,
      'export_purpose', export_purpose,
      'justification', require_justification,
      'user_role', user_role
    )
  );
  
  -- Return data with enhanced field-level security based on user role and context
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.nome,
    c.nome_fantasia,
    -- Ultra-secure masking for sensitive fields
    CASE 
      WHEN user_role = 'admin' THEN c.cpf_cnpj
      WHEN export_purpose = 'export' AND user_role = 'moderator' THEN public.mask_cpf_cnpj(c.cpf_cnpj)
      ELSE '***PROTECTED***'
    END as cpf_cnpj,
    CASE 
      WHEN user_role = 'admin' THEN c.email
      WHEN user_role = 'moderator' THEN public.mask_email(c.email)
      ELSE '***PROTECTED***'
    END as email,
    CASE 
      WHEN user_role = 'admin' THEN c.celular
      WHEN user_role = 'moderator' THEN public.mask_phone(c.celular)
      ELSE '***PROTECTED***'
    END as celular,
    CASE 
      WHEN user_role = 'admin' THEN c.telefone
      WHEN user_role = 'moderator' THEN public.mask_phone(c.telefone)
      ELSE '***PROTECTED***'
    END as telefone,
    -- Address info - less sensitive, more accessible
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
    -- Ultra-sensitive fields - admin only
    CASE 
      WHEN user_role = 'admin' THEN c.nome_mae
      ELSE NULL
    END as nome_mae,
    CASE 
      WHEN user_role = 'admin' THEN c.limite_credito
      WHEN user_role = 'moderator' THEN ROUND(c.limite_credito / 1000) * 1000 -- Rounded to nearest thousand
      ELSE NULL
    END as limite_credito,
    CASE 
      WHEN user_role = 'admin' THEN c.data_nascimento
      ELSE NULL
    END as data_nascimento
  FROM public.contatos c
  WHERE c.user_id = auth.uid() OR user_role = 'admin'
  ORDER BY c.nome
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Create emergency data breach lockdown function
CREATE OR REPLACE FUNCTION public.emergency_lockdown_contacts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log emergency lockdown
  PERFORM public.log_enhanced_security_event(
    'emergency_data_lockdown',
    'Emergency lockdown activated for contacts table',
    'critical',
    jsonb_build_object(
      'table_affected', 'contatos',
      'lockdown_reason', 'potential_data_breach',
      'activated_by', auth.uid()
    )
  );
  
  -- Temporarily disable all non-admin access to contacts
  -- This would be implemented with a lockdown flag in a settings table
  -- For now, we just log the event for manual intervention
  
  RAISE NOTICE 'Emergency lockdown logged. Manual intervention required.';
END;
$$;

-- Enhanced audit trigger for contacts table
CREATE OR REPLACE FUNCTION public.audit_contatos_access_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sensitive_fields text[] := ARRAY['cpf_cnpj', 'email', 'celular', 'telefone', 'nome_mae', 'limite_credito', 'data_nascimento'];
  user_role app_role;
  risk_level text := 'low';
BEGIN
  -- Get user role for risk assessment
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  -- Assess risk level based on operation and user role
  IF TG_OP = 'DELETE' THEN
    risk_level := 'high';
  ELSIF TG_OP = 'UPDATE' AND OLD.cpf_cnpj IS DISTINCT FROM NEW.cpf_cnpj THEN
    risk_level := 'critical'; -- CPF/CNPJ changes are highly suspicious
  ELSIF TG_OP = 'INSERT' AND user_role != 'admin' THEN
    risk_level := 'medium';
  END IF;
  
  -- Enhanced logging with risk assessment
  PERFORM public.log_enhanced_security_event(
    'contact_data_operation',
    format('Contact %s operation by %s user', TG_OP, COALESCE(user_role::text, 'unknown')),
    risk_level,
    jsonb_build_object(
      'operation', TG_OP,
      'contact_id', COALESCE(NEW.id, OLD.id),
      'user_role', user_role,
      'sensitive_fields_affected', sensitive_fields,
      'suspicious_indicators', CASE 
        WHEN TG_OP = 'UPDATE' AND OLD.cpf_cnpj IS DISTINCT FROM NEW.cpf_cnpj THEN 'cpf_cnpj_changed'
        WHEN TG_OP = 'DELETE' THEN 'record_deletion'
        ELSE 'normal_operation'
      END
    )
  );
  
  -- Check for potential breach patterns
  PERFORM public.detect_data_breach_patterns();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop existing trigger and create enhanced one
DROP TRIGGER IF EXISTS log_contatos_access ON public.contatos;
CREATE TRIGGER audit_contatos_access_enhanced
  AFTER INSERT OR UPDATE OR DELETE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.audit_contatos_access_enhanced();

-- Create a security view for safe contact display
CREATE OR REPLACE VIEW public.contatos_secure_view AS
SELECT 
  c.id,
  c.user_id,
  c.nome,
  c.nome_fantasia,
  -- Always show masked data in view
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
  -- Sensitive fields completely hidden in view
  '***PROTECTED***' as nome_mae_masked,
  NULL as limite_credito_masked,
  NULL as data_nascimento_masked
FROM public.contatos c
WHERE c.user_id = auth.uid() OR public.has_role('admin');

-- Grant appropriate permissions
GRANT SELECT ON public.contatos_secure_view TO authenticated;

-- Create contact data breach monitoring function
CREATE OR REPLACE FUNCTION public.monitor_contact_data_breach()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  bulk_access_count integer;
  rapid_access_count integer;
  unusual_hour_access integer;
  weekend_access_count integer;
BEGIN
  -- Check for bulk access in last hour
  SELECT COUNT(DISTINCT user_id) INTO bulk_access_count
  FROM public.security_audit_log
  WHERE event_type = 'sensitive_data_bulk_access'
    AND metadata->>'table_name' = 'contatos'
    AND created_at > now() - interval '1 hour';
  
  -- Check for rapid individual access
  SELECT COUNT(*) INTO rapid_access_count
  FROM public.security_audit_log
  WHERE event_type = 'contact_data_operation'
    AND created_at > now() - interval '5 minutes';
  
  -- Check for unusual hours access
  SELECT COUNT(*) INTO unusual_hour_access
  FROM public.security_audit_log
  WHERE event_type IN ('sensitive_data_bulk_access', 'contact_data_operation')
    AND metadata->>'table_name' = 'contatos'
    AND created_at > now() - interval '24 hours'
    AND (
      EXTRACT(hour FROM created_at) NOT BETWEEN 8 AND 18 OR
      EXTRACT(dow FROM created_at) IN (0, 6)
    );
  
  -- Alert on suspicious patterns
  IF bulk_access_count > 5 THEN
    PERFORM public.log_enhanced_security_event(
      'potential_contact_data_breach',
      format('Multiple users accessed contact data in bulk: %s users in last hour', bulk_access_count),
      'critical',
      jsonb_build_object(
        'alert_type', 'bulk_access_multiple_users',
        'affected_users', bulk_access_count,
        'recommendation', 'immediate_investigation_required'
      )
    );
  END IF;
  
  IF rapid_access_count > 50 THEN
    PERFORM public.log_enhanced_security_event(
      'rapid_contact_access_pattern',
      format('Rapid contact data access detected: %s operations in 5 minutes', rapid_access_count),
      'high',
      jsonb_build_object(
        'alert_type', 'rapid_access',
        'operation_count', rapid_access_count
      )
    );
  END IF;
  
  IF unusual_hour_access > 20 THEN
    PERFORM public.log_enhanced_security_event(
      'unusual_hours_contact_access',
      format('Unusual hours contact access: %s operations outside business hours', unusual_hour_access),
      'medium',
      jsonb_build_object(
        'alert_type', 'unusual_hours',
        'access_count', unusual_hour_access
      )
    );
  END IF;
END;
$$;