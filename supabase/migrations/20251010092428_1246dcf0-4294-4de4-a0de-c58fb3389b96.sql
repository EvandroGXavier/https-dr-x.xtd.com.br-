-- =============================================================================
-- REFATORAÇÃO ESTRUTURAL DO MÓDULO DE CONTATOS
-- Fase 3 - Execução da Entrega Estruturada (FINAL)
-- =============================================================================

-- ETAPA 0: Remover views dependentes das colunas legadas
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.vw_contatos_compat CASCADE;
DROP VIEW IF EXISTS public.vw_contatos_completo CASCADE;

-- ETAPA 1: Refatorar a tabela principal 'contatos_v2'
-- -----------------------------------------------------------------------------

ALTER TABLE public.contatos_v2 
ADD COLUMN IF NOT EXISTS responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.contatos_v2.responsavel_id IS 
'Usuário responsável/gestor principal deste contato.';

ALTER TABLE public.contatos_v2 
ALTER COLUMN filial_id DROP NOT NULL;

ALTER TABLE public.contatos_v2 
ADD COLUMN IF NOT EXISTS classificacao TEXT;

COMMENT ON COLUMN public.contatos_v2.classificacao IS 
'Classificação primária do contato (ex: Cliente, Lead, Parte Contrária).';

-- ETAPA 2: Propagar hierarquia completa para tabelas auxiliares
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_contato_enderecos_empresa 
ON public.contato_enderecos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_contato_enderecos_filial 
ON public.contato_enderecos(filial_id);

CREATE INDEX IF NOT EXISTS idx_contato_meios_empresa 
ON public.contato_meios_contato(empresa_id);

CREATE INDEX IF NOT EXISTS idx_contato_meios_filial 
ON public.contato_meios_contato(filial_id);

ALTER TABLE public.contato_vinculos 
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS filial_id UUID;

CREATE INDEX IF NOT EXISTS idx_contato_vinculos_empresa 
ON public.contato_vinculos(empresa_id);

CREATE INDEX IF NOT EXISTS idx_contato_vinculos_filial 
ON public.contato_vinculos(filial_id);

-- ETAPA 3: Migrar dados existentes dos campos legados para contato_meios_contato
-- -----------------------------------------------------------------------------

INSERT INTO public.contato_meios_contato (
  contato_id, tipo, valor, principal, empresa_id, filial_id, tenant_id, created_at
)
SELECT 
  c.id,
  'Email'::VARCHAR,
  c.email,
  true,
  c.empresa_id,
  c.filial_id,
  c.tenant_id,
  NOW()
FROM public.contatos_v2 c
WHERE c.email IS NOT NULL 
  AND c.email != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.contato_meios_contato cm
    WHERE cm.contato_id = c.id AND cm.tipo = 'Email'
  );

INSERT INTO public.contato_meios_contato (
  contato_id, tipo, valor, principal, empresa_id, filial_id, tenant_id, created_at
)
SELECT 
  c.id,
  'Celular'::VARCHAR,
  c.celular,
  true,
  c.empresa_id,
  c.filial_id,
  c.tenant_id,
  NOW()
FROM public.contatos_v2 c
WHERE c.celular IS NOT NULL 
  AND c.celular != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.contato_meios_contato cm
    WHERE cm.contato_id = c.id AND cm.tipo = 'Celular'
  );

INSERT INTO public.contato_meios_contato (
  contato_id, tipo, valor, principal, empresa_id, filial_id, tenant_id, created_at
)
SELECT 
  c.id,
  'Telefone'::VARCHAR,
  c.telefone,
  false,
  c.empresa_id,
  c.filial_id,
  c.tenant_id,
  NOW()
FROM public.contatos_v2 c
WHERE c.telefone IS NOT NULL 
  AND c.telefone != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.contato_meios_contato cm
    WHERE cm.contato_id = c.id AND cm.tipo = 'Telefone'
  );

UPDATE public.contato_enderecos ce
SET 
  empresa_id = c.empresa_id,
  filial_id = c.filial_id
FROM public.contatos_v2 c
WHERE ce.contato_id = c.id
  AND (ce.empresa_id IS NULL OR ce.filial_id IS NULL);

UPDATE public.contato_meios_contato cm
SET 
  empresa_id = c.empresa_id,
  filial_id = c.filial_id
