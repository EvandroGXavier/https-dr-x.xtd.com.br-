-- Fix saas_convites to use UUID for empresa_id and filial_id
-- This aligns with the saas_empresas and saas_filiais UUID schema

BEGIN;

-- Check if saas_convites table exists and has the old integer columns
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'saas_convites'
  ) THEN
    -- Drop existing columns if they exist
    ALTER TABLE public.saas_convites
    DROP COLUMN IF EXISTS empresa_id CASCADE,
    DROP COLUMN IF EXISTS filial_id CASCADE;

    -- Add new UUID columns
    ALTER TABLE public.saas_convites
    ADD COLUMN empresa_id uuid,
    ADD COLUMN filial_id uuid;

    -- Add Foreign Key constraints
    ALTER TABLE public.saas_convites
    ADD CONSTRAINT fk_saas_convites_empresa
        FOREIGN KEY (empresa_id)
        REFERENCES public.saas_empresas(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

    ALTER TABLE public.saas_convites
    ADD CONSTRAINT fk_saas_convites_filial
        FOREIGN KEY (filial_id)
        REFERENCES public.saas_filiais(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;

    -- Add indexes for performance
    CREATE INDEX IF NOT EXISTS idx_saas_convites_empresa_id ON public.saas_convites(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_saas_convites_filial_id ON public.saas_convites(filial_id);
  END IF;
END $$;

COMMIT;