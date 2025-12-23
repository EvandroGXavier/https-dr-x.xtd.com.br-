-- Verificar as foreign keys da tabela contato_enderecos
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'contato_enderecos';

-- Verificar se existe foreign key constraint que precisa ser removida
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'contato_enderecos' 
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name LIKE '%contato_id%';

-- Remover a foreign key atual se existir
DO $$ 
DECLARE 
    constraint_name_var TEXT;
BEGIN
    SELECT constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints 
    WHERE table_name = 'contato_enderecos' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%contato_id%'
    LIMIT 1;
    
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.contato_enderecos DROP CONSTRAINT ' || constraint_name_var;
    END IF;
END $$;

-- Adicionar nova foreign key referenciando contatos_v2
ALTER TABLE public.contato_enderecos 
ADD CONSTRAINT contato_enderecos_contato_id_fkey 
FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON DELETE CASCADE;