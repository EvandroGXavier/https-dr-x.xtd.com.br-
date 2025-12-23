-- CRITICAL SECURITY FIX: Prevent role escalation vulnerability
-- Remove overly permissive policy that allows users to change their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new restrictive policy that allows profile updates but prevents role changes
-- Note: PostgreSQL UPDATE policies don't have access to OLD values in WITH CHECK
-- So we need to use a USING clause and create a function for validation
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent role changes through direct profile updates
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Log the attempt
    PERFORM public.log_enhanced_security_event(
      'unauthorized_role_change_attempt',
      format('CRITICAL: Direct role change attempt from %s to %s for user %s', OLD.role, NEW.role, NEW.user_id),
      'critical',
      jsonb_build_object(
        'old_role', OLD.role, 
        'new_role', NEW.role, 
        'target_user', NEW.user_id,
        'attempted_by', auth.uid()
      )
    );
    
    RAISE EXCEPTION 'Role changes are not allowed through profile updates. Use the change_user_role function instead.';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to prevent role changes
DROP TRIGGER IF EXISTS prevent_role_changes ON public.profiles;
CREATE TRIGGER prevent_role_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_update();

-- Create simple policy for profile updates (role changes are blocked by trigger)
CREATE POLICY "Users can update their profile data" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure users can view their own profile and admins can view all
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

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