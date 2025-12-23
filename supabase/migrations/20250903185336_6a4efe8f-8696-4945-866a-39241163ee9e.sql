-- SECURITY FIX: Add missing search_path to remaining database functions
-- This prevents SQL injection attacks through function search path manipulation

-- Fix remaining functions that need secure search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.saas_superadmins 
    WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT auth.uid(); -- Por enquanto retorna user_id, depois implementar tenant_id
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nome, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'name', 'Usuário'),
    NEW.email,
    'user'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_etiqueta_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
  NEW.slug = lower(
    regexp_replace(
      NEW.nome,
      '[^a-zA-Z0-9]',
      '',
      'g'
    )
  );
  RETURN NEW;
END;
$function$;

-- Log this security completion
SELECT public.log_security_event(
  'function_search_path_secured',
  'Added secure search_path to all remaining database functions to prevent SQL injection',
  jsonb_build_object(
    'functions_secured', ARRAY['get_current_user_role', 'is_superadmin', 'get_user_tenant_id', 'has_role', 'handle_new_user', 'generate_etiqueta_slug'],
    'security_improvement', 'sql_injection_prevention',
    'security_level', 'high'
  )
);