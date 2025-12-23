-- Security Enhancement Phase 1: Critical Data Protection (Fixed)

-- First, clean up invalid email data
UPDATE public.contatos 
SET email = NULL 
WHERE email IS NOT NULL 
AND email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- Add NOT NULL constraints to critical user_id fields
ALTER TABLE public.contatos 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.etiquetas 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.etiqueta_vinculos 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Add validation trigger to ensure user_id matches authenticated user
CREATE OR REPLACE FUNCTION public.validate_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation triggers
CREATE TRIGGER validate_contatos_user_id
  BEFORE INSERT OR UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id();

CREATE TRIGGER validate_etiquetas_user_id
  BEFORE INSERT OR UPDATE ON public.etiquetas
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id();

CREATE TRIGGER validate_etiqueta_vinculos_user_id
  BEFORE INSERT OR UPDATE ON public.etiqueta_vinculos
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id();

-- Add email format validation (now that data is clean)
ALTER TABLE public.contatos 
ADD CONSTRAINT valid_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add CNPJ/CPF validation
ALTER TABLE public.contatos 
ADD CONSTRAINT valid_cpf_cnpj_format 
CHECK (cpf_cnpj IS NULL OR length(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g')) IN (11, 14));

-- Add profile email validation
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_profile_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');