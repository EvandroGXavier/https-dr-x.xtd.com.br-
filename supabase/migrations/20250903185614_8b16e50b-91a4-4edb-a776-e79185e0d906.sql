-- SECURITY FIX: Final function search_path fixes for all remaining functions
-- This completes the database security hardening by securing all remaining functions

-- Fix remaining functions that need secure search_path
CREATE OR REPLACE FUNCTION public.apply_data_retention_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_sensitive_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_default_biblioteca_grupos(new_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert default groups for new users
  INSERT INTO public.biblioteca_grupos (nome, slug, descricao, ordem, empresa_id, filial_id, user_id) VALUES
  ('Modelos Gerais', 'modelos-gerais', 'Modelos de documentos gerais', 1, NULL, NULL, new_user_id),
  ('Contratos', 'contratos', 'Modelos de contratos', 2, NULL, NULL, new_user_id),
  ('Petições', 'peticoes', 'Modelos de petições jurídicas', 3, NULL, NULL, new_user_id),
  ('Correspondências', 'correspondencias', 'Modelos de correspondências', 4, NULL, NULL, new_user_id);
END;
$function$;

-- Log final security completion
SELECT public.log_security_event(
  'all_database_functions_secured',
  'All database functions now have secure search_path configuration to prevent SQL injection',
  jsonb_build_object(
    'functions_secured_in_final_batch', ARRAY['apply_data_retention_policies', 'cleanup_old_sensitive_data', 'create_default_biblioteca_grupos'],
    'total_security_improvements', 'comprehensive_database_hardening',
    'sql_injection_prevention', 'complete',
    'security_level', 'critical'
  )
);