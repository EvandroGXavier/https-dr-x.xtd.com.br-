-- ============================================================================
-- MIGRAÇÃO: Hardening Módulo Contatos V2 para Produção (CORRIGIDA)
-- Data: 2025-11-14
-- Objetivo: Corrigir RLS, multi-tenant, auditoria e consistência
-- ============================================================================

-- ============================================================================
-- ETAPA 0: REMOVER CONSTRAINT INCORRETA
-- ============================================================================
-- A constraint tenant_id_fkey -> users está incorreta para multi-tenant por empresa
ALTER TABLE public.contatos_v2
  DROP CONSTRAINT IF EXISTS contatos_v2_tenant_id_fkey;

-- ============================================================================
-- ETAPA 1: PADRONIZAR TENANT_ID  
-- ============================================================================
-- Definição: tenant_id = empresa_id (multi-tenant isolado por empresa)
-- Nota: user_id continua sendo o usuário que criou/alterou

-- 1.1 Garantir que tenant_id está populado corretamente
-- Se ainda houver registros com tenant_id = user_id, precisamos corrigir para empresa_id
UPDATE public.contatos_v2 SET
  tenant_id = COALESCE(empresa_id, tenant_id)
WHERE tenant_id IS NOT NULL AND empresa_id IS NOT NULL AND tenant_id != empresa_id;

-- 1.2 Para contatos sem empresa_id, buscar do profile do user_id
UPDATE public.contatos_v2 c SET
  empresa_id = p.empresa_id,
  filial_id = p.filial_id,
  tenant_id = p.empresa_id
FROM public.profiles p
WHERE c.user_id = p.user_id
  AND c.empresa_id IS NULL
  AND p.empresa_id IS NOT NULL;

-- ============================================================================
-- ETAPA 2: RLS POR TENANT (MULTI-TENANT CORRETO)
-- ============================================================================

-- 2.1 Dropar policies antigas e inconsistentes
DROP POLICY IF EXISTS contatos_v2_full_access ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_user_access_optimized ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_tenant_access ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_simple_access ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can view their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can create their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can update their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can delete their own contatos_v2" ON public.contatos_v2;

-- 2.2 Criar policies granulares por tenant
CREATE POLICY contatos_v2_select_by_tenant ON public.contatos_v2
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  );

CREATE POLICY contatos_v2_insert_by_tenant ON public.contatos_v2
  FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY contatos_v2_update_by_tenant ON public.contatos_v2
  FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  );

CREATE POLICY contatos_v2_delete_by_tenant ON public.contatos_v2
  FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  );

-- ============================================================================
-- ETAPA 3: RLS TABELAS RELACIONADAS (ALINHAMENTO)
-- ============================================================================

-- 3.1 contato_enderecos
DROP POLICY IF EXISTS tenant_access_enderecos ON public.contato_enderecos;

CREATE POLICY contato_enderecos_by_tenant ON public.contato_enderecos
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3.2 contato_meios_contato (CRÍTICO para telefonia)
DROP POLICY IF EXISTS "Users can view their own contato_meios_contato" ON public.contato_meios_contato;
DROP POLICY IF EXISTS "Users can insert contato_meios_contato for their own contacts" ON public.contato_meios_contato;
DROP POLICY IF EXISTS "Users can update contato_meios_contato for their own contacts" ON public.contato_meios_contato;
DROP POLICY IF EXISTS "Users can delete contato_meios_contato for their own contacts" ON public.contato_meios_contato;

CREATE POLICY contato_meios_contato_by_tenant ON public.contato_meios_contato
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3.3 contato_pf
DROP POLICY IF EXISTS tenant_access_pf ON public.contato_pf;

CREATE POLICY contato_pf_by_tenant ON public.contato_pf
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3.4 contato_pj
DROP POLICY IF EXISTS tenant_access_pj ON public.contato_pj;

