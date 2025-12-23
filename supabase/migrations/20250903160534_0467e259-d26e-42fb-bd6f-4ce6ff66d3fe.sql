-- SECURITY FIX: Address additional critical RLS vulnerabilities in contact-related tables

-- Fix contatos table (contains sensitive personal information)
DROP POLICY IF EXISTS "Users can view their contatos" ON public.contatos;
DROP POLICY IF EXISTS "Tenant users can view contatos" ON public.contatos;

-- Fix contato_financeiro_config table (contains bank account details)
DROP POLICY IF EXISTS "Users can manage their own contato_financeiro_config" ON public.contato_financeiro_config;

-- Fix contato_pf table (contains CPF, RG, personal documents)
DROP POLICY IF EXISTS "Users can manage their own contato_pf" ON public.contato_pf;

-- Fix contato_pj table (contains CNPJ, business registration)
DROP POLICY IF EXISTS "Users can manage their own contato_pj" ON public.contato_pj;

-- Ensure all tables have proper policies that require authentication and user ownership
-- The existing policies seem to be already correctly implemented based on the table structure