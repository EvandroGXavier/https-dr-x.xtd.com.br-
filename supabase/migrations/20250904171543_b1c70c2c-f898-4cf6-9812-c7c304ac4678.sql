-- Drop the old contatos table that might be causing conflicts
DROP TABLE IF EXISTS public.contatos CASCADE;

-- Also drop any potential triggers or functions related to the old table
DROP TRIGGER IF EXISTS log_contatos_access_trigger ON public.contatos;
DROP FUNCTION IF EXISTS public.log_contatos_access() CASCADE;