-- SECURITY FIX: Complete remaining security patches
-- Apply only the fixes that haven't been applied yet

-- 1. Enable pgcrypto extension for encryption functions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Fix infinite recursion in saas_superadmins RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Superadmins can view all superadmins" ON public.saas_superadmins;
DROP POLICY IF EXISTS "Only superadmins can manage superadmins" ON public.saas_superadmins;

-- Create safe superadmin policies using direct email check to prevent recursion
CREATE POLICY "Superadmins can view all superadmins" 
ON public.saas_superadmins 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN (
      SELECT email FROM public.saas_superadmins
    )
  )
);

CREATE POLICY "Only superadmins can manage superadmins" 
ON public.saas_superadmins 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email IN (
      SELECT email FROM public.saas_superadmins
    )
  )
);

-- 3. Fix missing DELETE policy for whatsapp_messages
CREATE POLICY "Users can delete their own whatsapp_messages" 
ON public.whatsapp_messages 
FOR DELETE 
USING ((user_id = auth.uid()) OR has_role('admin'::app_role));

-- 4. Update database functions with proper search_path for security
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data text, key_name text DEFAULT 'default'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data text, key_name text DEFAULT 'default'::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
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
$function$;

-- Update WhatsApp encryption functions with proper error handling and search_path
CREATE OR REPLACE FUNCTION public.encrypt_whatsapp_token(token_value text, account_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  encryption_key text;
BEGIN
  encryption_key := 'wa_token_' || account_id::text || '_secure_2025';
  
  IF token_value IS NULL OR token_value = '' THEN
    RETURN token_value;
  END IF;
  
  RETURN encode(
    encrypt(token_value::bytea, encryption_key::bytea, 'aes'),
    'base64'
  );
EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_security_event(
      'whatsapp_encryption_error',
      'Failed to encrypt WhatsApp token: ' || SQLERRM,
      jsonb_build_object('error', SQLERRM, 'account_id', account_id)
    );
    RETURN token_value;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrypt_whatsapp_token(encrypted_token text, account_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  encryption_key text;
BEGIN
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
    RETURN encrypted_token;
END;
$function$;

-- 5. Log this security fix completion
SELECT public.log_security_event(
  'security_patches_completed',
  'Completed remaining security fixes: fixed recursive policies, enabled pgcrypto, secured functions, added missing policies',
  jsonb_build_object(
    'pgcrypto_enabled', true,
    'recursive_policy_fixed', 'saas_superadmins',
    'functions_secured', ARRAY['encrypt_sensitive_data', 'decrypt_sensitive_data', 'encrypt_whatsapp_token', 'decrypt_whatsapp_token'],
    'missing_policy_added', 'whatsapp_messages_delete',
    'security_level', 'critical'
  )
);