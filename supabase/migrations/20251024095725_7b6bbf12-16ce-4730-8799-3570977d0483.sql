-- FEATURE_SAAS_UUID_V1: Refatoração completa - Parte 2 (Verificação e ajustes)
-- Esta migração verifica o estado atual e faz apenas as alterações necessárias

BEGIN;

-- 1. Verificar e criar backup das constraints existentes
DO $$
DECLARE
    v_constraint_exists boolean;
BEGIN
    -- Verificar se as constraints antigas existem antes de tentar dropar
    
    -- 2. Desabilitar RLS temporariamente
    ALTER TABLE public.saas_empresas DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_filiais DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_assinaturas DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_convites DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_planos DISABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_superadmins DISABLE ROW LEVEL SECURITY;

    -- 3. Verificar e renomear PKs apenas se necessário
    -- Para saas_empresas: renomear 'id' para 'empresa_id' se ainda não foi feito
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'saas_empresas' 
        AND column_name = 'id'
    ) THEN
        -- Dropar PK atual se existir
        ALTER TABLE public.saas_empresas DROP CONSTRAINT IF EXISTS saas_empresas_pkey;
        
        -- Renomear coluna
        ALTER TABLE public.saas_empresas RENAME COLUMN id TO empresa_id;
        
        -- Recriar PK
        ALTER TABLE public.saas_empresas ADD PRIMARY KEY (empresa_id);
        
        RAISE NOTICE 'Renamed saas_empresas.id to empresa_id';
    END IF;

    -- Para saas_filiais: renomear 'id' para 'filial_id' se ainda não foi feito
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'saas_filiais' 
        AND column_name = 'id'
    ) THEN
        -- Dropar PK atual se existir
        ALTER TABLE public.saas_filiais DROP CONSTRAINT IF EXISTS saas_filiais_pkey;
        
        -- Renomear coluna
        ALTER TABLE public.saas_filiais RENAME COLUMN id TO filial_id;
        
        -- Recriar PK
        ALTER TABLE public.saas_filiais ADD PRIMARY KEY (filial_id);
        
        RAISE NOTICE 'Renamed saas_filiais.id to filial_id';
    END IF;

    -- Para profiles: renomear 'id' para 'profile_id' se ainda não foi feito
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'id'
    ) THEN
        -- Dropar PK atual se existir
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
        
        -- Renomear coluna
        ALTER TABLE public.profiles RENAME COLUMN id TO profile_id;
        
        -- Recriar PK
        ALTER TABLE public.profiles ADD PRIMARY KEY (profile_id);
        
        RAISE NOTICE 'Renamed profiles.id to profile_id';
    END IF;

    -- Para saas_planos
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'saas_planos' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.saas_planos DROP CONSTRAINT IF EXISTS saas_planos_pkey;
        ALTER TABLE public.saas_planos RENAME COLUMN id TO plano_id;
        ALTER TABLE public.saas_planos ADD PRIMARY KEY (plano_id);
        RAISE NOTICE 'Renamed saas_planos.id to plano_id';
    END IF;

    -- Para saas_assinaturas
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'saas_assinaturas' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.saas_assinaturas DROP CONSTRAINT IF EXISTS saas_assinaturas_pkey;
        ALTER TABLE public.saas_assinaturas RENAME COLUMN id TO assinatura_id;
        ALTER TABLE public.saas_assinaturas ADD PRIMARY KEY (assinatura_id);
        RAISE NOTICE 'Renamed saas_assinaturas.id to assinatura_id';
    END IF;

    -- Para saas_convites
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'saas_convites' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.saas_convites DROP CONSTRAINT IF EXISTS saas_convites_pkey;
        ALTER TABLE public.saas_convites RENAME COLUMN id TO convite_id;
        ALTER TABLE public.saas_convites ADD PRIMARY KEY (convite_id);
        RAISE NOTICE 'Renamed saas_convites.id to convite_id';
    END IF;

    -- Para saas_superadmins
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'saas_superadmins' 
        AND column_name = 'id'
    ) THEN
        ALTER TABLE public.saas_superadmins DROP CONSTRAINT IF EXISTS saas_superadmins_pkey;
        ALTER TABLE public.saas_superadmins RENAME COLUMN id TO superadmin_id;
        ALTER TABLE public.saas_superadmins ADD PRIMARY KEY (superadmin_id);
        RAISE NOTICE 'Renamed saas_superadmins.id to superadmin_id';
    END IF;

    -- 4. Atualizar FKs existentes para apontar para as novas PKs
    -- Dropar constraints antigas se existirem
    ALTER TABLE public.saas_filiais DROP CONSTRAINT IF EXISTS fk_saas_filiais_empresa;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_empresa;
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS fk_profiles_filial;
    ALTER TABLE public.saas_assinaturas DROP CONSTRAINT IF EXISTS fk_saas_assinaturas_empresa;
    ALTER TABLE public.saas_assinaturas DROP CONSTRAINT IF EXISTS fk_saas_assinaturas_plano;
    ALTER TABLE public.saas_convites DROP CONSTRAINT IF EXISTS fk_saas_convites_empresa;
    ALTER TABLE public.saas_convites DROP CONSTRAINT IF EXISTS fk_saas_convites_filial;

    -- Recriar com os novos nomes de coluna
    ALTER TABLE public.saas_filiais 
        ADD CONSTRAINT fk_saas_filiais_empresa 
        FOREIGN KEY (empresa_id) REFERENCES public.saas_empresas(empresa_id) ON DELETE CASCADE;
        
    ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_empresa 
        FOREIGN KEY (empresa_id) REFERENCES public.saas_empresas(empresa_id) ON DELETE SET NULL;
        
    ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_filial 
        FOREIGN KEY (filial_id) REFERENCES public.saas_filiais(filial_id) ON DELETE SET NULL;
        
    ALTER TABLE public.saas_assinaturas 
        ADD CONSTRAINT fk_saas_assinaturas_empresa 
        FOREIGN KEY (empresa_id) REFERENCES public.saas_empresas(empresa_id) ON DELETE CASCADE;
        
    ALTER TABLE public.saas_convites 
        ADD CONSTRAINT fk_saas_convites_empresa 
        FOREIGN KEY (empresa_id) REFERENCES public.saas_empresas(empresa_id) ON DELETE CASCADE;
        
    ALTER TABLE public.saas_convites 
        ADD CONSTRAINT fk_saas_convites_filial 
        FOREIGN KEY (filial_id) REFERENCES public.saas_filiais(filial_id) ON DELETE CASCADE;

    ALTER TABLE public.saas_assinaturas 
        ADD CONSTRAINT fk_saas_assinaturas_plano
        FOREIGN KEY (plano_id) REFERENCES public.saas_planos(plano_id) ON DELETE RESTRICT;

    -- 5. Criar índices para performance (IF NOT EXISTS)
    CREATE INDEX IF NOT EXISTS idx_saas_filiais_empresa_id ON public.saas_filiais(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_empresa_id ON public.profiles(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_filial_id ON public.profiles(filial_id);
    CREATE INDEX IF NOT EXISTS idx_saas_assinaturas_empresa_id ON public.saas_assinaturas(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_saas_convites_empresa_id ON public.saas_convites(empresa_id);
    CREATE INDEX IF NOT EXISTS idx_saas_convites_filial_id ON public.saas_convites(filial_id);

    -- 6. Reabilitar RLS
    ALTER TABLE public.saas_empresas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_filiais ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_assinaturas ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_convites ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_planos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Migration completed successfully';
END $$;

COMMIT;