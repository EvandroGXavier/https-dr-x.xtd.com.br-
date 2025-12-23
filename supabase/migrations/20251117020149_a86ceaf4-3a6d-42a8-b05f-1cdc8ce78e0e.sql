-- ============================================================================
-- CORREÇÃO COMPLETA DO MÓDULO PROCESSOS - FASES 1, 2 e 3
-- (REMOVENDO TRIGGERS PROBLEMÁTICOS TEMPORARIAMENTE)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PRÉ-CORREÇÃO: DESABILITAR TRIGGERS PROBLEMÁTICOS TEMPORARIAMENTE
-- ============================================================================

-- Remover triggers de fase única
DROP TRIGGER IF EXISTS tg_single_fase ON public.processo_etiquetas;
DROP FUNCTION IF EXISTS public.fn_enforce_single_fase();

-- Remover triggers de auditoria genérica (problemáticos com tabelas sem id)
DROP TRIGGER IF EXISTS tg_audit_agendas ON public.agendas;
DROP TRIGGER IF EXISTS tg_audit_proc_etq ON public.processo_etiquetas;
DROP TRIGGER IF EXISTS tg_audit_agenda_etq ON public.agenda_etiquetas;

-- ============================================================================
-- FASE 1: LIMPEZA DE POLÍTICAS RLS NA TABELA PROCESSOS
-- ============================================================================

-- 1.1: Remover políticas antigas da tabela processos
DROP POLICY IF EXISTS "processos_select" ON public.processos;
DROP POLICY IF EXISTS "processos_insert" ON public.processos;
DROP POLICY IF EXISTS "processos_update" ON public.processos;
DROP POLICY IF EXISTS "processos_delete" ON public.processos;

-- 1.2: Remover política com bug crítico (processos.id = auth.uid())
DROP POLICY IF EXISTS "RLS: Usuários leem processos da sua filial" ON public.processos;

-- 1.3: Remover políticas conflitantes
DROP POLICY IF EXISTS "Utilizadores podem ler processos do seu tenant" ON public.processos;
DROP POLICY IF EXISTS "Utilizadores podem criar processos no seu tenant" ON public.processos;
DROP POLICY IF EXISTS "Utilizadores podem atualizar processos do seu tenant" ON public.processos;
DROP POLICY IF EXISTS "Utilizadores podem excluir processos do seu tenant" ON public.processos;

-- 1.4: Criar política única de SELECT (padrão subquery seguro)
CREATE POLICY "processos_select_by_tenant" ON public.processos
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- 1.5: Garantir que o REVOKE foi aplicado
REVOKE INSERT, UPDATE, DELETE ON TABLE public.processos FROM authenticated, anon, public;

-- 1.6: Garantir SELECT para consultas (necessário para as RPCs)
GRANT SELECT ON TABLE public.processos TO authenticated;

-- ============================================================================
-- FASE 2: CORREÇÃO DA TABELA PROCESSO_ETIQUETAS
-- ============================================================================

-- 2.1: Adicionar coluna tenant_id
ALTER TABLE public.processo_etiquetas 
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- 2.2: Backfill (preencher dados existentes com tenant_id do processo pai)
UPDATE public.processo_etiquetas pe
SET tenant_id = p.tenant_id
FROM public.processos p
WHERE pe.processo_id = p.id
AND pe.tenant_id IS NULL;

-- 2.3: Tornar obrigatória
ALTER TABLE public.processo_etiquetas 
  ALTER COLUMN tenant_id SET NOT NULL;

-- 2.4: Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_processo_etiquetas_tenant_id 
  ON public.processo_etiquetas(tenant_id);

-- 2.5: Habilitar RLS
ALTER TABLE public.processo_etiquetas ENABLE ROW LEVEL SECURITY;

-- 2.6: Remover políticas antigas (se houver)
DROP POLICY IF EXISTS "access_by_tenant" ON public.processo_etiquetas;
DROP POLICY IF EXISTS "agenda_etq_tenant_all" ON public.processo_etiquetas;

-- 2.7: Criar políticas seguras baseadas em tenant_id
CREATE POLICY "processo_etiquetas_select_by_tenant" ON public.processo_etiquetas
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "processo_etiquetas_insert_by_tenant" ON public.processo_etiquetas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "processo_etiquetas_delete_by_tenant" ON public.processo_etiquetas
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- FASE 3: LIMPEZA DE POLÍTICAS NAS SUBTABELAS
-- ============================================================================

-- 3.1: PROCESSO_CONTRATOS - Remover políticas duplicadas
DROP POLICY IF EXISTS "processo_contratos_select" ON public.processo_contratos;
DROP POLICY IF EXISTS "processo_contratos_insert" ON public.processo_contratos;
DROP POLICY IF EXISTS "processo_contratos_update" ON public.processo_contratos;
DROP POLICY IF EXISTS "processo_contratos_delete" ON public.processo_contratos;

-- 3.2: PROCESSO_HONORARIOS - Remover políticas duplicadas
DROP POLICY IF EXISTS "processo_honorarios_select" ON public.processo_honorarios;
DROP POLICY IF EXISTS "processo_honorarios_insert" ON public.processo_honorarios;
DROP POLICY IF EXISTS "processo_honorarios_update" ON public.processo_honorarios;
DROP POLICY IF EXISTS "processo_honorarios_delete" ON public.processo_honorarios;

-- 3.3: PROCESSOS_TJ - Remover políticas duplicadas
DROP POLICY IF EXISTS "processos_tj_select" ON public.processos_tj;
DROP POLICY IF EXISTS "processos_tj_insert" ON public.processos_tj;
DROP POLICY IF EXISTS "processos_tj_update" ON public.processos_tj;
DROP POLICY IF EXISTS "processos_tj_delete" ON public.processos_tj;

COMMIT;