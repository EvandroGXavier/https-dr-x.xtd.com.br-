-- =========================================
-- CORREÇÃO: Adicionar tenant_id em processo_partes e corrigir triggers
-- =========================================

-- 1. Adicionar coluna tenant_id como NULLABLE
ALTER TABLE processo_partes 
ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2. Atualizar registros existentes com tenant_id baseado no user_id
UPDATE processo_partes 
SET tenant_id = user_id 
WHERE tenant_id IS NULL;

-- 3. Tornar a coluna NOT NULL
ALTER TABLE processo_partes 
ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Definir default para novos registros
ALTER TABLE processo_partes 
ALTER COLUMN tenant_id SET DEFAULT auth.uid();

-- 5. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_processo_partes_tenant 
ON processo_partes(tenant_id);

-- 6. Remover políticas antigas
DROP POLICY IF EXISTS "Users can manage their own processo_partes" ON processo_partes;
DROP POLICY IF EXISTS "Users can view their own processo_partes" ON processo_partes;
DROP POLICY IF EXISTS "Users can insert their own processo_partes" ON processo_partes;
DROP POLICY IF EXISTS "Users can update their own processo_partes" ON processo_partes;
DROP POLICY IF EXISTS "Users can delete their own processo_partes" ON processo_partes;

-- 7. Criar políticas RLS simples (sem has_role por enquanto)
CREATE POLICY "processo_partes_select_by_tenant"
ON processo_partes FOR SELECT
USING (tenant_id = auth.uid());

CREATE POLICY "processo_partes_insert_by_tenant"
ON processo_partes FOR INSERT
WITH CHECK (tenant_id = auth.uid() AND user_id = auth.uid());

CREATE POLICY "processo_partes_update_by_tenant"
ON processo_partes FOR UPDATE
USING (tenant_id = auth.uid());

CREATE POLICY "processo_partes_delete_by_tenant"
ON processo_partes FOR DELETE
USING (tenant_id = auth.uid());

-- 8. Remover triggers que referenciam cliente_principal_id
DO $$
DECLARE
    trigger_name text;
    trigger_def text;
BEGIN
    FOR trigger_name IN 
        SELECT t.tgname 
        FROM pg_trigger t
        WHERE t.tgrelid = 'processos'::regclass
          AND t.tgname NOT LIKE 'RI_%'
          AND NOT t.tgisinternal
    LOOP
        SELECT pg_get_triggerdef(oid) INTO trigger_def
        FROM pg_trigger 
        WHERE tgname = trigger_name 
          AND tgrelid = 'processos'::regclass;
        
        IF trigger_def LIKE '%cliente_principal_id%' THEN
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON processos CASCADE', trigger_name);
            RAISE NOTICE 'Trigger % removido', trigger_name;
        END IF;
    END LOOP;
END $$;