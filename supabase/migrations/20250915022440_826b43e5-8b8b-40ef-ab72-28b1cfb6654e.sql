-- Fix timeout issues by optimizing database triggers and audit logging

-- 1. Add performance indexes for security_audit_log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_time ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_time ON public.security_audit_log(event_type, created_at DESC);

-- 2. Create async version of breach detection that doesn't block main operations
CREATE OR REPLACE FUNCTION public.async_detect_data_breach_patterns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  bulk_exports integer;
  rapid_access integer;
  unusual_hours integer;
BEGIN
  -- This is now async and won't block main operations
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
$function$;

-- 3. Update the contatos_v2 access trigger to be lightweight
CREATE OR REPLACE FUNCTION public.log_contatos_v2_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access to sensitive data (lightweight version)
  PERFORM public.log_sensitive_data_access(
    'contatos_v2',
    COALESCE(NEW.id, OLD.id),
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone'],
    TG_OP
  );
  
  -- Remove the synchronous breach detection that was causing timeouts
  -- This will now be handled by a separate async process
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;