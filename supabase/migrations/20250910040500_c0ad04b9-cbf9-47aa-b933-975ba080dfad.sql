-- Fix security policies for contacts - use only contatos_v2 table
-- Remove any references to old 'contatos' table and ensure all policies use contatos_v2

-- Enable RLS on contatos_v2 if not already enabled
ALTER TABLE public.contatos_v2 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on contatos_v2 if they exist
DROP POLICY IF EXISTS "Users can view their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can create their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can update their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can delete their own contatos_v2" ON public.contatos_v2;

-- Create secure RLS policies for contatos_v2
CREATE POLICY "Users can view their own contatos_v2" 
ON public.contatos_v2 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own contatos_v2" 
ON public.contatos_v2 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own contatos_v2" 
ON public.contatos_v2 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own contatos_v2" 
ON public.contatos_v2 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Create trigger to ensure user_id is set correctly on contatos_v2
CREATE OR REPLACE FUNCTION public.validate_contatos_v2_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id to current authenticated user if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Validate that user_id matches authenticated user (except for admins)
  IF NEW.user_id != auth.uid() AND NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Cannot create/update contacts for other users';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply trigger to contatos_v2
DROP TRIGGER IF EXISTS validate_contatos_v2_user_id_trigger ON public.contatos_v2;
CREATE TRIGGER validate_contatos_v2_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_contatos_v2_user_id();

-- Log security event for contacts access on contatos_v2
CREATE OR REPLACE FUNCTION public.log_contatos_v2_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive data
  PERFORM public.log_sensitive_data_access(
    'contatos_v2',
    COALESCE(NEW.id, OLD.id),
    ARRAY['cpf_cnpj', 'email', 'celular', 'telefone'],
    TG_OP
  );
  
  -- Enhanced breach pattern detection
  PERFORM public.detect_data_breach_patterns();
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply access logging trigger to contatos_v2
DROP TRIGGER IF EXISTS log_contatos_v2_access_trigger ON public.contatos_v2;
CREATE TRIGGER log_contatos_v2_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.log_contatos_v2_access();