
-- =====================================================
-- Migração Segura: Migrar saas_empresas e saas_filiais para UUID
-- =====================================================

-- Etapa 1: Adicionar colunas UUID sem constraint ainda
DO $$ 
BEGIN
  -- saas_empresas: adicionar uuid_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'saas_empresas' AND column_name = 'uuid_id'
  ) THEN
    ALTER TABLE public.saas_empresas ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE;
  END IF;

  -- saas_filiais: adicionar uuid_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'saas_filiais' AND column_name = 'uuid_id'
  ) THEN
    ALTER TABLE public.saas_filiais ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE;
  END IF;

  -- saas_filiais: adicionar empresa_uuid (sem NOT NULL ainda)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'saas_filiais' AND column_name = 'empresa_uuid_new'
  ) THEN
    ALTER TABLE public.saas_filiais ADD COLUMN empresa_uuid_new UUID;
  END IF;
END $$;

-- Etapa 2: Popular empresa_uuid_new com os UUIDs corretos
UPDATE public.saas_filiais f
SET empresa_uuid_new = e.uuid_id
FROM public.saas_empresas e
WHERE f.empresa_id = e.id;

-- Etapa 3: Verificar se todos os registros foram populados
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM public.saas_filiais
  WHERE empresa_uuid_new IS NULL;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Existem % filiais sem empresa_uuid_new definido', missing_count;
  END IF;
END $$;

-- Etapa 4: Tornar empresa_uuid_new NOT NULL
ALTER TABLE public.saas_filiais ALTER COLUMN empresa_uuid_new SET NOT NULL;

-- Etapa 5: Criar índice e FK para empresa_uuid_new
CREATE INDEX IF NOT EXISTS saas_filiais_empresa_uuid_new_idx ON public.saas_filiais(empresa_uuid_new);

ALTER TABLE public.saas_filiais 
  DROP CONSTRAINT IF EXISTS saas_filiais_empresa_uuid_new_fkey;

ALTER TABLE public.saas_filiais 
  ADD CONSTRAINT saas_filiais_empresa_uuid_new_fkey 
  FOREIGN KEY (empresa_uuid_new) 
  REFERENCES public.saas_empresas(uuid_id) 
  ON DELETE CASCADE;

-- Etapa 6: Remover antiga FK INTEGER
ALTER TABLE public.saas_filiais 
  DROP CONSTRAINT IF EXISTS saas_filiais_empresa_id_fkey;

-- Etapa 7: Renomear colunas para o padrão final
-- Em saas_empresas
ALTER TABLE public.saas_empresas DROP CONSTRAINT IF EXISTS saas_empresas_pkey CASCADE;
ALTER TABLE public.saas_empresas RENAME COLUMN id TO id_int_legacy;
ALTER TABLE public.saas_empresas RENAME COLUMN uuid_id TO id;
ALTER TABLE public.saas_empresas ADD PRIMARY KEY (id);
CREATE INDEX IF NOT EXISTS saas_empresas_id_int_legacy_idx ON public.saas_empresas(id_int_legacy);

-- Em saas_filiais  
ALTER TABLE public.saas_filiais DROP CONSTRAINT IF EXISTS saas_filiais_pkey CASCADE;
ALTER TABLE public.saas_filiais RENAME COLUMN id TO id_int_legacy;
ALTER TABLE public.saas_filiais RENAME COLUMN uuid_id TO id;
ALTER TABLE public.saas_filiais RENAME COLUMN empresa_id TO empresa_id_int_legacy;
ALTER TABLE public.saas_filiais RENAME COLUMN empresa_uuid_new TO empresa_id;
ALTER TABLE public.saas_filiais ADD PRIMARY KEY (id);

-- Recriar FK com nome correto
ALTER TABLE public.saas_filiais 
  DROP CONSTRAINT IF EXISTS saas_filiais_empresa_uuid_new_fkey;
  
ALTER TABLE public.saas_filiais 
  ADD CONSTRAINT saas_filiais_empresa_id_fkey 
  FOREIGN KEY (empresa_id) 
  REFERENCES public.saas_empresas(id) 
  ON DELETE CASCADE;

-- Etapa 8: Atualizar saas_assinaturas se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saas_assinaturas') THEN
    -- Adicionar coluna temporária
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'saas_assinaturas' AND column_name = 'empresa_uuid_new'
    ) THEN
      ALTER TABLE public.saas_assinaturas ADD COLUMN empresa_uuid_new UUID;
      
      -- Popular baseando-se no id_int_legacy
      UPDATE public.saas_assinaturas a
      SET empresa_uuid_new = e.id
      FROM public.saas_empresas e
      WHERE a.empresa_id IS NOT NULL AND e.id_int_legacy::text = a.empresa_id::text;
      
      -- Remover FK antiga
      ALTER TABLE public.saas_assinaturas DROP CONSTRAINT IF EXISTS saas_assinaturas_empresa_id_fkey;
      
      -- Renomear
      ALTER TABLE public.saas_assinaturas RENAME COLUMN empresa_id TO empresa_id_int_legacy;
      ALTER TABLE public.saas_assinaturas RENAME COLUMN empresa_uuid_new TO empresa_id;
      
      -- Criar nova FK
      ALTER TABLE public.saas_assinaturas 
        ADD CONSTRAINT saas_assinaturas_empresa_id_fkey 
        FOREIGN KEY (empresa_id) 
        REFERENCES public.saas_empresas(id) 
        ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Etapa 9: Atualizar saas_planos se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saas_planos') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'saas_planos' AND column_name = 'id' AND data_type = 'integer'
    ) THEN
      ALTER TABLE public.saas_planos DROP CONSTRAINT IF EXISTS saas_planos_pkey CASCADE;
      ALTER TABLE public.saas_planos ADD COLUMN uuid_id UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE;
      ALTER TABLE public.saas_planos RENAME COLUMN id TO id_int_legacy;
      ALTER TABLE public.saas_planos RENAME COLUMN uuid_id TO id;
      ALTER TABLE public.saas_planos ADD PRIMARY KEY (id);
    END IF;
  END IF;
END $$;

-- Comentários sobre colunas legadas
COMMENT ON COLUMN public.saas_empresas.id_int_legacy IS 'ID inteiro legado - Será removido em migração futura';
COMMENT ON COLUMN public.saas_filiais.id_int_legacy IS 'ID inteiro legado - Será removido em migração futura';
COMMENT ON COLUMN public.saas_filiais.empresa_id_int_legacy IS 'FK integer legada - Será removida em migração futura';
