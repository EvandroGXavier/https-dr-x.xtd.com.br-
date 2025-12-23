-- Fix security issues from linter

-- 1. Fix function search path for update trigger function
DROP FUNCTION IF EXISTS public.update_contato_anexo_updated_at();

CREATE OR REPLACE FUNCTION public.update_contato_anexo_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Enable RLS on any tables that might be missing it (checking existing tables)
-- First check if empresas and filiais need RLS enabled (from the linter error)
DO $$
BEGIN
  -- Check and enable RLS on empresas if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'empresas' 
    AND rowsecurity = true
    AND schemaname = 'public'
  ) THEN
    ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Check and enable RLS on filiais if not already enabled  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'filiais' 
    AND rowsecurity = true
    AND schemaname = 'public'
  ) THEN
    ALTER TABLE public.filiais ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;