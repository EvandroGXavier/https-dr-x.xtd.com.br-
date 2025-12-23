-- Dropar views que dependem da tabela processos
DROP VIEW IF EXISTS vw_processos_pt CASCADE;

-- Converter status de ENUM para TEXT
ALTER TABLE public.processos 
ALTER COLUMN status TYPE TEXT USING status::TEXT;

-- Dropar o tipo ENUM antigo
DROP TYPE IF EXISTS processo_status CASCADE;
DROP TYPE IF EXISTS processo_tipo CASCADE;
DROP TYPE IF EXISTS processo_instancia CASCADE;
DROP TYPE IF EXISTS processo_etiqueta CASCADE;
DROP TYPE IF EXISTS processo_situacao CASCADE;

-- Definir novo default
ALTER TABLE public.processos
ALTER COLUMN status SET DEFAULT 'Oportunidade';