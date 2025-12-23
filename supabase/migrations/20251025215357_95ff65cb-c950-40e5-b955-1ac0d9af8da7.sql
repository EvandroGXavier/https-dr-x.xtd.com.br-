-- ============================================
-- REFATORAÇÃO PROVISIONAMENTO SAAS V1
-- Migração: Trial 30 dias + Login CNPJ
-- ============================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ### PARTE 1: ALTERAÇÕES DE SCHEMA ###

-- Adiciona flag para identificar o plano Trial
ALTER TABLE public.saas_planos
ADD COLUMN IF NOT EXISTS eh_trial BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.saas_planos.eh_trial IS 'Indica se este é o plano Trial padrão (TRUE) ou um plano pago (FALSE). Apenas um plano deve ter esta flag como TRUE.';

-- Adiciona flag para controle de primeiro acesso no perfil do usuário
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS eh_primeiro_acesso BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.profiles.eh_primeiro_acesso IS 'Controla se o usuário precisa passar pela configuração inicial (troca de senha/nome) no primeiro login. TRUE = Pendente, FALSE = Concluído.';

-- Garante que o RLS está ativo
ALTER TABLE public.saas_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ### PARTE 2: FUNÇÃO RPC PARA PROVISIONAMENTO SEGURO ###

-- Cria a função que centraliza a criação da empresa, assinatura e filial
-- NOTA: A criação do usuário Auth será feita pelo frontend usando supabase.auth.signUp
CREATE OR REPLACE FUNCTION public.fn_provisionar_nova_empresa(
    p_nome_empresa TEXT,
    p_cnpj TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_empresa_id UUID;
    v_filial_id UUID;
    v_plano_id UUID;
    v_cnpj_limpo TEXT;
    v_email_admin TEXT;
    v_senha_admin TEXT;
    v_chamador_id UUID := auth.uid();
    v_eh_superadmin BOOLEAN;
BEGIN
    -- 1. Validação de Segurança: Verificar se o chamador é Super Admin
    SELECT EXISTS (
        SELECT 1
        FROM public.saas_superadmins sa
        WHERE sa.user_id = v_chamador_id
    ) INTO v_eh_superadmin;

    IF NOT v_eh_superadmin THEN
        RETURN json_build_object(
            'sucesso', false, 
            'mensagem', 'Acesso negado: Somente Super Admins podem provisionar empresas.'
        );
    END IF;

    -- 2. Limpeza e Preparação dos Dados
    v_cnpj_limpo := regexp_replace(p_cnpj, '\D', '', 'g');
    IF length(v_cnpj_limpo) <> 14 THEN
        RETURN json_build_object(
            'sucesso', false, 
            'mensagem', 'CNPJ inválido. Deve conter 14 dígitos.'
        );
    END IF;
    v_email_admin := v_cnpj_limpo || '@cnpj.local';
    v_senha_admin := v_cnpj_limpo;

    -- 3. Validação de Duplicidade (CNPJ já existe?)
    IF EXISTS (SELECT 1 FROM public.saas_empresas WHERE cnpj = v_cnpj_limpo) THEN
        RETURN json_build_object(
            'sucesso', false, 
            'mensagem', 'Erro: CNPJ já cadastrado para outra empresa.'
        );
    END IF;

    -- 4. Localizar o Plano Trial
    SELECT plano_id INTO v_plano_id 
    FROM public.saas_planos 
    WHERE eh_trial = true 
    LIMIT 1;
    
    IF v_plano_id IS NULL THEN
        RETURN json_build_object(
            'sucesso', false, 
            'mensagem', 'Erro crítico: Plano Trial não encontrado. Marque um plano com eh_trial = TRUE.'
        );
    END IF;

    -- 5. Início da Transação Atômica
    BEGIN
        -- 5.1 Criar a Empresa (Tenant)
        INSERT INTO public.saas_empresas (nome, cnpj, ativa, codigo)
        VALUES (
            p_nome_empresa, 
            v_cnpj_limpo, 
            true,
            'EMP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
        )
        RETURNING empresa_id INTO v_empresa_id;

        -- 5.2 Criar a Filial Matriz (Obrigatória para RLS)
        INSERT INTO public.saas_filiais (empresa_id, nome, eh_matriz, ativa, codigo)
        VALUES (
            v_empresa_id, 
            'Matriz', 
            TRUE, 
            true,
            'FIL-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8))
        )
        RETURNING filial_id INTO v_filial_id;

        -- 5.3 Criar a Assinatura Trial
        INSERT INTO public.saas_assinaturas (
            empresa_id, 
            plano_id, 
            data_inicio, 
            data_fim, 
            status,
            valor_mensal
        )
        VALUES (
            v_empresa_id, 
            v_plano_id, 
            CURRENT_DATE, 
            CURRENT_DATE + INTERVAL '30 days', 
            'ativa',
            0.00
        );

        -- 5.4 Registrar Auditoria
        INSERT INTO public.security_audit_log (
            actor_id, 
            action, 
            target_type, 
            target_id, 
            details
        )
        VALUES (
            v_chamador_id, 
            'provisionar_empresa', 
            'saas_empresa', 
            v_empresa_id::text, 
            json_build_object(
                'nome', p_nome_empresa, 
                'cnpj', v_cnpj_limpo, 
                'plano', 'Trial'
            )
        );

    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erro ao provisionar empresa: %', SQLERRM;
        RETURN json_build_object(
            'sucesso', false, 
            'mensagem', 'Erro interno: ' || SQLERRM
        );
    END;

    -- 6. Retorno de Sucesso com credenciais para criação manual do usuário
    RETURN json_build_object(
        'sucesso', true, 
        'mensagem', 'Empresa provisionada com sucesso.',
        'empresa_id', v_empresa_id,
        'filial_id', v_filial_id,
        'email_admin', v_email_admin,
        'senha_admin', v_senha_admin,
        'cnpj_limpo', v_cnpj_limpo
    );

END;
$$;

-- ### PARTE 3: Permissões ###
GRANT EXECUTE ON FUNCTION public.fn_provisionar_nova_empresa(TEXT, TEXT) TO authenticated;

-- Comentário: As permissões de INSERT nas tabelas SaaS não serão revogadas
-- pois isso pode quebrar funcionalidades existentes. A validação de segurança
-- está na própria RPC que verifica se o usuário é Super Admin.