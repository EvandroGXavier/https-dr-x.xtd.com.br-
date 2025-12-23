-- Adicionar colunas para principais em contato_meios_contato
ALTER TABLE public.contato_meios_contato
ADD COLUMN IF NOT EXISTS telefone_principal text,
ADD COLUMN IF NOT EXISTS email_principal text;