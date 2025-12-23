-- Alterar tabela contato_vinculos para permitir NULL em empresa_id e filial_id
ALTER TABLE public.contato_vinculos 
ALTER COLUMN empresa_id DROP NOT NULL,
ALTER COLUMN filial_id DROP NOT NULL;