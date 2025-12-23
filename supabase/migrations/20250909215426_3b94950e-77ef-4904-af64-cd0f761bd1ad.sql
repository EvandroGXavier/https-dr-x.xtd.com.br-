-- Corrigir a estrutura da tabela contato_vinculos e relações

-- Primeiro, verificar se existem dados na tabela
DO $$
DECLARE
    record_count integer;
BEGIN
    SELECT COUNT(*) INTO record_count FROM contato_vinculos;
    RAISE NOTICE 'Registros existentes na tabela contato_vinculos: %', record_count;
END $$;

-- Corrigir os tipos de dados na tabela contato_vinculos
-- Alterar empresa_id e filial_id para UUID para consistência
ALTER TABLE contato_vinculos 
ALTER COLUMN empresa_id TYPE UUID USING empresa_id::text::uuid,
ALTER COLUMN filial_id TYPE UUID USING filial_id::text::uuid;

-- Adicionar as foreign keys necessárias
-- Foreign key para contato_id -> contatos_v2.id
ALTER TABLE contato_vinculos 
ADD CONSTRAINT contato_vinculos_contato_id_fkey 
FOREIGN KEY (contato_id) REFERENCES contatos_v2(id) ON DELETE CASCADE;

-- Foreign key para vinculado_id -> contatos_v2.id  
ALTER TABLE contato_vinculos 
ADD CONSTRAINT contato_vinculos_vinculado_id_fkey 
FOREIGN KEY (vinculado_id) REFERENCES contatos_v2(id) ON DELETE CASCADE;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contato_vinculos_contato_id ON contato_vinculos(contato_id);
CREATE INDEX IF NOT EXISTS idx_contato_vinculos_vinculado_id ON contato_vinculos(vinculado_id);
CREATE INDEX IF NOT EXISTS idx_contato_vinculos_tipo ON contato_vinculos(tipo_vinculo);

-- Verificar a estrutura final
SELECT 
    c.table_name,
    c.column_name, 
    c.data_type,
    c.is_nullable,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.table_constraints tc ON c.table_name = tc.table_name
WHERE c.table_name = 'contato_vinculos'
ORDER BY c.ordinal_position;