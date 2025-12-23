-- Passo 1: Adicionar colunas V2
ALTER TABLE public.processos
ADD COLUMN IF NOT EXISTS titulo TEXT,
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS local TEXT,
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Passo 2: Popular tenant_id para TODOS os registros
UPDATE public.processos p
SET tenant_id = COALESCE(
  (SELECT prof.current_empresa_uuid FROM public.profiles prof WHERE prof.id = p.user_id),
  p.user_id -- Fallback: usa o próprio user_id se não encontrar perfil
);

-- Passo 3: Popular títulos
UPDATE public.processos 
SET titulo = COALESCE(
  NULLIF(TRIM(titulo), ''),
  NULLIF(TRIM(assunto_principal), ''),
  'Processo sem título'
);

-- Passo 4: Tornar colunas NOT NULL apenas APÓS popular
ALTER TABLE public.processos
ALTER COLUMN titulo SET DEFAULT 'Processo sem título',
ALTER COLUMN titulo SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN tenant_id SET NOT NULL;