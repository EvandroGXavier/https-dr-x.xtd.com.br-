-- Verificar triggers na tabela contato_vinculos
SELECT t.trigger_name, t.action_timing, t.event_manipulation, t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'contato_vinculos'
AND t.event_object_schema = 'public';

-- Verificar se há função validate_user_id
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%validate_user_id%';

-- Remover trigger se existir e readicionar apenas para INSERT
DROP TRIGGER IF EXISTS validate_user_id_trigger ON contato_vinculos;
DROP TRIGGER IF EXISTS validate_uuid_fields_trigger ON contato_vinculos;

-- Criar trigger apenas para validação de UUIDs, sem interferir no user_id
CREATE OR REPLACE TRIGGER validate_uuid_fields_trigger
    BEFORE INSERT OR UPDATE ON contato_vinculos
    FOR EACH ROW EXECUTE FUNCTION validate_uuid_fields();