-- Remover id_int de saas_assinaturas que ainda está presente
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'saas_assinaturas' 
    AND column_name = 'id_int'
  ) THEN
    ALTER TABLE public.saas_assinaturas DROP COLUMN id_int CASCADE;
    RAISE NOTICE 'Coluna id_int removida de saas_assinaturas';
  END IF;
END $$;