-- Atualizar a função validate_user_id para ser mais robusta
CREATE OR REPLACE FUNCTION public.validate_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Garantir que user_id seja sempre definido como o usuário autenticado atual
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Validar que user_id corresponde ao usuário autenticado (exceto para admins)
  IF NEW.user_id != auth.uid() AND NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Cannot create records for other users';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recriar o trigger para contato_vinculos
DROP TRIGGER IF EXISTS validate_user_id_trigger ON contato_vinculos;
CREATE TRIGGER validate_user_id_trigger
    BEFORE INSERT OR UPDATE ON contato_vinculos
    FOR EACH ROW EXECUTE FUNCTION validate_user_id();