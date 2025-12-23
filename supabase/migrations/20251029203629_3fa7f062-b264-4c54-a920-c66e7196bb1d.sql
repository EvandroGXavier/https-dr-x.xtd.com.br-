-- Remover colunas incorretas de contato_meios_contato
ALTER TABLE public.contato_meios_contato
DROP COLUMN IF EXISTS telefone_principal,
DROP COLUMN IF EXISTS email_principal;