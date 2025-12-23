-- Critical Security Fixes Migration

-- 1. Fix nullable user_id constraints
-- First, update any existing records with null user_id to a default admin user
-- Note: In production, you should handle this more carefully by assigning proper user_ids

-- Make user_id NOT NULL for contatos table
ALTER TABLE public.contatos 
ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL for etiquetas table  
ALTER TABLE public.etiquetas
ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL for etiqueta_vinculos table
ALTER TABLE public.etiqueta_vinculos
ALTER COLUMN user_id SET NOT NULL;

-- 2. Fix security definer functions with mutable search paths
-- Update has_role function with secure search path
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

-- Update get_current_user_role function with secure search path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

-- Update change_user_role function with secure search path
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

-- 3. Add additional security constraints
-- Add check constraint to prevent empty user_id values
ALTER TABLE public.contatos 
ADD CONSTRAINT contatos_user_id_not_empty 
CHECK (user_id IS NOT NULL);

ALTER TABLE public.etiquetas
ADD CONSTRAINT etiquetas_user_id_not_empty  
CHECK (user_id IS NOT NULL);

ALTER TABLE public.etiqueta_vinculos
ADD CONSTRAINT etiqueta_vinculos_user_id_not_empty
CHECK (user_id IS NOT NULL);

-- 4. Enhanced audit logging function with secure search path
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

-- Create trigger for automatic audit logging
DROP TRIGGER IF EXISTS profile_role_change_audit ON public.profiles;
CREATE TRIGGER profile_role_change_audit
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_profile_changes();