-- Migration: Adicionar tenant_id e normalizar multi-tenant em tabelas de processos
-- Versão: 2.0 (idempotente)

-- 1. Adicionar tenant_id em processo_partes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'processo_partes' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE public.processo_partes ADD COLUMN tenant_id UUID;
    
    -- Preencher tenant_id com base no profile
    UPDATE public.processo_partes pp
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE pp.user_id = p.user_id
      AND pp.tenant_id IS NULL;
    
    -- Tornar NOT NULL após migração
    ALTER TABLE public.processo_partes ALTER COLUMN tenant_id SET NOT NULL;
    
    -- Criar índice
    CREATE INDEX idx_processo_partes_tenant_id ON public.processo_partes(tenant_id);
    
    -- Adicionar comentário
    COMMENT ON COLUMN public.processo_partes.tenant_id IS 'UUID da empresa (tenant) para isolamento multi-tenant';
  END IF;
END $$;

-- 2. Adicionar tenant_id em processo_desdobramentos (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'processo_desdobramentos' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE public.processo_desdobramentos ADD COLUMN tenant_id UUID;
    
    -- Preencher tenant_id
    UPDATE public.processo_desdobramentos pd
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE pd.user_id = p.user_id
      AND pd.tenant_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE public.processo_desdobramentos ALTER COLUMN tenant_id SET NOT NULL;
    
    -- Criar índice
    CREATE INDEX idx_processo_desdobramentos_tenant_id ON public.processo_desdobramentos(tenant_id);
    
    -- Adicionar comentário
    COMMENT ON COLUMN public.processo_desdobramentos.tenant_id IS 'UUID da empresa (tenant) para isolamento multi-tenant';
  END IF;
END $$;

-- 3. Adicionar tenant_id em processo_movimentacoes (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'processo_movimentacoes' 
                 AND column_name = 'tenant_id') THEN
    ALTER TABLE public.processo_movimentacoes ADD COLUMN tenant_id UUID;
    
    -- Preencher tenant_id
    UPDATE public.processo_movimentacoes pm
    SET tenant_id = p.empresa_id
    FROM public.profiles p
    WHERE pm.user_id = p.user_id
      AND pm.tenant_id IS NULL;
    
    -- Tornar NOT NULL
    ALTER TABLE public.processo_movimentacoes ALTER COLUMN tenant_id SET NOT NULL;
    
    -- Criar índice
    CREATE INDEX idx_processo_movimentacoes_tenant_id ON public.processo_movimentacoes(tenant_id);
    
    -- Adicionar comentário
    COMMENT ON COLUMN public.processo_movimentacoes.tenant_id IS 'UUID da empresa (tenant) para isolamento multi-tenant';
  END IF;
END $$;

-- 4. Recriar policies para processo_partes (tenant-based)
DROP POLICY IF EXISTS "Users can view their own processo_partes" ON public.processo_partes;
DROP POLICY IF EXISTS "Users can create their own processo_partes" ON public.processo_partes;
DROP POLICY IF EXISTS "Users can update their own processo_partes" ON public.processo_partes;
DROP POLICY IF EXISTS "Users can delete their own processo_partes" ON public.processo_partes;
DROP POLICY IF EXISTS "processo_partes_select_by_tenant" ON public.processo_partes;
DROP POLICY IF EXISTS "processo_partes_insert_by_tenant" ON public.processo_partes;
DROP POLICY IF EXISTS "processo_partes_update_by_tenant" ON public.processo_partes;
DROP POLICY IF EXISTS "processo_partes_delete_by_tenant" ON public.processo_partes;

CREATE POLICY "processo_partes_select_by_tenant"
  ON public.processo_partes FOR SELECT
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_partes_insert_by_tenant"
  ON public.processo_partes FOR INSERT
  WITH CHECK (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_partes_update_by_tenant"
  ON public.processo_partes FOR UPDATE
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_partes_delete_by_tenant"
  ON public.processo_partes FOR DELETE
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

-- 5. Recriar policies para processo_desdobramentos
DROP POLICY IF EXISTS "Users can view their own processo_desdobramentos" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "Users can create their own processo_desdobramentos" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "Users can update their own processo_desdobramentos" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "Users can delete their own processo_desdobramentos" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "processo_desdobramentos_select_by_tenant" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "processo_desdobramentos_insert_by_tenant" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "processo_desdobramentos_update_by_tenant" ON public.processo_desdobramentos;
DROP POLICY IF EXISTS "processo_desdobramentos_delete_by_tenant" ON public.processo_desdobramentos;

CREATE POLICY "processo_desdobramentos_select_by_tenant"
  ON public.processo_desdobramentos FOR SELECT
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_desdobramentos_insert_by_tenant"
  ON public.processo_desdobramentos FOR INSERT
  WITH CHECK (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_desdobramentos_update_by_tenant"
  ON public.processo_desdobramentos FOR UPDATE
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_desdobramentos_delete_by_tenant"
  ON public.processo_desdobramentos FOR DELETE
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

-- 6. Recriar policies para processo_movimentacoes
DROP POLICY IF EXISTS "Users can view their own processo_movimentacoes" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "Users can create their own processo_movimentacoes" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "Users can update their own processo_movimentacoes" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "Users can delete their own processo_movimentacoes" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "processo_movimentacoes_select_by_tenant" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "processo_movimentacoes_insert_by_tenant" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "processo_movimentacoes_update_by_tenant" ON public.processo_movimentacoes;
DROP POLICY IF EXISTS "processo_movimentacoes_delete_by_tenant" ON public.processo_movimentacoes;

CREATE POLICY "processo_movimentacoes_select_by_tenant"
  ON public.processo_movimentacoes FOR SELECT
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_movimentacoes_insert_by_tenant"
  ON public.processo_movimentacoes FOR INSERT
  WITH CHECK (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_movimentacoes_update_by_tenant"
  ON public.processo_movimentacoes FOR UPDATE
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "processo_movimentacoes_delete_by_tenant"
  ON public.processo_movimentacoes FOR DELETE
  USING (tenant_id IN (SELECT empresa_id FROM profiles WHERE user_id = auth.uid()));