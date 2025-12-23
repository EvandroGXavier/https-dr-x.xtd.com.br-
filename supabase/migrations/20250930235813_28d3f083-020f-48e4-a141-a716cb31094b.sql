-- Remove a tabela obsoleta 'wa_accounts' que não segue o padrão de nomenclatura PT-BR.
-- Esta ação finaliza a limpeza do módulo WhatsApp e consolida o uso exclusivo de 'wa_contas'.
-- A tabela 'wa_accounts' foi substituída por 'wa_contas' seguindo a padronização de nomenclatura em português.
DROP TABLE IF EXISTS public.wa_accounts CASCADE;