-- Create the first admin user by updating an existing user's role
-- This should be run after a user has signed up normally

-- Function to promote the first user to admin (one-time setup)
CREATE OR REPLACE FUNCTION public.create_first_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- Enhanced password validation function
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
  is_valid boolean := true;
  errors text[] := '{}';
BEGIN
  -- Check minimum length
  IF length(password) < 8 THEN
    is_valid := false;
    errors := array_append(errors, 'Password must be at least 8 characters');
  END IF;
  
  -- Check for uppercase letter
  IF password !~ '[A-Z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one uppercase letter');
  END IF;
  
  -- Check for lowercase letter
  IF password !~ '[a-z]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one lowercase letter');
  END IF;
  
  -- Check for number
  IF password !~ '[0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one number');
  END IF;
  
  -- Check for special character
  IF password !~ '[^A-Za-z0-9]' THEN
    is_valid := false;
    errors := array_append(errors, 'Password must contain at least one special character');
  END IF;
  
  result := jsonb_build_object(
    'isValid', is_valid,
    'errors', to_jsonb(errors)
  );
  
  RETURN result;
END;
$$;

-- Enhanced security event logging with IP tracking
ALTER TABLE public.security_audit_log 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Function to log authentication attempts with more detail
CREATE OR REPLACE FUNCTION public.log_auth_attempt(
  event_type text,
  email text DEFAULT NULL,
  success boolean DEFAULT NULL,
  error_message text DEFAULT NULL,
  ip_addr inet DEFAULT NULL,
  user_agent_str text DEFAULT NULL
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
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(), 
    event_type, 
    CASE 
      WHEN success = true THEN format('Successful %s for %s', event_type, COALESCE(email, 'unknown'))
      WHEN success = false THEN format('Failed %s for %s: %s', event_type, COALESCE(email, 'unknown'), COALESCE(error_message, 'unknown error'))
      ELSE format('%s attempt for %s', event_type, COALESCE(email, 'unknown'))
    END,
    jsonb_build_object(
      'email', email,
      'success', success,
      'error', error_message,
      'timestamp', extract(epoch from now())
    ),
    ip_addr,
    user_agent_str
  );
END;
$$;