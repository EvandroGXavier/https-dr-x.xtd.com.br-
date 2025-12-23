-- Drop ALL existing policies on saas_superadmins table
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'saas_superadmins' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.saas_superadmins';
    END LOOP;
END $$;

-- Create a simple security definer function to check superadmin status
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

-- Create a function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$$;

-- Recreate RLS policies using security definer functions to avoid recursion
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

-- Insert the superadmin user (temporarily disable RLS to insert the first admin)
ALTER TABLE public.saas_superadmins DISABLE ROW LEVEL SECURITY;

INSERT INTO public.saas_superadmins (email, created_at)
VALUES ('evandro@conectionmg.com.br', now())
ON CONFLICT (email) DO UPDATE SET
  created_at = EXCLUDED.created_at;

-- Re-enable RLS
ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;