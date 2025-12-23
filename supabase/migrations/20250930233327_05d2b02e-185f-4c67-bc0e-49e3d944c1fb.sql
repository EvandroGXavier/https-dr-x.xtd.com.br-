-- Migration: Remove tabela obsoleta contas_wa
-- 
-- Esta migration remove a tabela legada 'contas_wa' que não segue a padronização 'wa_*'
-- do módulo de WhatsApp. A tabela correta (wa_contas) já está em uso e possui as
-- políticas de RLS apropriadas para garantir a segurança dos dados por tenant.
--
-- Esta limpeza faz parte da finalização da padronização do módulo de WhatsApp,
-- conforme o diagnóstico de código realizado.

DROP TABLE IF EXISTS public.contas_wa CASCADE;