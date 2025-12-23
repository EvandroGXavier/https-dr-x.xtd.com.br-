-- Security Enhancement Migration
-- Fix CVE-2025-48757 and other critical security issues

-- 1. Update all functions to use secure search path
CREATE OR REPLACE FUNCTION public.validate_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.change_user_role(target_user_id uuid, new_role app_role, reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.log_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.profile_audit_log (
      user_id, changed_by, old_role, new_role, change_reason
    ) VALUES (
      NEW.user_id, auth.uid(), OLD.role, NEW.role, 'Profile update'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Create security audit table for tracking security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  event_description text,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY "Only admins can view security logs" 
ON public.security_audit_log 
FOR SELECT 
USING (has_role('admin'));

-- 3. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  event_description text,
  metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, event_type, event_description, metadata
  ) VALUES (
    auth.uid(), event_type, event_description, metadata
  );
END;
$function$;

-- 4. Enhanced RLS policies to prevent CVE-2025-48757 patterns
-- Update profiles policies to be more restrictive
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;

CREATE POLICY "Users can update their own profile (except role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (
  auth.uid() = user_id AND 
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()) AND
  user_id = auth.uid()
);

-- 5. Add triggers for security logging
CREATE OR REPLACE FUNCTION public.log_profile_security_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log role changes
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM public.log_security_event(
      'role_change',
      format('Role changed from %s to %s for user %s', OLD.role, NEW.role, NEW.user_id),
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role, 'target_user', NEW.user_id)
    );
  END IF;
  
  -- Log profile updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'profile_update',
      format('Profile updated for user %s', NEW.user_id),
      jsonb_build_object('user_id', NEW.user_id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create trigger for profile security logging
DROP TRIGGER IF EXISTS profile_security_audit ON public.profiles;
CREATE TRIGGER profile_security_audit
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_security_events();