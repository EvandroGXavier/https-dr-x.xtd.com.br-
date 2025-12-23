-- Security Enhancement Phase 1: Critical Data Protection

-- Add NOT NULL constraints to critical user_id fields that are currently nullable
-- This prevents orphaned records and ensures proper RLS enforcement

ALTER TABLE public.contatos 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.etiquetas 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.etiqueta_vinculos 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.profiles 
ALTER COLUMN user_id SET NOT NULL;

-- Add validation trigger to ensure user_id matches authenticated user for new records
CREATE OR REPLACE FUNCTION public.validate_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure user_id matches the authenticated user
  IF NEW.user_id != auth.uid() THEN
    RAISE EXCEPTION 'user_id must match authenticated user';
  END IF;
  
  -- Ensure user_id is not null
  IF NEW.user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply validation trigger to all user-data tables
CREATE TRIGGER validate_contatos_user_id
  BEFORE INSERT OR UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id();

CREATE TRIGGER validate_etiquetas_user_id
  BEFORE INSERT OR UPDATE ON public.etiquetas
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id();

CREATE TRIGGER validate_etiqueta_vinculos_user_id
  BEFORE INSERT OR UPDATE ON public.etiqueta_vinculos
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_id();

-- Add check constraint to ensure valid email format in contatos
ALTER TABLE public.contatos 
ADD CONSTRAINT valid_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add check constraint to ensure valid CNPJ/CPF format in contatos
ALTER TABLE public.contatos 
ADD CONSTRAINT valid_cpf_cnpj_format 
CHECK (cpf_cnpj IS NULL OR length(regexp_replace(cpf_cnpj, '[^0-9]', '', 'g')) IN (11, 14));

-- Ensure profiles table has proper constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT valid_profile_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add audit function for sensitive data changes
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log changes to email fields
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO public.profile_audit_log (
      user_id, changed_by, old_role, new_role, change_reason
    ) VALUES (
      NEW.user_id, auth.uid(), 'user'::app_role, 'user'::app_role, 
      'Email changed from ' || COALESCE(OLD.email, 'NULL') || ' to ' || COALESCE(NEW.email, 'NULL')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to contatos table for email changes
CREATE TRIGGER audit_contatos_email_changes
  AFTER UPDATE ON public.contatos
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();