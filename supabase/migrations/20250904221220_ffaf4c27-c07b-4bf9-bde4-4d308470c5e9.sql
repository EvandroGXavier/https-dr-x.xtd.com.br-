-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Only superadmins can manage superadmins" ON public.saas_superadmins;
DROP POLICY IF EXISTS "Only superadmins can view superadmins" ON public.saas_superadmins;
DROP POLICY IF EXISTS "Superadmins can manage all" ON public.saas_superadmins;

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
    WHERE email = user_email AND ativo = true
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

INSERT INTO public.saas_superadmins (email, nome, ativo, created_at, updated_at)
VALUES ('evandro@conectionmg.com.br', 'Evandro G Xavier', true, now(), now())
ON CONFLICT (email) DO UPDATE SET
  nome = EXCLUDED.nome,
  ativo = EXCLUDED.ativo,
  updated_at = now();

-- Re-enable RLS
ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;