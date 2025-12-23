-- =============================================================================
-- PROCESSOS MULTI-TENANT HARDENING - FASE 2
-- Data: 2025-11-16
-- Objetivo: Adicionar tenant_id às tabelas restantes do módulo Processos
-- =============================================================================

DO $$ 
BEGIN
  -- ============================================================
  -- TABELA: processo_contratos
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processo_contratos' 
      AND column_name = 'tenant_id'
  ) THEN
    -- 1. Adicionar coluna
    ALTER TABLE public.processo_contratos ADD COLUMN tenant_id UUID;
    
    -- 2. Preencher dados existentes
    UPDATE public.processo_contratos pc
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE pc.user_id = p.user_id
      AND pc.tenant_id IS NULL;
    
    -- 3. Tornar NOT NULL
    ALTER TABLE public.processo_contratos 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    -- 4. Criar índice
    CREATE INDEX idx_processo_contratos_tenant_id 
    ON public.processo_contratos(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processo_contratos';
  END IF;

  -- ============================================================
  -- TABELA: processo_contrato_itens
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processo_contrato_itens' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processo_contrato_itens ADD COLUMN tenant_id UUID;
    
    UPDATE public.processo_contrato_itens pci
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE pci.user_id = p.user_id
      AND pci.tenant_id IS NULL;
    
    ALTER TABLE public.processo_contrato_itens 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processo_contrato_itens_tenant_id 
    ON public.processo_contrato_itens(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processo_contrato_itens';
  END IF;

  -- ============================================================
  -- TABELA: processo_honorarios
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processo_honorarios' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processo_honorarios ADD COLUMN tenant_id UUID;
    
    UPDATE public.processo_honorarios ph
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE ph.user_id = p.user_id
      AND ph.tenant_id IS NULL;
    
    ALTER TABLE public.processo_honorarios 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processo_honorarios_tenant_id 
    ON public.processo_honorarios(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processo_honorarios';
  END IF;

  -- ============================================================
  -- TABELA: processo_honorarios_item
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processo_honorarios_item' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processo_honorarios_item ADD COLUMN tenant_id UUID;
    
    UPDATE public.processo_honorarios_item phi
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE phi.user_id = p.user_id
      AND phi.tenant_id IS NULL;
    
    ALTER TABLE public.processo_honorarios_item 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processo_honorarios_item_tenant_id 
    ON public.processo_honorarios_item(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processo_honorarios_item';
  END IF;

  -- ============================================================
  -- TABELA: processo_honorarios_parcela
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processo_honorarios_parcela' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processo_honorarios_parcela ADD COLUMN tenant_id UUID;
    
    UPDATE public.processo_honorarios_parcela php
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE php.user_id = p.user_id
      AND php.tenant_id IS NULL;
    
    ALTER TABLE public.processo_honorarios_parcela 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processo_honorarios_parcela_tenant_id 
    ON public.processo_honorarios_parcela(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processo_honorarios_parcela';
  END IF;

  -- ============================================================
  -- TABELA: processo_honorarios_eventos
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processo_honorarios_eventos' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processo_honorarios_eventos ADD COLUMN tenant_id UUID;
    
    UPDATE public.processo_honorarios_eventos phe
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE phe.user_id = p.user_id
      AND phe.tenant_id IS NULL;
    
    ALTER TABLE public.processo_honorarios_eventos 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processo_honorarios_eventos_tenant_id 
    ON public.processo_honorarios_eventos(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processo_honorarios_eventos';
  END IF;

  -- ============================================================
  -- TABELA: processos_tj
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processos_tj' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processos_tj ADD COLUMN tenant_id UUID;
    
    UPDATE public.processos_tj ptj
    SET tenant_id = pr.tenant_id
    FROM public.processos pr
    WHERE ptj.processo_id = pr.id
      AND ptj.tenant_id IS NULL;
    
    ALTER TABLE public.processos_tj 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processos_tj_tenant_id 
    ON public.processos_tj(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processos_tj';
  END IF;

  -- ============================================================
  -- TABELA: processo_vinculos
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'processos_vinculos' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.processos_vinculos ADD COLUMN tenant_id UUID;
    
    UPDATE public.processos_vinculos pv
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE pv.user_id = p.user_id
      AND pv.tenant_id IS NULL;
    
    ALTER TABLE public.processos_vinculos 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_processos_vinculos_tenant_id 
    ON public.processos_vinculos(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a processos_vinculos';
  END IF;

  -- ============================================================
  -- TABELA: andamentos_processuais
  -- ============================================================
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'andamentos_processuais' 
      AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.andamentos_processuais ADD COLUMN tenant_id UUID;
    
    UPDATE public.andamentos_processuais ap
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE ap.user_id = p.user_id
      AND ap.tenant_id IS NULL;
    
    ALTER TABLE public.andamentos_processuais 
    ALTER COLUMN tenant_id SET NOT NULL;
    
    CREATE INDEX idx_andamentos_processuais_tenant_id 
    ON public.andamentos_processuais(tenant_id);
    
    RAISE NOTICE 'tenant_id adicionado a andamentos_processuais';
  END IF;

END $$;

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processo_contratos
-- =============================================================================

DO $$
BEGIN
  -- Remover policies antigas se existirem
  DROP POLICY IF EXISTS "processo_contratos_select" ON public.processo_contratos;
  DROP POLICY IF EXISTS "processo_contratos_insert" ON public.processo_contratos;
  DROP POLICY IF EXISTS "processo_contratos_update" ON public.processo_contratos;
  DROP POLICY IF EXISTS "processo_contratos_delete" ON public.processo_contratos;
END $$;

-- Habilitar RLS
ALTER TABLE public.processo_contratos ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "processo_contratos_select" ON public.processo_contratos
FOR SELECT
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- INSERT Policy
CREATE POLICY "processo_contratos_insert" ON public.processo_contratos
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE Policy
CREATE POLICY "processo_contratos_update" ON public.processo_contratos
FOR UPDATE
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- DELETE Policy
CREATE POLICY "processo_contratos_delete" ON public.processo_contratos
FOR DELETE
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processo_contrato_itens
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processo_contrato_itens_select" ON public.processo_contrato_itens;
  DROP POLICY IF EXISTS "processo_contrato_itens_insert" ON public.processo_contrato_itens;
  DROP POLICY IF EXISTS "processo_contrato_itens_update" ON public.processo_contrato_itens;
  DROP POLICY IF EXISTS "processo_contrato_itens_delete" ON public.processo_contrato_itens;
END $$;

ALTER TABLE public.processo_contrato_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processo_contrato_itens_select" ON public.processo_contrato_itens
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_contrato_itens_insert" ON public.processo_contrato_itens
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_contrato_itens_update" ON public.processo_contrato_itens
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_contrato_itens_delete" ON public.processo_contrato_itens
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processo_honorarios
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processo_honorarios_select" ON public.processo_honorarios;
  DROP POLICY IF EXISTS "processo_honorarios_insert" ON public.processo_honorarios;
  DROP POLICY IF EXISTS "processo_honorarios_update" ON public.processo_honorarios;
  DROP POLICY IF EXISTS "processo_honorarios_delete" ON public.processo_honorarios;
END $$;

ALTER TABLE public.processo_honorarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processo_honorarios_select" ON public.processo_honorarios
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_insert" ON public.processo_honorarios
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_update" ON public.processo_honorarios
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_delete" ON public.processo_honorarios
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processo_honorarios_item
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processo_honorarios_item_select" ON public.processo_honorarios_item;
  DROP POLICY IF EXISTS "processo_honorarios_item_insert" ON public.processo_honorarios_item;
  DROP POLICY IF EXISTS "processo_honorarios_item_update" ON public.processo_honorarios_item;
  DROP POLICY IF EXISTS "processo_honorarios_item_delete" ON public.processo_honorarios_item;
END $$;

ALTER TABLE public.processo_honorarios_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processo_honorarios_item_select" ON public.processo_honorarios_item
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_item_insert" ON public.processo_honorarios_item
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_item_update" ON public.processo_honorarios_item
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_item_delete" ON public.processo_honorarios_item
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processo_honorarios_parcela
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processo_honorarios_parcela_select" ON public.processo_honorarios_parcela;
  DROP POLICY IF EXISTS "processo_honorarios_parcela_insert" ON public.processo_honorarios_parcela;
  DROP POLICY IF EXISTS "processo_honorarios_parcela_update" ON public.processo_honorarios_parcela;
  DROP POLICY IF EXISTS "processo_honorarios_parcela_delete" ON public.processo_honorarios_parcela;
END $$;

ALTER TABLE public.processo_honorarios_parcela ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processo_honorarios_parcela_select" ON public.processo_honorarios_parcela
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_parcela_insert" ON public.processo_honorarios_parcela
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_parcela_update" ON public.processo_honorarios_parcela
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_parcela_delete" ON public.processo_honorarios_parcela
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processo_honorarios_eventos
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processo_honorarios_eventos_select" ON public.processo_honorarios_eventos;
  DROP POLICY IF EXISTS "processo_honorarios_eventos_insert" ON public.processo_honorarios_eventos;
  DROP POLICY IF EXISTS "processo_honorarios_eventos_update" ON public.processo_honorarios_eventos;
  DROP POLICY IF EXISTS "processo_honorarios_eventos_delete" ON public.processo_honorarios_eventos;
END $$;

ALTER TABLE public.processo_honorarios_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processo_honorarios_eventos_select" ON public.processo_honorarios_eventos
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_eventos_insert" ON public.processo_honorarios_eventos
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_eventos_update" ON public.processo_honorarios_eventos
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_honorarios_eventos_delete" ON public.processo_honorarios_eventos
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processos_tj
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processos_tj_select" ON public.processos_tj;
  DROP POLICY IF EXISTS "processos_tj_insert" ON public.processos_tj;
  DROP POLICY IF EXISTS "processos_tj_update" ON public.processos_tj;
  DROP POLICY IF EXISTS "processos_tj_delete" ON public.processos_tj;
END $$;

ALTER TABLE public.processos_tj ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processos_tj_select" ON public.processos_tj
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processos_tj_insert" ON public.processos_tj
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processos_tj_update" ON public.processos_tj
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processos_tj_delete" ON public.processos_tj
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - processos_vinculos
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "processos_vinculos_select" ON public.processos_vinculos;
  DROP POLICY IF EXISTS "processos_vinculos_insert" ON public.processos_vinculos;
  DROP POLICY IF EXISTS "processos_vinculos_update" ON public.processos_vinculos;
  DROP POLICY IF EXISTS "processos_vinculos_delete" ON public.processos_vinculos;
END $$;

ALTER TABLE public.processos_vinculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "processos_vinculos_select" ON public.processos_vinculos
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processos_vinculos_insert" ON public.processos_vinculos
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processos_vinculos_update" ON public.processos_vinculos
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "processos_vinculos_delete" ON public.processos_vinculos
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

-- =============================================================================
-- ATUALIZAR RLS POLICIES - andamentos_processuais
-- =============================================================================

DO $$
BEGIN
  DROP POLICY IF EXISTS "andamentos_processuais_select" ON public.andamentos_processuais;
  DROP POLICY IF EXISTS "andamentos_processuais_insert" ON public.andamentos_processuais;
  DROP POLICY IF EXISTS "andamentos_processuais_update" ON public.andamentos_processuais;
  DROP POLICY IF EXISTS "andamentos_processuais_delete" ON public.andamentos_processuais;
END $$;

ALTER TABLE public.andamentos_processuais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "andamentos_processuais_select" ON public.andamentos_processuais
FOR SELECT USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "andamentos_processuais_insert" ON public.andamentos_processuais
FOR INSERT WITH CHECK (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "andamentos_processuais_update" ON public.andamentos_processuais
FOR UPDATE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "andamentos_processuais_delete" ON public.andamentos_processuais
FOR DELETE USING (tenant_id IN (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()));