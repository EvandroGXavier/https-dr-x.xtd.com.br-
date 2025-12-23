-- 1) Clean up existing cpf_cnpj data to only have valid formats
UPDATE public.contatos_v2 
SET cpf_cnpj = NULL 
WHERE cpf_cnpj IS NOT NULL 
  AND LENGTH(REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g')) NOT IN (11, 14);

-- 2) Backfill required fields
UPDATE public.contatos_v2
SET nome_fantasia = COALESCE(NULLIF(TRIM(nome_fantasia), ''), 'Sem nome')
WHERE nome_fantasia IS NULL OR TRIM(nome_fantasia) = '';

UPDATE public.contatos_v2
SET celular = COALESCE(NULLIF(TRIM(celular), ''), '00000000000')
WHERE celular IS NULL OR TRIM(celular) = '';

-- 3) Set NOT NULL constraints
ALTER TABLE public.contatos_v2
  ALTER COLUMN nome_fantasia SET NOT NULL,
  ALTER COLUMN celular SET NOT NULL;

-- 4) Create useful indexes
CREATE INDEX IF NOT EXISTS idx_contatos_v2_tenant_nome ON public.contatos_v2(user_id, nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_contatos_v2_cpf_cnpj ON public.contatos_v2(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;