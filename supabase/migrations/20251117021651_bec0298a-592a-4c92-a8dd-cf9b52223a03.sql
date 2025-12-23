-- ============================================================================
-- CORREÇÃO: Política UPDATE para processos
-- Permite UPDATE se tenant_id (auth.uid()) corresponder
-- ============================================================================

BEGIN;

-- Remove política antiga se existir
DROP POLICY IF EXISTS "processos_update_policy" ON processos;

-- Cria política correta de UPDATE
CREATE POLICY "processos_update_policy" ON processos
  FOR UPDATE
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

COMMIT;