-- Fix the UUID validation function to handle different data types correctly
CREATE OR REPLACE FUNCTION public.validate_uuid_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle UUID fields - convert empty strings to NULL
  IF TG_TABLE_NAME = 'contato_meios_contato' OR TG_TABLE_NAME = 'contato_financeiro_config' THEN
    IF NEW.empresa_id::text = '' THEN
      NEW.empresa_id := NULL;
    END IF;
    
    IF NEW.filial_id::text = '' THEN
      NEW.filial_id := NULL;
    END IF;
  END IF;
  
  -- Handle contato_vinculos table specifically (has integer empresa_id/filial_id)
  IF TG_TABLE_NAME = 'contato_vinculos' THEN
    -- Ensure vinculado_id is not empty for vinculos
    IF NEW.vinculado_id::text = '' THEN
      RAISE EXCEPTION 'vinculado_id cannot be empty';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers for each table
DROP TRIGGER IF EXISTS validate_uuid_fields_trigger ON public.contato_vinculos;
DROP TRIGGER IF EXISTS validate_uuid_fields_trigger_meios_contato ON public.contato_meios_contato;

-- Add trigger to contato_vinculos (focuses on vinculado_id validation)
CREATE TRIGGER validate_uuid_fields_trigger
    BEFORE INSERT OR UPDATE ON public.contato_vinculos
    FOR EACH ROW EXECUTE FUNCTION public.validate_uuid_fields();

-- Add trigger to contato_meios_contato (handles UUID empresa_id/filial_id)
CREATE TRIGGER validate_uuid_fields_trigger_meios_contato
    BEFORE INSERT OR UPDATE ON public.contato_meios_contato
    FOR EACH ROW EXECUTE FUNCTION public.validate_uuid_fields();