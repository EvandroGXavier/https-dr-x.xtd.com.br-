-- SECURITY FIX: Complete function search_path fixes for remaining functions
-- Fix all remaining functions that don't have secure search_path set

-- Fix the remaining functions from the query results
CREATE OR REPLACE FUNCTION public.change_user_role(target_user_id uuid, new_role app_role, reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  current_user_role app_role;
  old_role app_role;
BEGIN
  -- Check if current user is admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change user roles';
  END IF;
  
  -- Get current role for audit
  SELECT role INTO old_role 
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF old_role IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Prevent self-demotion from admin role
  IF target_user_id = auth.uid() AND current_user_role = 'admin' AND new_role != 'admin' THEN
    RAISE EXCEPTION 'Administrators cannot demote themselves';
  END IF;
  
  -- Update role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the change
  INSERT INTO public.profile_audit_log (
    user_id, changed_by, old_role, new_role, change_reason
  ) VALUES (
    target_user_id, auth.uid(), old_role, new_role, reason
  );
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_first_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  target_user_id uuid;
  admin_count integer;
BEGIN
  -- Check if there are already admin users
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles 
  WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RAISE EXCEPTION 'Admin users already exist. Use change_user_role function instead.';
  END IF;
  
  -- Find user by email
  SELECT user_id INTO target_user_id 
  FROM public.profiles 
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Promote to admin
  UPDATE public.profiles 
  SET role = 'admin', updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Log the admin creation
  PERFORM public.log_security_event(
    'admin_created',
    format('First admin user created: %s', user_email),
    jsonb_build_object('promoted_user', target_user_id, 'email', user_email)
  );
  
  RETURN TRUE;
END;
$function$;

-- Log completion of database security fixes
SELECT public.log_security_event(
  'database_security_hardening_complete',
  'Completed comprehensive database security hardening including all RLS policies, function search paths, and encryption fixes',
  jsonb_build_object(
    'critical_issues_fixed', ARRAY[
      'missing_rls_policies_on_sensitive_tables',
      'infinite_recursion_in_saas_superadmins_policies', 
      'missing_pgcrypto_extension',
      'insecure_function_search_paths',
      'encryption_function_errors'
    ],
    'security_level', 'critical',
    'completion_status', 'database_layer_secured'
  )
);