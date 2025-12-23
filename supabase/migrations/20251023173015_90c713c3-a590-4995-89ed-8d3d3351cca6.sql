-- =====================================================
-- MIGRATION: Correções no Fluxo de Cadastro de Usuário
-- =====================================================
-- Objetivo: 
-- 1. Adicionar vínculo em usuario_filial_perfis
-- 2. Garantir que não haja duplicatas de email
-- =====================================================

-- Drop trigger anterior para recriar
DROP TRIGGER IF EXISTS trigger_processar_cadastro_usuario ON profiles;

-- =====================================================
-- FUNÇÃO ATUALIZADA: Processar Cadastro Completo
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
  v_email_exists boolean;
BEGIN
  -- Log para debug
  RAISE NOTICE 'Processando cadastro para usuário: %', NEW.user_id;
  
  -- =====================================================
  -- 0. Verificar se email já existe em outro perfil
  -- =====================================================
  SELECT EXISTS(
    SELECT 1 FROM profiles 
    WHERE email = NEW.email 
    AND user_id != NEW.user_id
  ) INTO v_email_exists;
  
  IF v_email_exists THEN
    RAISE EXCEPTION 'Email % já está cadastrado', NEW.email;
  END IF;
  
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
    v_contato_id := upsert_contato_v2_transacional(
      p_contato_id := NULL,
      p_nome_fantasia := NEW.nome,
      p_tipo_pessoa := 'PF',
      p_cpf_cnpj := NULL,
      p_meios_contato := v_meios_contato::jsonb,
      p_enderecos := '[]'::jsonb,
      p_dados_pf := NULL,
      p_dados_pj := NULL,
      p_etiquetas := array_to_json(v_etiquetas_ids)::jsonb
    );
    
    RAISE NOTICE 'Contato criado com ID: %', v_contato_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar contato para usuário %: %', NEW.user_id, SQLERRM;
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
  
  -- =====================================================
  -- 3. Criar vínculo em usuario_filial_perfis
  -- =====================================================
  BEGIN
    INSERT INTO usuario_filial_perfis (
      user_id,
      empresa_id,
      filial_id,
      perfil,
      ativo,
      created_at
    ) VALUES (
      NEW.user_id,
      v_empresa_id,
      v_filial_id,
      'colaborador', -- Perfil padrão para novos usuários
      true,
      now()
    )
    ON CONFLICT (user_id, empresa_id, filial_id) DO NOTHING;
    
    RAISE NOTICE 'Vínculo criado em usuario_filial_perfis';
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar vínculo usuario_filial_perfis %: %', NEW.user_id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- =====================================================
-- TRIGGER: Executar após inserção em profiles
-- =====================================================
CREATE TRIGGER trigger_processar_cadastro_usuario
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION processar_cadastro_novo_usuario();

-- =====================================================
-- FUNÇÃO HELPER: Verificar email duplicado (para usar no frontend)
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM profiles WHERE email = p_email);
$$;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON FUNCTION processar_cadastro_novo_usuario() IS 
'Função trigger que executa automaticamente após criação de novo usuário.
Cria contato, registra meios de contato, vincula etiqueta User, configura tenant/empresa/filial
e cria vínculo em usuario_filial_perfis.';

COMMENT ON FUNCTION check_email_exists(text) IS
'Verifica se um email já está cadastrado no sistema.';