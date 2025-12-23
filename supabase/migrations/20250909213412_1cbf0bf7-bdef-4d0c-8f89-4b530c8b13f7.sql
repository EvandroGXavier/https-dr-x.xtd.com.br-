-- Verificar a estrutura da tabela contato_vinculos
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'contato_vinculos' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar se há triggers na tabela
SELECT trigger_name, action_timing, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'contato_vinculos';

-- Verificar as políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contato_vinculos';