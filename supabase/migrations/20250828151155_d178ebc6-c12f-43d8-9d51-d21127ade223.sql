-- Fix security issues from linter - corrected version

-- 1. Fix function search path for update trigger function (drop trigger first)
DROP TRIGGER IF EXISTS update_contato_anexo_updated_at ON public.contato_anexo;
DROP FUNCTION IF EXISTS public.update_contato_anexo_updated_at() CASCADE;

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

-- Recreate the trigger
CREATE TRIGGER update_contato_anexo_updated_at
  BEFORE UPDATE ON public.contato_anexo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contato_anexo_updated_at();