-- Add the UUID validation trigger to contato_vinculos table
CREATE TRIGGER validate_uuid_fields_trigger
    BEFORE INSERT OR UPDATE ON public.contato_vinculos
    FOR EACH ROW EXECUTE FUNCTION public.validate_uuid_fields();

-- Also add the same trigger to contato_meios_contato to handle empty UUID fields
CREATE TRIGGER validate_uuid_fields_trigger_meios_contato
    BEFORE INSERT OR UPDATE ON public.contato_meios_contato
    FOR EACH ROW EXECUTE FUNCTION public.validate_uuid_fields();

-- Update the VinculosTab component validation to ensure required fields are not empty
-- Let's also check if there are any issues with the existing data

-- Check for any existing invalid data in contato_vinculos
DO $$
BEGIN
  -- Check for empty string UUIDs and fix them
  UPDATE public.contato_vinculos 
  SET empresa_id = NULL 
  WHERE empresa_id = '';
  
  UPDATE public.contato_vinculos 
  SET filial_id = NULL 
  WHERE filial_id = '';
  
  -- Log any findings
  RAISE NOTICE 'UUID validation setup completed for contato_vinculos and contato_meios_contato';
END $$;