FROM public.contatos_v2 c
WHERE cm.contato_id = c.id
  AND (cm.empresa_id IS NULL OR cm.filial_id IS NULL);

UPDATE public.contato_vinculos cv
SET 
  empresa_id = c.empresa_id,
  filial_id = c.filial_id
FROM public.contatos_v2 c
WHERE cv.contato_id = c.id
  AND (cv.empresa_id IS NULL OR cv.filial_id IS NULL);

-- ETAPA 4: Remover campos legados (APÓS migração)
-- -----------------------------------------------------------------------------

ALTER TABLE public.contatos_v2
DROP COLUMN IF EXISTS email CASCADE,
DROP COLUMN IF EXISTS celular CASCADE,
DROP COLUMN IF EXISTS telefone CASCADE;

-- ETAPA 5: Criar trigger para sincronização automática de hierarquia
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.propagar_hierarquia_contato()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.empresa_id IS DISTINCT FROM NEW.empresa_id OR 
     OLD.filial_id IS DISTINCT FROM NEW.filial_id THEN
    
    UPDATE public.contato_enderecos 
    SET empresa_id = NEW.empresa_id, filial_id = NEW.filial_id 
    WHERE contato_id = NEW.id;
    
    UPDATE public.contato_meios_contato 
    SET empresa_id = NEW.empresa_id, filial_id = NEW.filial_id 
    WHERE contato_id = NEW.id;
    
    UPDATE public.contato_vinculos 
    SET empresa_id = NEW.empresa_id, filial_id = NEW.filial_id 
    WHERE contato_id = NEW.id;
    
    PERFORM public.log_security_event(
      'hierarchy_propagation',
      format('Hierarquia propagada para contato %s', NEW.id),
      jsonb_build_object(
        'contato_id', NEW.id,
        'empresa_id', NEW.empresa_id,
        'filial_id', NEW.filial_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_propagar_hierarquia_contato ON public.contatos_v2;

CREATE TRIGGER trigger_propagar_hierarquia_contato
AFTER UPDATE OF empresa_id, filial_id ON public.contatos_v2
FOR EACH ROW
EXECUTE FUNCTION public.propagar_hierarquia_contato();

-- ETAPA 6: Criar função transacional para criação de contato
-- -----------------------------------------------------------------------------

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
  v_user_id := auth.uid();
  v_tenant_id := v_user_id;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  INSERT INTO public.contatos_v2 (
    nome, nome_fantasia, classificacao, tipo_pessoa, pessoa_tipo,
    observacao, empresa_id, filial_id, responsavel_id,
    user_id, tenant_id, ativo, created_at, updated_at
  ) VALUES (
    p_nome_principal, p_nome_principal, p_classificacao, p_tipo_pessoa, p_pessoa_tipo,
    p_observacao, p_empresa_id, p_filial_id, p_responsavel_id,
    v_user_id, v_tenant_id, true, NOW(), NOW()
  )
  RETURNING id INTO v_contato_id;
  
  IF p_meios_contato IS NOT NULL AND jsonb_array_length(p_meios_contato) > 0 THEN
    FOR v_meio IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO public.contato_meios_contato (
        contato_id, tipo, valor, principal, empresa_id, filial_id, tenant_id, created_at, updated_at
      ) VALUES (
        v_contato_id,
        (v_meio->>'tipo')::VARCHAR,
        v_meio->>'valor',
        COALESCE((v_meio->>'is_principal')::BOOLEAN, false),
        p_empresa_id,
        p_filial_id,
        v_tenant_id,
        NOW(),
        NOW()
      );
      
      v_count := v_count + 1;
    END LOOP;
  END IF;
  
  PERFORM public.log_security_event(
    'contact_created_transactional',
    format('Contato criado via operação transacional: %s', p_nome_principal),
    jsonb_build_object(
      'contato_id', v_contato_id,
      'classificacao', p_classificacao,
      'meios_contato_count', v_count
    )
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'contato_id', v_contato_id,
    'meios_contato_criados', v_count,
    'message', 'Contato criado com sucesso'
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_security_event(
      'contact_creation_error',
      format('Erro ao criar contato: %s', SQLERRM),
      jsonb_build_object(
        'error', SQLERRM,
        'nome_principal', p_nome_principal
      )
    );
    
    RAISE;
END;
$$;