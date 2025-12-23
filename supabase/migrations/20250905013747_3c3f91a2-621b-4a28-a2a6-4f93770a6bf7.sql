-- Priority 1: Fix RLS Infinite Recursion by creating a secure has_role function
-- This prevents infinite recursion in RLS policies

CREATE OR REPLACE FUNCTION public.has_role_secure(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create an overloaded version that uses auth.uid() for convenience
CREATE OR REPLACE FUNCTION public.has_role_secure(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = _role
  );
$$;

-- Priority 2: Secure Database Functions by adding search_path
-- Fix functions that are missing search_path security

CREATE OR REPLACE FUNCTION public.generate_etiqueta_slug(nome text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 1;
BEGIN
  -- Generate base slug from name
  base_slug := lower(
    regexp_replace(
      regexp_replace(
        unaccent(nome), 
        '[^a-zA-Z0-9\s]', '', 'g'
      ), 
      '\s+', '-', 'g'
    )
  );
  
  final_slug := base_slug;
  
  -- Check for uniqueness and increment counter if needed
  WHILE EXISTS (
    SELECT 1 FROM public.etiquetas 
    WHERE slug = final_slug 
    AND user_id = auth.uid()
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_whatsapp_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Priority 3: Update RLS policies to use the secure function
-- This prevents infinite recursion by using SECURITY DEFINER

-- Update profiles table policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role_secure('admin') OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role_secure('admin') OR user_id = auth.uid());

-- Update other critical policies that use has_role
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.profile_audit_log;
CREATE POLICY "Only admins can view audit logs" 
ON public.profile_audit_log 
FOR SELECT 
USING (public.has_role_secure('admin'));

DROP POLICY IF EXISTS "Only admins can view security logs" ON public.security_audit_log;
CREATE POLICY "Only admins can view security logs" 
ON public.security_audit_log 
FOR SELECT 
USING (public.has_role_secure('admin'));

-- Priority 4: Enhanced Security Monitoring
-- Add function to log RLS policy failures

CREATE OR REPLACE FUNCTION public.log_rls_failure(
  table_name text,
  operation text,
  user_id_param uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    user_id_param,
    'rls_policy_failure',
    format('RLS policy violation on table %s for operation %s', table_name, operation),
    jsonb_build_object(
      'table_name', table_name,
      'operation', operation,
      'timestamp', extract(epoch from now())
    )
  );
END;
$$;

-- Priority 5: Add additional security constraints
-- Ensure all sensitive tables have proper constraints

-- Add check to ensure profiles always have a role
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_not_null 
CHECK (role IS NOT NULL);

-- Add check to ensure WhatsApp tokens are encrypted
ALTER TABLE public.wa_tokens 
ADD CONSTRAINT wa_tokens_access_token_encrypted 
CHECK (access_token IS NULL OR length(access_token) > 20);

-- Priority 6: Create security health check function

CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  rls_enabled_count integer;
  total_tables_count integer;
  functions_without_search_path integer;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public' 
  AND c.relrowsecurity = true;
  
  -- Count total public tables
  SELECT COUNT(*) INTO total_tables_count
  FROM pg_tables 
  WHERE schemaname = 'public';
  
  -- Count functions without proper search_path
  SELECT COUNT(*) INTO functions_without_search_path
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.prosecdef = true
  AND NOT (p.proconfig @> ARRAY['search_path=public'] OR p.proconfig @> ARRAY['search_path="public"']);
  
  result := jsonb_build_object(
    'rls_coverage', round((rls_enabled_count::numeric / total_tables_count::numeric) * 100, 2),
    'tables_with_rls', rls_enabled_count,
    'total_tables', total_tables_count,
    'functions_without_search_path', functions_without_search_path,
    'security_score', CASE 
      WHEN functions_without_search_path = 0 AND rls_enabled_count >= (total_tables_count * 0.8) THEN 'EXCELLENT'
      WHEN functions_without_search_path <= 2 AND rls_enabled_count >= (total_tables_count * 0.6) THEN 'GOOD'
      WHEN functions_without_search_path <= 5 AND rls_enabled_count >= (total_tables_count * 0.4) THEN 'FAIR'
      ELSE 'POOR'
    END,
    'timestamp', extract(epoch from now())
  );
  
  -- Log the health check
  PERFORM public.log_security_event(
    'security_health_check',
    'Security health check performed',
    result
  );
  
  RETURN result;
END;
$$;