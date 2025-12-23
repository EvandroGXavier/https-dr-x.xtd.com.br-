-- 1) Backfill suave (evita erro ao aplicar NOT NULL)
UPDATE public.contatos_v2
SET nome_fantasia = COALESCE(NULLIF(TRIM(nome_fantasia), ''), 'Sem nome')
WHERE nome_fantasia IS NULL OR TRIM(nome_fantasia) = '';

UPDATE public.contatos_v2
SET celular = COALESCE(NULLIF(TRIM(celular), ''), '00000000000')
WHERE celular IS NULL OR TRIM(celular) = '';

-- 2) Tornar NOT NULL
ALTER TABLE public.contatos_v2
  ALTER COLUMN nome_fantasia SET NOT NULL,
  ALTER COLUMN celular SET NOT NULL;

-- 3) Índices úteis
CREATE INDEX IF NOT EXISTS idx_contatos_v2_tenant_nome ON public.contatos_v2(user_id, nome_fantasia);
CREATE INDEX IF NOT EXISTS idx_contatos_v2_cpf_cnpj ON public.contatos_v2(cpf_cnpj);

-- 4) CHECK simples para formato numérico (apenas dígitos)
ALTER TABLE public.contatos_v2
  ADD CONSTRAINT contatos_v2_cpf_cnpj_digits_chk
  CHECK (cpf_cnpj IS NULL OR cpf_cnpj ~ '^[0-9]{11}$' OR cpf_cnpj ~ '^[0-9]{14}$');