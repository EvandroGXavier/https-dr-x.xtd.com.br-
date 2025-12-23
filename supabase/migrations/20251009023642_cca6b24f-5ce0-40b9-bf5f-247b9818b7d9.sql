
-- Migration: Remover campos pessoa_tipo e tipo_pessoa da tabela contatos_v2

-- 1. Remover views dependentes primeiro
DROP VIEW IF EXISTS public.vw_contatos_completo CASCADE;
DROP VIEW IF EXISTS public.vw_contatos_pt CASCADE;

-- 2. Remover trigger
DROP TRIGGER IF EXISTS trigger_set_tipo_pessoa ON public.contatos_v2;

-- 3. Remover função associada
DROP FUNCTION IF EXISTS public.set_tipo_pessoa_contatos_v2() CASCADE;

-- 4. Excluir coluna pessoa_tipo
ALTER TABLE public.contatos_v2 
DROP COLUMN IF EXISTS pessoa_tipo CASCADE;

-- 5. Excluir coluna tipo_pessoa
ALTER TABLE public.contatos_v2 
DROP COLUMN IF EXISTS tipo_pessoa CASCADE;

-- 6. Recriar view vw_contatos_completo sem os campos removidos
CREATE OR REPLACE VIEW public.vw_contatos_completo AS
SELECT 
  c.*,
  CASE 
    WHEN length(regexp_replace(c.cpf_cnpj, '[^0-9]', '', 'g')) = 11 THEN 'pf'
    WHEN length(regexp_replace(c.cpf_cnpj, '[^0-9]', '', 'g')) = 14 THEN 'pj'
    ELSE 'lead'
  END as tipo_deduzido,
  COALESCE(c.nome_fantasia, c.nome) as nome_display
FROM public.contatos_v2 c;

-- Log da operação
COMMENT ON TABLE public.contatos_v2 IS 'Tabela de contatos otimizada - campos pessoa_tipo e tipo_pessoa removidos';
COMMENT ON VIEW public.vw_contatos_completo IS 'View com tipo deduzido do cpf_cnpj';
