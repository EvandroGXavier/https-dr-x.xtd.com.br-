-- Add encryption/decryption functions for secure token storage
CREATE OR REPLACE FUNCTION encrypt_whatsapp_token(token_value text, account_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use account-specific encryption key
  encryption_key := 'wa_token_' || account_id::text || '_secure_2025';
  
  IF token_value IS NULL OR token_value = '' THEN
    RETURN token_value;
  END IF;
  
  RETURN encode(
    encrypt(token_value::bytea, encryption_key::bytea, 'aes'),
    'base64'
  );
END;
$$;

CREATE OR REPLACE FUNCTION decrypt_whatsapp_token(encrypted_token text, account_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  -- Use account-specific encryption key
  encryption_key := 'wa_token_' || account_id::text || '_secure_2025';
  
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN encrypted_token;
  END IF;
  
  RETURN convert_from(
    decrypt(decode(encrypted_token, 'base64'), encryption_key::bytea, 'aes'),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return original data if decryption fails (for backward compatibility)
    RETURN encrypted_token;
END;
$$;

-- Add signature validation function
CREATE OR REPLACE FUNCTION validate_webhook_signature(payload text, signature text, app_secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expected_signature text;
BEGIN
  IF signature IS NULL OR app_secret IS NULL OR payload IS NULL THEN
    RETURN false;
  END IF;
  
  -- Remove 'sha256=' prefix if present
  signature := replace(signature, 'sha256=', '');
  
  -- Calculate expected signature using HMAC-SHA256
  expected_signature := encode(
    hmac(payload::bytea, app_secret::bytea, 'sha256'),
    'hex'
  );
  
  -- Use timing-safe comparison
  RETURN expected_signature = signature;
END;
$$;

-- Add role validation function for JWT tokens
CREATE OR REPLACE FUNCTION validate_jwt_role(jwt_user_id uuid, required_role app_role DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile RECORD;
  result jsonb;
BEGIN
  -- Get user profile with role
  SELECT * INTO user_profile 
  FROM public.profiles 
  WHERE user_id = jwt_user_id;
  
  IF user_profile IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'User profile not found'
    );
  END IF;
  
  -- Check required role if specified
  IF required_role IS NOT NULL AND user_profile.role != required_role AND user_profile.role != 'admin' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Insufficient permissions',
      'user_role', user_profile.role,
      'required_role', required_role
    );
  END IF;
  
  -- Log security validation
  PERFORM public.log_security_event(
    'jwt_role_validation',
    format('JWT role validation for user %s', jwt_user_id),
    jsonb_build_object(
      'user_role', user_profile.role,
      'required_role', required_role,
      'validation_result', 'success'
    )
  );
  
  RETURN jsonb_build_object(
    'valid', true,
    'user_role', user_profile.role,
    'user_id', jwt_user_id
  );
END;
$$;

-- Add bulk access monitoring enhancement
CREATE OR REPLACE FUNCTION monitor_bulk_access(user_id_param uuid, operation_type text, record_count integer DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_operations integer;
  rate_limit_threshold integer := 100; -- Max 100 operations per hour
  alert_threshold integer := 50; -- Alert at 50 operations per hour
BEGIN
  -- Count recent operations in the last hour
  SELECT COUNT(*)
  INTO recent_operations
  FROM public.security_audit_log
  WHERE user_id = user_id_param
    AND event_type = 'bulk_operation_monitor'
    AND created_at > now() - interval '1 hour';
  
  -- Log the current operation
  PERFORM public.log_security_event(
    'bulk_operation_monitor',
    format('Bulk operation: %s (%s records)', operation_type, record_count),
    jsonb_build_object(
      'operation_type', operation_type,
      'record_count', record_count,
      'recent_operations_count', recent_operations,
      'rate_limit_threshold', rate_limit_threshold
    )
  );
  
  -- Check for rate limiting
  IF recent_operations >= rate_limit_threshold THEN
    PERFORM public.log_security_event(
      'rate_limit_exceeded',
      format('User %s exceeded rate limit: %s operations in last hour', user_id_param, recent_operations),
      jsonb_build_object(
        'alert_level', 'critical',
        'user_id', user_id_param,
        'operations_count', recent_operations,
        'threshold', rate_limit_threshold
      )
    );
    
    RAISE EXCEPTION 'Rate limit exceeded. Too many operations in the last hour.';
  END IF;
  
  -- Alert for suspicious activity
  IF recent_operations >= alert_threshold THEN
    PERFORM public.log_security_event(
      'suspicious_bulk_activity',
      format('High bulk activity detected: %s operations in last hour', recent_operations),
      jsonb_build_object(
        'alert_level', 'high',
        'user_id', user_id_param,
        'operations_count', recent_operations,
        'threshold', alert_threshold
      )
    );
  END IF;
END;
$$;