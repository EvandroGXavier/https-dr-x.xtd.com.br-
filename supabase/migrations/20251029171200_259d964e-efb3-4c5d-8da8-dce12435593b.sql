-- Adicionar colunas faltantes na tabela contato_pj
ALTER TABLE public.contato_pj
ADD COLUMN IF NOT EXISTS inscricao_estadual text,
ADD COLUMN IF NOT EXISTS inscricao_municipal text,
ADD COLUMN IF NOT EXISTS atividade_principal text;