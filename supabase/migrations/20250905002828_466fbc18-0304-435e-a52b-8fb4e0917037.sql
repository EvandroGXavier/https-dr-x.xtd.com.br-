-- CRITICAL SECURITY FIX: Prevent role escalation vulnerability
-- Remove overly permissive policy that allows users to change their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new restrictive policy that allows profile updates but prevents role changes
CREATE POLICY "Users can update their profile data (not role)" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent role changes - only allow if role hasn't changed
  OLD.role = NEW.role
);

-- Ensure only admins can view all profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

-- Ensure only admins can change roles through the dedicated function
-- The change_user_role function already has proper authorization checks

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

-- Enhanced security event logging for profile changes
CREATE OR REPLACE FUNCTION public.log_profile_security_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Log role changes (should only happen through change_user_role function)
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    -- This should not happen due to the new policy, but log it as a critical security event
    PERFORM public.log_enhanced_security_event(
      'unauthorized_role_change_attempt',
      format('CRITICAL: Direct role change attempt from %s to %s for user %s', OLD.role, NEW.role, NEW.user_id),
      'critical',
      jsonb_build_object(
        'old_role', OLD.role, 
        'new_role', NEW.role, 
        'target_user', NEW.user_id,
        'attempted_by', auth.uid(),
        'should_be_blocked', true
      )
    );
  END IF;
  
  -- Log profile updates
  IF TG_OP = 'UPDATE' THEN
    PERFORM public.log_security_event(
      'profile_update',
      format('Profile updated for user %s', NEW.user_id),
      jsonb_build_object('user_id', NEW.user_id, 'updated_by', auth.uid())
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Log any attempts to escalate privileges
CREATE OR REPLACE FUNCTION public.detect_privilege_escalation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  suspicious_attempts integer;
BEGIN
  -- Check for multiple failed role change attempts
  SELECT COUNT(*)
  INTO suspicious_attempts
  FROM public.security_audit_log
  WHERE user_id = auth.uid()
    AND event_type = 'unauthorized_role_change_attempt'
    AND created_at > now() - interval '24 hours';
  
  IF suspicious_attempts > 0 THEN
    PERFORM public.log_enhanced_security_event(
      'privilege_escalation_detected',
      format('User %s has %s unauthorized role change attempts', auth.uid(), suspicious_attempts),
      'critical',
      jsonb_build_object(
        'attempts_count', suspicious_attempts,
        'time_window', '24 hours',
        'user_id', auth.uid(),
        'action_required', 'immediate_review'
      )
    );
  END IF;
END;
$function$;