
-- =====================================================
-- MIGRATION: Fluxo Automático de Cadastro de Usuário
-- =====================================================
-- Objetivo: Ao criar uma conta, automaticamente:
-- 1. Cria registro em profiles
-- 2. Cria contato correspondente em contatos_v2
-- 3. Registra email e celular em contato_meios_contato
-- 4. Vincula etiqueta "User" ao contato
-- 5. Associa à empresa "Empresa Principal", filial "Filial Principal" e tenant Evandro
-- =====================================================

-- Constantes para configuração
DO $$
BEGIN
  -- Verificar se a etiqueta "User" existe, caso contrário criar
  IF NOT EXISTS (SELECT 1 FROM etiquetas WHERE nome = 'User') THEN
    INSERT INTO etiquetas (id, nome, cor, ativo, user_id)
    VALUES (
      '61c2f8a0-bff2-475e-a02a-dab254626472'::uuid,
      'User',
      '#3b82f6',
      true,
      '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'::uuid
    );
  END IF;
END $$;

-- =====================================================
-- FUNÇÃO: Processar Cadastro Completo de Novo Usuário
-- =====================================================
CREATE OR REPLACE FUNCTION public.processar_cadastro_novo_usuario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contato_id uuid;
  v_empresa_id integer := 1; -- Empresa Principal
  v_filial_id integer := 1; -- Filial Principal
  v_tenant_id uuid := '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'::uuid; -- Tenant Evandro
  v_etiqueta_user_id uuid := '61c2f8a0-bff2-475e-a02a-dab254626472'::uuid; -- Etiqueta "User"
  v_meios_contato jsonb;
  v_etiquetas_ids uuid[];
BEGIN
  -- Log para debug
  RAISE NOTICE 'Processando cadastro para usuário: %', NEW.user_id;
  
  -- Preparar array de meios de contato (email obrigatório, celular opcional)
  v_meios_contato := jsonb_build_array(
    jsonb_build_object(
      'tipo', 'email',
      'valor', NEW.email,
      'principal', true
    )
  );
  
  -- Adicionar celular se fornecido
  IF NEW.celular IS NOT NULL AND NEW.celular != '' THEN
    v_meios_contato := v_meios_contato || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'celular',
        'valor', NEW.celular,
        'principal', true
      )
    );
  END IF;
  
  -- Preparar array de etiquetas (apenas "User")
  v_etiquetas_ids := ARRAY[v_etiqueta_user_id];
  
  -- =====================================================
  -- 1. Criar Contato usando RPC transacional
  -- =====================================================
  BEGIN
    -- Chamar RPC que cria contato + meios de contato + etiquetas atomicamente
    v_contato_id := upsert_contato_v2_transacional(
      p_contato_id := NULL, -- Novo contato
      p_nome_fantasia := NEW.nome,
      p_tipo_pessoa := 'PF',
      p_cpf_cnpj := NULL, -- Será preenchido depois se necessário
      p_meios_contato := v_meios_contato::jsonb,
      p_enderecos := '[]'::jsonb,
      p_dados_pf := NULL,
      p_dados_pj := NULL,
      p_etiquetas := array_to_json(v_etiquetas_ids)::jsonb
    );
    
    RAISE NOTICE 'Contato criado com ID: %', v_contato_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar contato para usuário %: %', NEW.user_id, SQLERRM;
    -- Não interromper o cadastro, apenas logar o erro
    RETURN NEW;
  END;
  
  -- =====================================================
  -- 2. Atualizar Profile com Empresa, Filial e Tenant
  -- =====================================================
  BEGIN
    UPDATE profiles
    SET 
      current_empresa_id = v_empresa_id,
      current_filial_id = v_filial_id,
      tenant_id = v_tenant_id,
      updated_at = now()
    WHERE user_id = NEW.user_id;
    
    RAISE NOTICE 'Profile atualizado com empresa_id: %, filial_id: %, tenant_id: %', 
                 v_empresa_id, v_filial_id, v_tenant_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao atualizar profile %: %', NEW.user_id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Executar após inserção em profiles
-- =====================================================
DROP TRIGGER IF EXISTS trigger_processar_cadastro_usuario ON profiles;

CREATE TRIGGER trigger_processar_cadastro_usuario
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION processar_cadastro_novo_usuario();

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION processar_cadastro_novo_usuario() IS 
'Função trigger que executa automaticamente após criação de novo usuário.
Cria contato, registra meios de contato, vincula etiqueta User e configura tenant/empresa/filial.';

COMMENT ON TRIGGER trigger_processar_cadastro_usuario ON profiles IS
'Trigger que executa após INSERT em profiles para processar cadastro completo do usuário.';
