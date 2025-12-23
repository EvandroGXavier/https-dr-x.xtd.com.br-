-- Fix RLS recursion on saas_superadmins and ensure superadmins can read required tables

-- 1) Drop existing RLS policies on saas_superadmins to avoid recursion loops
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'saas_superadmins'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 2) Ensure RLS is enabled (it should be for safety)
ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;

-- 3) Create a simple, non-recursive SELECT policy
--    Note: We intentionally do NOT reference is_superadmin() here to avoid recursion
CREATE POLICY saas_superadmins_read
ON public.saas_superadmins
FOR SELECT
USING (true);

-- Do not create INSERT/UPDATE/DELETE policies here; only privileged paths should modify this table

-- 4) Ensure superadmins can read planos and assinaturas (if policies are missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='saas_planos' AND policyname='saas_planos_read_superadmin'
  ) THEN
    CREATE POLICY saas_planos_read_superadmin
    ON public.saas_planos
    FOR SELECT
    USING (public.is_superadmin(public.get_current_user_email()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='saas_assinaturas' AND policyname='saas_assinaturas_read_superadmin'
  ) THEN
    CREATE POLICY saas_assinaturas_read_superadmin
    ON public.saas_assinaturas
    FOR SELECT
    USING (public.is_superadmin(public.get_current_user_email()));
  END IF;
END $$;

-- 5) Optional: make companies listing function callable by superadmin reliably
--    If the function exists, keep as is. We avoid changing function definitions here.
