-- Adicionar coluna template_oportunidade à tabela processos_config
ALTER TABLE public.processos_config
ADD COLUMN IF NOT EXISTS template_oportunidade TEXT;