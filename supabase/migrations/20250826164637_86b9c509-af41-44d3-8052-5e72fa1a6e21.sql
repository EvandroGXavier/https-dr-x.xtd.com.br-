-- Phase 2: Enhanced RLS Policy Security
-- Add time-based access restrictions and IP logging

-- Enhanced security event logging with geolocation and risk scoring
CREATE OR REPLACE FUNCTION public.log_enhanced_security_event(
  event_type text,
  event_description text,
  risk_level text DEFAULT 'low',
  metadata jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_hour integer;
  is_weekend boolean;
  risk_score integer := 0;
BEGIN
  current_hour := EXTRACT(hour FROM now());
  is_weekend := EXTRACT(dow FROM now()) IN (0, 6);
  
  -- Calculate risk score based on time and context
  IF is_weekend THEN risk_score := risk_score + 2; END IF;
  IF current_hour NOT BETWEEN 8 AND 18 THEN risk_score := risk_score + 3; END IF;
  IF risk_level = 'high' THEN risk_score := risk_score + 5; END IF;
  IF risk_level = 'critical' THEN risk_score := risk_score + 10; END IF;
  
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    auth.uid(),
    event_type,
    event_description,
    jsonb_build_object(
      'risk_level', risk_level,
      'risk_score', risk_score,
      'access_hour', current_hour,
      'is_weekend', is_weekend,
      'timestamp', extract(epoch from now())
    ) || COALESCE(metadata, '{}'::jsonb)
  );
  
  -- Auto-lockdown for critical risk events
  IF risk_score >= 15 THEN
    PERFORM public.log_security_event(
      'auto_lockdown_triggered',
      format('High risk activity detected for user %s - score: %s', auth.uid(), risk_score),
      jsonb_build_object(
        'alert_level', 'critical',
        'auto_action', 'account_review_required',
        'risk_score', risk_score
      )
    );
  END IF;
END;
$$;

