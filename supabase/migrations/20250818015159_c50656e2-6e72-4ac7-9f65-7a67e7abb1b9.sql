-- Fix critical privilege escalation vulnerability
-- Step 1: Create audit log table for profile changes
CREATE TABLE IF NOT EXISTS public.profile_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  old_role app_role,
  new_role app_role,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  change_reason TEXT
);

-- Enable RLS on audit log
ALTER TABLE public.profile_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.profile_audit_log
FOR SELECT
USING (has_role('admin'::app_role));

-- Step 2: Create secure function for role changes (admin only)
CREATE OR REPLACE FUNCTION public.change_user_role(
  target_user_id UUID,
  new_role app_role,
  reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Step 3: Update profiles RLS policies to prevent role escalation
-- Drop existing policy and recreate with role restriction
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can update their profile EXCEPT the role field
CREATE POLICY "Users can update their own profile (except role)"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  -- Prevent role changes by regular users
  role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Admins can update any profile including roles
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role('admin'::app_role));

-- Step 4: Remove dangerous password field from contatos table
ALTER TABLE public.contatos DROP COLUMN IF EXISTS password;

-- Step 5: Update database functions to use secure search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = _role
  );
$function$;