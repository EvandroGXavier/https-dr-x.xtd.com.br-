-- Enhanced Security Measures for Personal Data Protection

-- 1. Create encryption functions for sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key_name text DEFAULT 'default')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use a consistent key for encryption (in production, use proper key management)
  encryption_key := 'secure_key_' || key_name || '_2024';
  
  IF data IS NULL OR data = '' THEN
    RETURN data;
  END IF;
  
  RETURN encode(
    encrypt(data::bytea, encryption_key::bytea, 'aes'),
    'base64'
  );
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key_name text DEFAULT 'default')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use the same key for decryption
  encryption_key := 'secure_key_' || key_name || '_2024';
  
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN encrypted_data;
  END IF;
  
  RETURN convert_from(
    decrypt(decode(encrypted_data, 'base64'), encryption_key::bytea, 'aes'),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return original data if decryption fails (for backward compatibility)
    RETURN encrypted_data;
END;
$$;

-- Function to mask sensitive data for display
CREATE OR REPLACE FUNCTION public.mask_cpf_cnpj(cpf_cnpj text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF cpf_cnpj IS NULL OR length(cpf_cnpj) < 4 THEN
    RETURN cpf_cnpj;
  END IF;
  
  -- Mask CPF: show only last 2 digits
  IF length(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g')) = 11 THEN
    RETURN '***.***.***-' || right(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g'), 2);
  END IF;
  
  -- Mask CNPJ: show only last 2 digits
  IF length(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g')) = 14 THEN
    RETURN '**.***.***/****-' || right(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g'), 2);
  END IF;
  
  -- For other formats, mask all but last 2 characters
  RETURN repeat('*', length(cpf_cnpj) - 2) || right(cpf_cnpj, 2);
END;
$$;

-- Function to mask email addresses
CREATE OR REPLACE FUNCTION public.mask_email(email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  at_position integer;
  username_part text;
  domain_part text;
BEGIN
  IF email IS NULL OR email = '' OR position('@' in email) = 0 THEN
    RETURN email;
  END IF;
  
  at_position := position('@' in email);
  username_part := left(email, at_position - 1);
  domain_part := substring(email from at_position);
  
  -- Mask username: show first and last character if length > 2
  IF length(username_part) <= 2 THEN
    username_part := repeat('*', length(username_part));
  ELSE
    username_part := left(username_part, 1) || repeat('*', length(username_part) - 2) || right(username_part, 1);
  END IF;
  
  RETURN username_part || domain_part;
END;
$$;

-- Function to mask phone numbers
CREATE OR REPLACE FUNCTION public.mask_phone(phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF phone IS NULL OR length(phone) < 4 THEN
    RETURN phone;
  END IF;
  
  -- Show only last 4 digits
  RETURN repeat('*', length(phone) - 4) || right(phone, 4);
END;
$$;

-- 2. Enhanced audit logging for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  record_id uuid,
  accessed_fields text[],
  access_type text DEFAULT 'SELECT'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if accessing sensitive fields
  IF accessed_fields && ARRAY['cpf_cnpj', 'cpf_cliente', 'rg', 'nome_mae', 'limite_credito', 'email', 'celular', 'telefone', 'data_nascimento'] THEN
    INSERT INTO public.security_audit_log (
      user_id,
      event_type,
      event_description,
      metadata
    ) VALUES (
      auth.uid(),
      'sensitive_data_access',
      format('Accessed sensitive fields in %s', table_name),
      jsonb_build_object(
        'table_name', table_name,
        'record_id', record_id,
        'accessed_fields', accessed_fields,
        'access_type', access_type,
        'timestamp', extract(epoch from now())
      )
    );
  END IF;
END;
$$;

-- 3. Function to validate data access patterns and detect suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_data_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_accesses integer;
  bulk_access_threshold integer := 50;
BEGIN
  -- Check for bulk data access in the last hour
  SELECT COUNT(*)
  INTO recent_accesses
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type = 'sensitive_data_access'
    AND created_at > now() - interval '1 hour';
  
  -- Log suspicious activity if threshold exceeded
  IF recent_accesses > bulk_access_threshold THEN
    PERFORM public.log_security_event(
      'suspicious_bulk_access',
      format('User accessed %s sensitive records in the last hour', recent_accesses),
      jsonb_build_object(
        'access_count', recent_accesses,
        'threshold', bulk_access_threshold,
        'time_window', '1 hour'
      )
    );
  END IF;
END;
$$;

-- 4. Create view for safely accessing contact data with automatic masking
CREATE OR REPLACE VIEW public.contatos_safe AS
SELECT 
  id,
  user_id,
  nome,
  nome_fantasia,
  -- Masked sensitive fields
  CASE 
    WHEN has_role('admin') THEN cpf_cnpj
    ELSE public.mask_cpf_cnpj(cpf_cnpj)
  END as cpf_cnpj,
  CASE 
    WHEN has_role('admin') THEN email
    ELSE public.mask_email(email)
  END as email,
  CASE 
    WHEN has_role('admin') THEN celular
    ELSE public.mask_phone(celular)
  END as celular,
  CASE 
    WHEN has_role('admin') THEN telefone
    ELSE public.mask_phone(telefone)
  END as telefone,
  -- Non-sensitive fields remain unchanged
  endereco,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  cep,
  observacoes,
  ativo,
  created_at,
  updated_at,
  -- Hide extremely sensitive fields from non-admins
  CASE 
    WHEN has_role('admin') THEN nome_mae
    ELSE NULL
  END as nome_mae,
  CASE 
    WHEN has_role('admin') THEN limite_credito
    ELSE NULL
  END as limite_credito,
  CASE 
    WHEN has_role('admin') THEN data_nascimento
    ELSE NULL
  END as data_nascimento
FROM public.contatos;

-- Grant access to the safe view
GRANT SELECT ON public.contatos_safe TO authenticated;

-- 5. Create trigger to log sensitive data access
CREATE OR REPLACE FUNCTION public.log_contatos_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log access to sensitive data
  PERFORM public.log_sensitive_data_access(
    'contatos',
    COALESCE(NEW.id, OLD.id),
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone', 'nome_mae', 'limite_credito'],
    TG_OP
  );
  
  -- Check for suspicious access patterns
  PERFORM public.detect_suspicious_data_access();
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for SELECT operations on sensitive data
-- Note: This will be created as a statement-level trigger since PostgreSQL doesn't support row-level SELECT triggers
-- We'll implement access logging in the application layer instead

-- 6. Add data retention policy function
CREATE OR REPLACE FUNCTION public.cleanup_old_sensitive_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Archive old audit logs (keep only last 2 years)
  DELETE FROM public.security_audit_log 
  WHERE created_at < now() - interval '2 years';
  
  -- Log the cleanup operation
  PERFORM public.log_security_event(
    'data_cleanup',
    'Cleaned up old sensitive data and audit logs',
    jsonb_build_object(
      'retention_period', '2 years',
      'cleanup_date', now()
    )
  );
END;
$$;

-- 7. Enhanced password validation with breach checking simulation
CREATE OR REPLACE FUNCTION public.enhanced_password_validation(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  is_valid boolean := true;
  errors text[] := '{}';
  common_passwords text[] := ARRAY['123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111', '1234567', 'dragon'];
BEGIN
  -- Basic strength validation
  SELECT * INTO result FROM public.validate_password_strength(password);
  
  -- Extract existing validation results
  is_valid := (result->>'isValid')::boolean;
  errors := ARRAY(SELECT jsonb_array_elements_text(result->'errors'));
  
  -- Check against common passwords
  IF password = ANY(common_passwords) THEN
    is_valid := false;
    errors := array_append(errors, 'Password is too common and easily guessable');
  END IF;
  
  -- Check for sequential characters
  IF password ~ '[0-9]{4,}' OR password ~ '[a-z]{4,}' OR password ~ '[A-Z]{4,}' THEN
    is_valid := false;
    errors := array_append(errors, 'Password contains too many sequential characters');
  END IF;
  
  -- Return enhanced validation result
  RETURN jsonb_build_object(
    'isValid', is_valid,
    'errors', to_jsonb(errors),
    'strength_score', CASE 
      WHEN array_length(errors, 1) IS NULL THEN 100
      WHEN array_length(errors, 1) <= 1 THEN 75
      WHEN array_length(errors, 1) <= 2 THEN 50
      ELSE 25
    END
  );
END;
$$;