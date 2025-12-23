-- Enhanced security fixes for customer personal information protection

-- 1. Create enhanced data masking function for contact viewing
CREATE OR REPLACE FUNCTION public.get_contact_secure_view(contact_id uuid)
RETURNS TABLE(
  id uuid, 
  nome text, 
  nome_fantasia text,
  cpf_cnpj text,
  email text,
  celular text,
  telefone text,
  endereco text,
  cidade text,
  estado text,
  observacoes text,
  ativo boolean,
  created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log the individual contact access
  PERFORM public.log_sensitive_data_access(
    'contatos',
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
    c.nome,
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
    c.endereco,
    c.cidade,
    c.estado,
    c.observacoes,
    c.ativo,
    c.created_at
  FROM public.contatos c
  WHERE c.id = contact_id 
    AND (c.user_id = auth.uid() OR public.has_role('admin'));
END;
$$;

-- 2. Enhanced suspicious activity detection
CREATE OR REPLACE FUNCTION public.detect_data_breach_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  bulk_exports integer;
  rapid_access integer;
  unusual_hours integer;
BEGIN
  -- Check for bulk data exports in last hour
  SELECT COUNT(*)
  INTO bulk_exports
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type = 'sensitive_data_access'
    AND metadata->>'access_type' = 'BULK_SELECT'
    AND created_at > now() - interval '1 hour';
  
  -- Check for rapid individual access
  SELECT COUNT(*)
  INTO rapid_access
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type = 'sensitive_data_access'
    AND created_at > now() - interval '10 minutes';
    
  -- Check for access during unusual hours (weekends, nights)
  SELECT COUNT(*)
  INTO unusual_hours
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type = 'sensitive_data_access'
    AND created_at > now() - interval '24 hours'
    AND (
      EXTRACT(dow FROM created_at) IN (0, 6) OR -- Weekend
      EXTRACT(hour FROM created_at) NOT BETWEEN 8 AND 18 -- Outside business hours
    );
  
  -- Log potential data breach patterns
  IF bulk_exports > 3 THEN
    PERFORM public.log_security_event(
      'potential_data_breach',
      format('Excessive bulk data exports: %s in last hour', bulk_exports),
      jsonb_build_object(
        'alert_level', 'critical',
        'bulk_exports', bulk_exports,
        'recommendation', 'Immediate account review required'
      )
    );
  END IF;
  
  IF rapid_access > 20 THEN
    PERFORM public.log_security_event(
      'suspicious_rapid_access',
      format('Rapid data access pattern: %s requests in 10 minutes', rapid_access),
      jsonb_build_object(
        'alert_level', 'high',
        'access_count', rapid_access
      )
    );
  END IF;
  
  IF unusual_hours > 10 THEN
    PERFORM public.log_security_event(
      'unusual_access_hours',
      format('Unusual access pattern: %s requests outside business hours', unusual_hours),
      jsonb_build_object(
        'alert_level', 'medium',
        'unusual_access_count', unusual_hours
      )
    );
  END IF;
END;
$$;

-- 3. Update the contacts access logging to include breach detection
CREATE OR REPLACE FUNCTION public.log_contatos_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to sensitive data
  PERFORM public.log_sensitive_data_access(
    'contatos',
    COALESCE(NEW.id, OLD.id),
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone', 'nome_mae', 'limite_credito'],
    TG_OP
  );
  
  -- Enhanced breach pattern detection
  PERFORM public.detect_data_breach_patterns();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4. Create function to validate secure contact operations
CREATE OR REPLACE FUNCTION public.validate_contact_operation(
  operation_type text,
  contact_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  validation_errors text[] := '{}';
BEGIN
  -- Validate operation permissions
  IF operation_type IN ('UPDATE', 'DELETE') AND NOT (
    public.has_role('admin') OR 
    (contact_data->>'user_id')::uuid = auth.uid()
  ) THEN
    validation_errors := array_append(validation_errors, 'Acesso não autorizado ao contato');
  END IF;
  
  -- Validate sensitive data patterns if provided
  IF contact_data IS NOT NULL THEN
    -- Check CPF/CNPJ format
    IF contact_data->>'cpf_cnpj' IS NOT NULL THEN
      IF length(regexp_replace(contact_data->>'cpf_cnpj', '[^0-9]', '', 'g')) NOT IN (11, 14) THEN
        validation_errors := array_append(validation_errors, 'CPF/CNPJ deve ter 11 ou 14 dígitos');
      END IF;
    END IF;
    
    -- Check email format
    IF contact_data->>'email' IS NOT NULL THEN
      IF contact_data->>'email' !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        validation_errors := array_append(validation_errors, 'Formato de email inválido');
      END IF;
    END IF;
  END IF;
  
  result := jsonb_build_object(
    'valid', array_length(validation_errors, 1) IS NULL,
    'errors', to_jsonb(validation_errors),
    'timestamp', extract(epoch from now())
  );
  
  -- Log validation attempt
  PERFORM public.log_security_event(
    'contact_validation',
    format('Contact operation validation: %s', operation_type),
    jsonb_build_object(
      'operation', operation_type,
      'valid', result->'valid',
      'error_count', coalesce(array_length(validation_errors, 1), 0)
    )
  );
  
  RETURN result;
END;
$$;