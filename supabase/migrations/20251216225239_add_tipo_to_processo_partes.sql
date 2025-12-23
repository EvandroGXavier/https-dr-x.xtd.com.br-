-- Migration: Add tipo column to processo_partes table
-- Timestamp: 20251216225239
-- Description: Adds 'tipo' column to store office classification of parties

-- Add tipo column (nullable, will be populated gradually)
ALTER TABLE processo_partes 
ADD COLUMN IF NOT EXISTS tipo TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN processo_partes.tipo IS 
'Classificação da parte para o escritório (ex: Cliente, Advogado, Parte Adversa). Diferente de qualificacao que é a classificação processual.';

-- No default value needed - will be NULL for existing records
-- Frontend will handle NULL values gracefully
