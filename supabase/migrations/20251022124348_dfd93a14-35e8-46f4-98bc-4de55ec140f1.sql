-- =====================================================
-- Migração Final: Corrigir RPCs e Remover id_int Completamente
-- =====================================================

-- PARTE 1: Corrigir função criar_contato_transacional
-- -----------------------------------------------------
DROP FUNCTION IF EXISTS public.criar_contato_transacional(
  TEXT, TEXT, UUID, UUID, UUID, TEXT, TEXT, TEXT, JSONB
) CASCADE;

CREATE OR REPLACE FUNCTION public.criar_contato_transacional(
  p_nome_principal TEXT,
  p_classificacao TEXT DEFAULT NULL,
  p_empresa_id UUID DEFAULT NULL,
  p_filial_id UUID DEFAULT NULL,
  p_responsavel_id UUID DEFAULT NULL,
  p_tipo_pessoa TEXT DEFAULT 'lead',
  p_pessoa_tipo TEXT DEFAULT 'cliente',
  p_observacao TEXT DEFAULT NULL,
  p_meios_contato JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id UUID;
  v_user_id UUID;
  v_tenant_id UUID;
  v_meio JSONB;
  v_result JSONB;
  v_count INTEGER := 0;
BEGIN
  -- Obter user_id da sessão
  v_user_id := auth.uid();
  v_tenant_id := v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Inserir contato usando apenas colunas existentes em contatos_v2
  INSERT INTO public.contatos_v2 (
    nome_fantasia,
    classificacao,
    observacao,
    empresa_id,
    filial_id,
    responsavel_id,
    user_id,
    tenant_id,
    created_at,
    updated_at
  ) VALUES (
    p_nome_principal,
    p_classificacao,
    p_observacao,
    p_empresa_id,
    p_filial_id,
    p_responsavel_id,
    v_user_id,
    v_tenant_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_contato_id;
  
  -- Inserir meios de contato se fornecidos
  IF p_meios_contato IS NOT NULL AND jsonb_array_length(p_meios_contato) > 0 THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO public.contato_meios_contato (
        contato_id,
        tipo,
        valor,
        principal,
        empresa_id,
        filial_id,
        tenant_id,
        created_at,
        updated_at
      ) VALUES (
        v_contato_id,
        v_meio->>'tipo',
        v_meio->>'valor',
        COALESCE((v_meio->>'is_principal')::BOOLEAN, (v_meio->>'principal')::BOOLEAN, false),
        p_empresa_id,
        p_filial_id,
        v_tenant_id,
        NOW(),
        NOW()
      );
      
      v_count := v_count + 1;
    END LOOP;
  END IF;
  
  -- Log de auditoria
  PERFORM public.log_security_event(
    'contact_created_transactional',
    format('Contato criado via operação transacional: %s', p_nome_principal),
    jsonb_build_object(
      'contato_id', v_contato_id,
      'classificacao', p_classificacao,
      'meios_contato_count', v_count
    )
  );
  
  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'contato_id', v_contato_id,
    'meios_contato_criados', v_count,
    'message', 'Contato criado com sucesso'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar contato: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.criar_contato_transacional TO authenticated;

-- PARTE 2: Adicionar coluna 'codigo' opcional em saas_empresas
-- -------------------------------------------------------------
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'saas_empresas' 
    AND column_name = 'codigo'
  ) THEN
    ALTER TABLE public.saas_empresas ADD COLUMN codigo TEXT;
    COMMENT ON COLUMN public.saas_empresas.codigo IS 'Código de exibição para humanos (opcional, único por tenant quando preenchido)';
  END IF;
END $$;

-- Criar índice único parcial para codigo (só quando preenchido)
DROP INDEX IF EXISTS saas_empresas_tenant_codigo_unique_idx;
CREATE UNIQUE INDEX saas_empresas_tenant_codigo_unique_idx 
ON public.saas_empresas(tenant_id, codigo) 
WHERE codigo IS NOT NULL;

-- PARTE 3: Remover completamente todas as colunas *_id_int_legacy
-- ---------------------------------------------------------------

-- 3.1: Remover constraints e índices relacionados
ALTER TABLE public.saas_filiais DROP CONSTRAINT IF EXISTS saas_filiais_empresa_id_int_legacy_fkey;
ALTER TABLE public.saas_assinaturas DROP CONSTRAINT IF EXISTS saas_assinaturas_empresa_id_int_legacy_fkey;

DROP INDEX IF EXISTS saas_empresas_id_int_legacy_idx;
DROP INDEX IF EXISTS saas_filiais_id_int_legacy_idx;

-- 3.2: Remover colunas *_id_int_legacy
ALTER TABLE public.saas_empresas DROP COLUMN IF EXISTS id_int_legacy CASCADE;
ALTER TABLE public.saas_filiais DROP COLUMN IF EXISTS id_int_legacy CASCADE;
ALTER TABLE public.saas_filiais DROP COLUMN IF EXISTS empresa_id_int_legacy CASCADE;

-- 3.3: Remover de saas_assinaturas se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'saas_assinaturas' 
    AND column_name = 'empresa_id_int_legacy'
  ) THEN
    ALTER TABLE public.saas_assinaturas DROP COLUMN empresa_id_int_legacy CASCADE;
  END IF;
END $$;

-- 3.4: Remover de saas_planos se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'saas_planos' 
    AND column_name = 'id_int_legacy'
  ) THEN
    ALTER TABLE public.saas_planos DROP COLUMN id_int_legacy CASCADE;
  END IF;
END $$;

-- PARTE 4: Verificar integridade após remoção
-- --------------------------------------------
DO $$
DECLARE
  v_remaining_id_int_columns INTEGER;
BEGIN
  -- Verificar se ainda existe alguma coluna com *id_int*
  SELECT COUNT(*) INTO v_remaining_id_int_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND (
    column_name LIKE '%id_int%' 
    OR column_name LIKE '%_id_int_%'
  );
  
  IF v_remaining_id_int_columns > 0 THEN
    RAISE WARNING 'Ainda existem % colunas com *id_int* no schema', v_remaining_id_int_columns;
  ELSE
    RAISE NOTICE 'Sucesso: Todas as colunas *id_int* foram removidas';
  END IF;
END $$;