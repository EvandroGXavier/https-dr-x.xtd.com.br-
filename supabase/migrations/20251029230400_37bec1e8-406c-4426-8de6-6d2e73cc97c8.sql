-- Padronizar tipos de meios de contato (case-sensitive fix)
-- Corrige inconsistências de capitalização nos tipos

UPDATE public.contato_meios_contato
SET tipo = 'Email'
WHERE LOWER(tipo) = 'email' AND tipo != 'Email';

UPDATE public.contato_meios_contato
SET tipo = 'Celular'
WHERE LOWER(tipo) = 'celular' AND tipo != 'Celular';

UPDATE public.contato_meios_contato
SET tipo = 'Telefone'
WHERE LOWER(tipo) = 'telefone' AND tipo != 'Telefone';