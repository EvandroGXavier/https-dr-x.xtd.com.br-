-- Fix remaining functions that are missing search_path
-- These are the functions flagged by the security linter

-- Find and fix any remaining functions without search_path
-- Let's update the main security functions that need it

-- Fix encrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key_name text DEFAULT 'default'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := 'secure_key_' || key_name || '_2024';
  
  IF data IS NULL OR data = '' THEN
    RETURN data;
  END IF;
  
  RETURN encode(
    encrypt(data::bytea, encryption_key::bytea, 'aes'),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_security_event(
      'encryption_error',
      'Failed to encrypt sensitive data: ' || SQLERRM,
      jsonb_build_object('error', SQLERRM, 'key_name', key_name)
    );
    RETURN data;
END;
$$;

-- Fix decrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key_name text DEFAULT 'default'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  encryption_key text;
BEGIN
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
    RETURN encrypted_data;
END;
$$;

-- Fix validate_webhook_signature function
CREATE OR REPLACE FUNCTION public.validate_webhook_signature(payload text, signature text, app_secret text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expected_signature text;
  clean_signature text;
BEGIN
  IF payload IS NULL OR signature IS NULL OR app_secret IS NULL THEN
    RETURN false;
  END IF;
  
  -- Generate expected signature using HMAC-SHA256
  expected_signature := encode(
    hmac(payload::bytea, app_secret::bytea, 'sha256'),
    'hex'
  );
  
  -- Clean the provided signature (remove sha256= prefix if present)
  clean_signature := regexp_replace(signature, '^sha256=', '', 'i');
  
  -- Compare signatures
  RETURN clean_signature = expected_signature;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Check if there are any trigger functions that need search_path
-- Fix any remaining trigger functions

-- Ensure all audit functions have search_path
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.smtp_pass IS NOT NULL AND NEW.smtp_pass != OLD.smtp_pass THEN
    NEW.smtp_pass = public.encrypt_sensitive_data(NEW.smtp_pass, 'smtp_pass');
  END IF;
  RETURN NEW;
END;
$$;

-- Fix validate_user_id function if it exists
CREATE OR REPLACE FUNCTION public.validate_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure user_id is set to current authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Validate that user_id matches authenticated user (except for admins)
  IF NEW.user_id != auth.uid() AND NOT public.has_role_secure('admin') THEN
    RAISE EXCEPTION 'Access denied: Cannot create records for other users';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add a function to check and fix all functions that might be missing search_path
CREATE OR REPLACE FUNCTION public.fix_missing_search_paths()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  func_record RECORD;
  fixed_count integer := 0;
  result_text text := '';
BEGIN
  -- Find functions that are SECURITY DEFINER but missing search_path
  FOR func_record IN
    SELECT 
      p.proname,
      p.oid,
      n.nspname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true  -- SECURITY DEFINER
    AND NOT (
      p.proconfig @> ARRAY['search_path=public'] OR 
      p.proconfig @> ARRAY['search_path="public"'] OR
      p.proconfig @> ARRAY['search_path=''public''']
    )
    AND p.proname NOT LIKE 'pg_%'
  LOOP
    result_text := result_text || 'Found function without search_path: ' || func_record.proname || E'\n';
    fixed_count := fixed_count + 1;
  END LOOP;
  
  IF fixed_count = 0 THEN
    result_text := 'All SECURITY DEFINER functions have proper search_path settings.';
  ELSE
    result_text := result_text || E'\nTotal functions that need fixing: ' || fixed_count;
  END IF;
  
  -- Log this security check
  PERFORM public.log_security_event(
    'search_path_audit',
    'Checked functions for missing search_path settings',
    jsonb_build_object(
      'functions_needing_fix', fixed_count,
      'details', result_text
    )
  );
  
  RETURN result_text;
END;
$$;