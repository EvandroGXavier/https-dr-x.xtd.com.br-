-- Adiciona coluna numero_cnj à tabela processos para suportar criação de rascunho via RPC criar_processo_v1
ALTER TABLE public.processos
ADD COLUMN IF NOT EXISTS numero_cnj text;