-- Fix profiles saas FK to use UUID instead of integer
-- This aligns profiles.empresa_id and filial_id with saas_empresas and saas_filiais UUID schema

BEGIN;

-- 1. Drop existing integer columns (and their invalid data)
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS empresa_id,
DROP COLUMN IF EXISTS filial_id;

-- 2. Add new UUID columns
ALTER TABLE public.profiles
ADD COLUMN empresa_id uuid,
ADD COLUMN filial_id uuid;

-- 3. Add Foreign Key constraints for referential integrity
ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_empresa
    FOREIGN KEY (empresa_id)
    REFERENCES public.saas_empresas(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE public.profiles
ADD CONSTRAINT fk_profiles_filial
    FOREIGN KEY (filial_id)
    REFERENCES public.saas_filiais(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- 4. Add index for performance on tenant queries
CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON public.profiles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_profiles_filial_id ON public.profiles(filial_id);

COMMIT;