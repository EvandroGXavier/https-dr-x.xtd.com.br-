-- Migration: Remove VIEW legada contatos
-- 
-- Esta migration remove a VIEW de compatibilidade 'contatos' que foi criada
-- para manter compatibilidade com código antigo durante a transição para 'contatos_v2'.
-- Esta ação finaliza a migração para a nova estrutura, eliminando ambiguidades
-- e consolidando o uso exclusivo da nova arquitetura de dados.
--
-- A tabela 'contatos_v2' já possui todas as políticas de RLS apropriadas baseadas no user_id,
-- garantindo a segurança e o isolamento dos dados por tenant.
--
-- O uso de CASCADE garante que todos os objetos dependentes da VIEW também serão removidos.

DROP VIEW IF EXISTS public.contatos CASCADE;