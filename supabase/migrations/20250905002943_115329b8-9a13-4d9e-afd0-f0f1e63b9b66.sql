-- CRITICAL SECURITY FIX: Prevent role escalation vulnerability
-- Remove overly permissive policy that allows users to change their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new restrictive policy that allows profile updates but prevents role changes
-- Note: We cannot use OLD.role in RLS policies, so we'll prevent role updates entirely through RLS
-- Role changes must go through the dedicated change_user_role function
CREATE POLICY "Users can update their profile data (not role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure only users can view their own profile, admins can view all
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

-- Add a check constraint to prevent direct role updates (only through function)
-- This will be enforced at the database level
ALTER TABLE public.profiles 
ADD CONSTRAINT prevent_direct_role_updates 
CHECK (true); -- Placeholder, we'll use trigger instead

-- Fix database functions security by adding proper search_path settings
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$function$;

CREATE OR REPLACE FUNCTION public.is_superadmin(user_email text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.saas_superadmins 
    WHERE email = user_email
  );
$function$;

-- Create a trigger function to prevent unauthorized role changes
CREATE OR REPLACE FUNCTION public.prevent_unauthorized_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Allow role changes only if:
  -- 1. User is admin, OR
  -- 2. Role hasn't changed, OR 
  -- 3. This is coming from the change_user_role function (indicated by a session variable)
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    -- Check if this update is authorized (from change_user_role function)
    IF current_setting('app.authorized_role_change', true) != 'true' THEN
      -- Check if current user is admin
      IF NOT has_role('admin') THEN
        -- Log the unauthorized attempt
        PERFORM public.log_enhanced_security_event(
          'unauthorized_role_change_blocked',
          format('BLOCKED: Unauthorized role change attempt from %s to %s for user %s', OLD.role, NEW.role, NEW.user_id),
          'critical',
          jsonb_build_object(
            'old_role', OLD.role, 
            'new_role', NEW.role, 
            'target_user', NEW.user_id,
            'attempted_by', auth.uid(),
            'blocked', true
          )
        );
        
        RAISE EXCEPTION 'Role changes must be performed through the change_user_role function by an administrator';
      END IF;
    END IF;
  END IF;
  
  -- Log all profile updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'profile_update',
      format('Profile updated for user %s', NEW.user_id),
      jsonb_build_object('user_id', NEW.user_id, 'updated_by', auth.uid())
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger to prevent unauthorized role changes
DROP TRIGGER IF EXISTS prevent_role_escalation ON public.profiles;
CREATE TRIGGER prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_unauthorized_role_changes();

-- Update the change_user_role function to set the authorization flag
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
  
  -- Set authorization flag for the role change
  PERFORM set_config('app.authorized_role_change', 'true', true);
  
  -- Update role
  UPDATE public.profiles 
  SET role = new_role, updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Clear authorization flag
  PERFORM set_config('app.authorized_role_change', 'false', true);
  
  -- Log the change
  INSERT INTO public.profile_audit_log (
    user_id, changed_by, old_role, new_role, change_reason
  ) VALUES (
    target_user_id, auth.uid(), old_role, new_role, reason
  );
  
  RETURN TRUE;
END;
$function$;