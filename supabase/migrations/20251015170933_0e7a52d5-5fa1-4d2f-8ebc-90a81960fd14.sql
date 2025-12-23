-- Verificar se existe alguma constraint ou default tentando usar 'id' na tabela agenda_etiquetas
-- A tabela agenda_etiquetas NÃO deve ter coluna 'id', é uma tabela de junção com chave composta

-- Primeiro, verificar estrutura atual
DO $$ 
BEGIN
  -- Se a coluna 'id' existir, removê-la
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agenda_etiquetas' AND column_name = 'id'
  ) THEN
    ALTER TABLE agenda_etiquetas DROP COLUMN IF EXISTS id CASCADE;
    RAISE NOTICE 'Coluna id removida de agenda_etiquetas';
  END IF;

  -- Garantir que a chave primária composta está correta
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'agenda_etiquetas' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE agenda_etiquetas 
    ADD PRIMARY KEY (agenda_id, etiqueta_id);
    RAISE NOTICE 'Chave primária composta adicionada a agenda_etiquetas';
  END IF;
END $$;