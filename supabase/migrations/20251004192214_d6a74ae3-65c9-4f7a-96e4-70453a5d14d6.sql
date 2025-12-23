-- Add missing column "matriz" to saas_filiais
ALTER TABLE public.saas_filiais
ADD COLUMN IF NOT EXISTS matriz boolean NOT NULL DEFAULT false;

-- Optional: ensure there is at most one matriz per empresa (deferrable to avoid immediate conflicts)
-- This creates a partial unique index where matriz = true
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_saas_filiais_matriz_true_per_empresa'
  ) THEN
    CREATE UNIQUE INDEX uniq_saas_filiais_matriz_true_per_empresa
      ON public.saas_filiais (empresa_id)
      WHERE matriz = true;
  END IF;
END $$;