CREATE POLICY contato_pj_by_tenant ON public.contato_pj
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3.5 contato_financeiro_config
DROP POLICY IF EXISTS tenant_access_financeiro_config ON public.contato_financeiro_config;

CREATE POLICY contato_financeiro_config_by_tenant ON public.contato_financeiro_config
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- 3.6 contato_patrimonios
DROP POLICY IF EXISTS patrimonios_select_by_tenant ON public.contato_patrimonios;
DROP POLICY IF EXISTS patrimonios_insert_by_tenant ON public.contato_patrimonios;
DROP POLICY IF EXISTS patrimonios_update_by_tenant ON public.contato_patrimonios;
DROP POLICY IF EXISTS patrimonios_delete_by_tenant ON public.contato_patrimonios;

CREATE POLICY contato_patrimonios_by_tenant ON public.contato_patrimonios
  FOR ALL
  TO authenticated
  USING (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
    OR has_role('admin'::app_role)
  )
  WITH CHECK (
    tenant_id IN (
      SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ETAPA 4: FUNÇÃO RPC DE EXCLUSÃO SEGURA (COM AUDITORIA)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.excluir_contato_seguro(p_contato_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_empresa_id UUID;
  v_contato RECORD;
BEGIN
  -- 1. Validar autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 2. Obter empresa do usuário
  SELECT empresa_id INTO v_empresa_id FROM profiles WHERE user_id = v_user_id;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa configurada';
  END IF;

  -- 3. Verificar se contato existe e pertence ao tenant
  SELECT * INTO v_contato FROM contatos_v2
  WHERE id = p_contato_id AND tenant_id = v_empresa_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contato não encontrado ou sem permissão';
  END IF;

  -- 4. Auditoria ANTES da exclusão
  INSERT INTO security_audit_log (
    actor, action, target, module, tenant_id, timestamp, payload
  ) VALUES (
    v_user_id,
    'contact_deleted',
    p_contato_id::TEXT,
    'contatos',
    v_empresa_id,
    NOW(),
    jsonb_build_object(
      'contato_id', v_contato.id,
      'nome_fantasia', v_contato.nome_fantasia,
      'cpf_cnpj', v_contato.cpf_cnpj
    )
  );

  -- 5. Excluir registros relacionados (cascade manual para auditoria)
  DELETE FROM contato_enderecos WHERE contato_id = p_contato_id;
  DELETE FROM contato_meios_contato WHERE contato_id = p_contato_id;
  DELETE FROM contato_pf WHERE contato_id = p_contato_id;
  DELETE FROM contato_pj WHERE contato_id = p_contato_id;
  DELETE FROM contato_financeiro_config WHERE contato_id = p_contato_id;
  DELETE FROM contato_patrimonios WHERE contato_id = p_contato_id;
  DELETE FROM etiqueta_vinculos WHERE referencia_tipo = 'contatos' AND referencia_id = p_contato_id;

  -- 6. Excluir contato principal
  DELETE FROM contatos_v2 WHERE id = p_contato_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'contato_id', p_contato_id,
    'message', 'Contato excluído com sucesso'
  );
END;
$$;

COMMENT ON FUNCTION public.excluir_contato_seguro IS 
'Exclui contato e registros relacionados com auditoria completa. Respeita isolamento por tenant.';

-- ============================================================================
-- ETAPA 5: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================
COMMENT ON TABLE public.contatos_v2 IS 
'Cadastro de contatos (clientes, partes, fornecedores). Multi-tenant por empresa_id = tenant_id.';

COMMENT ON COLUMN public.contatos_v2.tenant_id IS 
'Isolamento multi-tenant. DEVE ser igual a empresa_id. Usado nas policies RLS.';

COMMENT ON COLUMN public.contatos_v2.user_id IS 
'Usuário que criou o contato. Usado para auditoria, NÃO para RLS.';

COMMENT ON COLUMN public.contatos_v2.empresa_id IS 
'Empresa proprietária do contato. Base do isolamento multi-tenant.';

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================