-- ============================================================================
-- MIGRAÇÃO: Otimização contatos_v2 - Parte 1 (Preparação)
-- ============================================================================

-- 1. Remover TODOS os índices de unicidade antigos
DROP INDEX IF EXISTS public.uq_contatos_v2_cpf_tenant CASCADE;
DROP INDEX IF EXISTS public.uq_contatos_v2_cnpj_tenant CASCADE;
DROP INDEX IF EXISTS public.uniq_contatos_v2_cpf_cnpj_tenant CASCADE;

-- 2. Criar função de limpeza
CREATE OR REPLACE FUNCTION public.clean_cpf_cnpj(value text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(COALESCE(value, ''), '[^0-9]', '', 'g');
$$;

-- 3. Limpar formatos
UPDATE public.contatos_v2
SET cpf_cnpj = clean_cpf_cnpj(cpf_cnpj)
WHERE cpf_cnpj IS NOT NULL 
  AND cpf_cnpj != ''
  AND cpf_cnpj ~ '[^0-9]';

-- 4. Identificar e marcar duplicatas (manter apenas o mais recente)
WITH ranked AS (
  SELECT 
    id,
    tenant_id,
    cpf_cnpj,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, cpf_cnpj 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM public.contatos_v2
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != ''
)
UPDATE public.contatos_v2 c
SET cpf_cnpj = c.cpf_cnpj || '_DUP_' || c.id::text,
    observacao = COALESCE(c.observacao || E'\n', '') || '[DUPLICATA] CPF/CNPJ duplicado foi renomeado automaticamente em ' || now()::date::text
FROM ranked r
WHERE c.id = r.id AND r.rn > 1;

-- 5. Consolidar tenant_id
UPDATE public.contatos_v2
SET tenant_id = user_id
WHERE tenant_id IS NULL;

-- 6. Consolidar nome_fantasia
UPDATE public.contatos_v2
SET nome_fantasia = COALESCE(NULLIF(nome_fantasia, ''), nome)
WHERE (nome_fantasia IS NULL OR nome_fantasia = '') 
  AND nome IS NOT NULL;

-- 7. Recriar índice de unicidade (agora sem duplicatas)
CREATE UNIQUE INDEX uniq_contatos_v2_cpf_cnpj_tenant 
ON public.contatos_v2 (tenant_id, cpf_cnpj)
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '' AND cpf_cnpj NOT LIKE '%_DUP_%';