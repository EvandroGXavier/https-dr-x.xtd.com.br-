-- Ajustar tipos de dados na tabela contato_vinculos apenas

-- Verificar registros existentes
DO $$
DECLARE
    record_count integer;
BEGIN
    SELECT COUNT(*) INTO record_count FROM contato_vinculos;
    RAISE NOTICE 'Registros existentes na tabela contato_vinculos: %', record_count;
END $$;

-- Corrigir os tipos de dados na tabela contato_vinculos
-- Alterar empresa_id e filial_id para UUID se ainda são INTEGER
DO $$
BEGIN
    -- Verificar se empresa_id é integer e converter para UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contato_vinculos' 
        AND column_name = 'empresa_id' 
        AND data_type = 'integer'
    ) THEN
        -- Primeiro criar uma tabela de mapeamento temporária se necessário
        CREATE TABLE IF NOT EXISTS temp_empresa_mapping AS 
        SELECT DISTINCT empresa_id, gen_random_uuid() as new_uuid 
        FROM contato_vinculos 
        WHERE empresa_id IS NOT NULL;
        
        -- Adicionar coluna temporária
        ALTER TABLE contato_vinculos ADD COLUMN empresa_id_temp UUID;
        
        -- Mapear valores
        UPDATE contato_vinculos 
        SET empresa_id_temp = (
            SELECT new_uuid FROM temp_empresa_mapping 
            WHERE temp_empresa_mapping.empresa_id = contato_vinculos.empresa_id
        )
        WHERE empresa_id IS NOT NULL;
        
        -- Remover coluna antiga e renomear
        ALTER TABLE contato_vinculos DROP COLUMN empresa_id;
        ALTER TABLE contato_vinculos RENAME COLUMN empresa_id_temp TO empresa_id;
        
        DROP TABLE temp_empresa_mapping;
    END IF;
    
    -- Verificar se filial_id é integer e converter para UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contato_vinculos' 
        AND column_name = 'filial_id' 
        AND data_type = 'integer'
    ) THEN
        -- Primeiro criar uma tabela de mapeamento temporária se necessário
        CREATE TABLE IF NOT EXISTS temp_filial_mapping AS 
        SELECT DISTINCT filial_id, gen_random_uuid() as new_uuid 
        FROM contato_vinculos 
        WHERE filial_id IS NOT NULL;
        
        -- Adicionar coluna temporária
        ALTER TABLE contato_vinculos ADD COLUMN filial_id_temp UUID;
        
        -- Mapear valores
        UPDATE contato_vinculos 
        SET filial_id_temp = (
            SELECT new_uuid FROM temp_filial_mapping 
            WHERE temp_filial_mapping.filial_id = contato_vinculos.filial_id
        )
        WHERE filial_id IS NOT NULL;
        
        -- Remover coluna antiga e renomear
        ALTER TABLE contato_vinculos DROP COLUMN filial_id;
        ALTER TABLE contato_vinculos RENAME COLUMN filial_id_temp TO filial_id;
        
        DROP TABLE temp_filial_mapping;
    END IF;
END $$;