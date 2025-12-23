-- Corrigir a função validate_user_id para usar has_role em vez de has_role_secure
CREATE OR REPLACE FUNCTION public.validate_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Ensure user_id is set to current authenticated user
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Validate that user_id matches authenticated user (except for admins)
  IF NEW.user_id != auth.uid() AND NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Cannot create records for other users';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Adicionar o trigger para a tabela contato_vinculos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'contato_vinculos' 
    AND trigger_name = 'validate_user_id_trigger'
  ) THEN
    CREATE TRIGGER validate_user_id_trigger
      BEFORE INSERT OR UPDATE ON contato_vinculos
      FOR EACH ROW EXECUTE FUNCTION validate_user_id();
  END IF;
END $$;