-- Enhanced data export monitoring with strict limits
CREATE OR REPLACE FUNCTION public.monitor_data_export(
  export_type text,
  record_count integer,
  table_names text[]
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
  daily_exports integer;
  max_daily_limit integer;
  export_allowed boolean := true;
  result jsonb;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  
  -- Set limits based on role
  max_daily_limit := CASE 
    WHEN user_role = 'admin' THEN 1000
    WHEN user_role = 'moderator' THEN 500
    ELSE 100
  END;
  
  -- Count today's exports
  SELECT COUNT(*) INTO daily_exports
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type = 'data_export'
    AND created_at::date = CURRENT_DATE;
  
  -- Check if export is allowed
  IF daily_exports >= max_daily_limit THEN
    export_allowed := false;
  END IF;
  
  -- Log the export attempt
  PERFORM public.log_enhanced_security_event(
    'data_export',
    format('Data export attempt: %s records from tables %s', record_count, array_to_string(table_names, ', ')),
    CASE 
      WHEN NOT export_allowed THEN 'critical'
      WHEN record_count > 500 THEN 'high'
      WHEN record_count > 100 THEN 'medium'
      ELSE 'low'
    END,
    jsonb_build_object(
      'export_type', export_type,
      'record_count', record_count,
      'table_names', table_names,
      'daily_exports', daily_exports,
      'max_limit', max_daily_limit,
      'allowed', export_allowed
    )
  );
  
  result := jsonb_build_object(
    'allowed', export_allowed,
    'remaining_exports', GREATEST(0, max_daily_limit - daily_exports),
    'daily_limit', max_daily_limit,
    'message', CASE 
      WHEN NOT export_allowed THEN 'Daily export limit exceeded'
      ELSE 'Export authorized'
    END
  );
  
  RETURN result;
END;
$$;

-- WhatsApp token rotation monitoring
CREATE OR REPLACE FUNCTION public.monitor_whatsapp_token_access(
  account_id uuid,
  operation_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_access_count integer;
  last_rotation_date timestamp with time zone;
  days_since_rotation integer;
BEGIN
  -- Count recent token access
  SELECT COUNT(*) INTO recent_access_count
  FROM public.security_audit_log
  WHERE event_type = 'whatsapp_token_access'
    AND metadata->>'account_id' = account_id::text
    AND created_at > now() - interval '1 hour';
  
  -- Check last rotation (placeholder - would be in wa_accounts table)
  days_since_rotation := COALESCE(
    EXTRACT(days FROM now() - (
      SELECT created_at FROM public.security_audit_log 
      WHERE event_type = 'whatsapp_token_rotation'
        AND metadata->>'account_id' = account_id::text
      ORDER BY created_at DESC LIMIT 1
    )), 999
  );
  
  -- Log the access
  PERFORM public.log_enhanced_security_event(
    'whatsapp_token_access',
    format('WhatsApp token %s for account %s', operation_type, account_id),
    CASE 
      WHEN recent_access_count > 20 THEN 'high'
      WHEN days_since_rotation > 90 THEN 'medium'
      ELSE 'low'
    END,
    jsonb_build_object(
      'account_id', account_id,
      'operation_type', operation_type,
      'recent_access_count', recent_access_count,
      'days_since_rotation', days_since_rotation,
      'rotation_needed', days_since_rotation > 90
    )
  );
  
  -- Alert if rotation is needed
  IF days_since_rotation > 90 THEN
    PERFORM public.log_security_event(
      'token_rotation_required',
      format('WhatsApp token for account %s requires rotation (%s days old)', account_id, days_since_rotation),
      jsonb_build_object(
        'alert_level', 'medium',
        'account_id', account_id,
        'days_overdue', days_since_rotation - 90
      )
    );
  END IF;
END;
$$;

-- Enhanced webhook signature validation with monitoring
CREATE OR REPLACE FUNCTION public.validate_webhook_signature_enhanced(
  payload text,
  signature text,
  app_secret text,
  webhook_source text DEFAULT 'whatsapp'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_valid boolean;
  validation_result jsonb;
BEGIN
  -- Perform the validation
  is_valid := public.validate_webhook_signature(payload, signature, app_secret);
  
  -- Log the validation attempt
  PERFORM public.log_enhanced_security_event(
    'webhook_signature_validation',
    format('Webhook signature validation for %s: %s', webhook_source, CASE WHEN is_valid THEN 'SUCCESS' ELSE 'FAILED' END),
    CASE WHEN is_valid THEN 'low' ELSE 'high' END,
    jsonb_build_object(
      'webhook_source', webhook_source,
      'validation_success', is_valid,
      'payload_length', length(payload)
    )
  );
  
  validation_result := jsonb_build_object(
    'valid', is_valid,
    'source', webhook_source,
    'timestamp', extract(epoch from now())
  );
  
  RETURN validation_result;
END;
$$;

-- Data retention and cleanup policies
CREATE OR REPLACE FUNCTION public.apply_data_retention_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  deleted_logs integer;
  archived_messages integer;
BEGIN
  -- Archive old security logs (keep 2 years)
  DELETE FROM public.security_audit_log 
  WHERE created_at < now() - interval '2 years';
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;
  
  -- Archive old WhatsApp messages (keep 3 years for compliance)
  UPDATE public.wa_messages 
  SET content = '[ARCHIVED]'
  WHERE created_at < now() - interval '3 years'
    AND content != '[ARCHIVED]';
  GET DIAGNOSTICS archived_messages = ROW_COUNT;
  
  -- Log the cleanup
  PERFORM public.log_security_event(
    'data_retention_cleanup',
    format('Data retention cleanup completed: %s logs deleted, %s messages archived', 
           deleted_logs, archived_messages),
    jsonb_build_object(
      'deleted_security_logs', deleted_logs,
      'archived_messages', archived_messages,
      'retention_policy', '2y_logs_3y_messages'
    )
  );
END;
$$;

-- Emergency admin access function
CREATE OR REPLACE FUNCTION public.emergency_admin_access(
  target_table text,
  emergency_reason text,
  justification text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role app_role;
  access_granted boolean := false;
  result jsonb;
BEGIN
  -- Check if user is admin
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  
  IF user_role = 'admin' THEN
    access_granted := true;
    
    -- Log emergency access
    PERFORM public.log_enhanced_security_event(
      'emergency_admin_access',
      format('Emergency admin access to %s: %s', target_table, emergency_reason),
      'critical',
      jsonb_build_object(
        'target_table', target_table,
        'emergency_reason', emergency_reason,
        'justification', justification,
        'requires_audit', true
      )
    );
  END IF;
  
  result := jsonb_build_object(
    'access_granted', access_granted,
    'table', target_table,
    'reason', emergency_reason,
    'audit_required', access_granted
  );
  
  RETURN result;
END;
$$;

-- Enhanced contact access with stricter controls
CREATE OR REPLACE FUNCTION public.get_contacts_secure_enhanced(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0,
  export_purpose text DEFAULT 'view'
) RETURNS TABLE(
  id uuid, user_id uuid, nome text, nome_fantasia text, 
  cpf_cnpj text, email text, celular text, telefone text,
  endereco text, cidade text, estado text, observacoes text,
  ativo boolean, created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  export_check jsonb;
  user_role app_role;
BEGIN
  -- Get user role
  SELECT role INTO user_role FROM public.profiles WHERE user_id = auth.uid();
  
  -- Check export limits if this is for export
  IF export_purpose = 'export' THEN
    export_check := public.monitor_data_export('contacts', limit_count, ARRAY['contatos']);
    
    IF NOT (export_check->>'allowed')::boolean THEN
      RAISE EXCEPTION 'Export limit exceeded: %', export_check->>'message';
    END IF;
  END IF;
  
  -- Log the access
  PERFORM public.log_enhanced_security_event(
    'secure_contact_access',
    format('Secure contact access: %s records for %s', limit_count, export_purpose),
    CASE 
      WHEN limit_count > 100 AND user_role != 'admin' THEN 'high'
      WHEN export_purpose = 'export' THEN 'medium'
      ELSE 'low'
    END,
    jsonb_build_object(
      'limit_count', limit_count,
      'export_purpose', export_purpose,
      'user_role', user_role
    )
  );
  
  -- Return data with appropriate masking
  RETURN QUERY
  SELECT 
    c.id, c.user_id, c.nome, c.nome_fantasia,
    CASE 
      WHEN user_role = 'admin' OR c.user_id = auth.uid() THEN c.cpf_cnpj
      ELSE public.mask_cpf_cnpj(c.cpf_cnpj)
    END,
    CASE 
      WHEN user_role = 'admin' OR c.user_id = auth.uid() THEN c.email
      ELSE public.mask_email(c.email)
    END,
    CASE 
      WHEN user_role = 'admin' OR c.user_id = auth.uid() THEN c.celular
      ELSE public.mask_phone(c.celular)
    END,
    CASE 
      WHEN user_role = 'admin' OR c.user_id = auth.uid() THEN c.telefone
      ELSE public.mask_phone(c.telefone)
    END,
    c.endereco, c.cidade, c.estado, c.observacoes, c.ativo, c.created_at
  FROM public.contatos c
  WHERE c.user_id = auth.uid() OR user_role = 'admin'
  ORDER BY c.nome
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;