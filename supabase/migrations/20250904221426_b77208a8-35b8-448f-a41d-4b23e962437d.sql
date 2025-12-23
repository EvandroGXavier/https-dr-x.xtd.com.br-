-- Drop all existing policies first
DROP POLICY IF EXISTS "Superadmins can view all superadmins" ON public.saas_superadmins;
DROP POLICY IF EXISTS "Superadmins can insert superadmins" ON public.saas_superadmins;
DROP POLICY IF EXISTS "Superadmins can update superadmins" ON public.saas_superadmins;
DROP POLICY IF EXISTS "Superadmins can delete superadmins" ON public.saas_superadmins;

-- Temporarily disable RLS to insert the first admin
ALTER TABLE public.saas_superadmins DISABLE ROW LEVEL SECURITY;

-- Insert the superadmin user
INSERT INTO public.saas_superadmins (email, created_at)
VALUES ('evandro@conectionmg.com.br', now())
ON CONFLICT (email) DO UPDATE SET
  created_at = EXCLUDED.created_at;

-- Create security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.is_superadmin(user_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.saas_superadmins 
    WHERE email = user_email
  );
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$$;

-- Recreate RLS policies using the functions
CREATE POLICY "Superadmins can view all superadmins"
ON public.saas_superadmins
FOR SELECT
USING (public.is_superadmin(public.get_current_user_email()));

CREATE POLICY "Superadmins can insert superadmins"
ON public.saas_superadmins
FOR INSERT
WITH CHECK (public.is_superadmin(public.get_current_user_email()));

CREATE POLICY "Superadmins can update superadmins"
ON public.saas_superadmins
FOR UPDATE
USING (public.is_superadmin(public.get_current_user_email()));

CREATE POLICY "Superadmins can delete superadmins"
ON public.saas_superadmins
FOR DELETE
USING (public.is_superadmin(public.get_current_user_email()));

-- Re-enable RLS
ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;