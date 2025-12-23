-- Corrigir RPC atualizar_processo_v1 para usar SECURITY DEFINER
-- e validar tenant via profiles.empresa_id (padrão consistente com criar_processo_v1)

CREATE OR REPLACE FUNCTION public.atualizar_processo_v1(
    processo_id UUID,
    dados_complementares JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_user_empresa_id UUID;
    v_processo_tenant_id UUID;
    v_updated_processo JSONB;
BEGIN
    -- 1. Capturar ID do usuário autenticado
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- 2. Capturar empresa_id do profile do usuário
    SELECT empresa_id INTO v_user_empresa_id
    FROM public.profiles 
    WHERE user_id = v_user_id;

    IF v_user_empresa_id IS NULL THEN
        RAISE EXCEPTION 'Perfil de usuário sem empresa_id vinculado.';
    END IF;

    -- 3. Verificar se o processo pertence ao tenant do usuário
    SELECT tenant_id INTO v_processo_tenant_id
    FROM public.processos
    WHERE id = processo_id;

    IF v_processo_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Processo não encontrado.';
    END IF;

    IF v_processo_tenant_id != v_user_empresa_id THEN
        RAISE EXCEPTION 'Acesso Negado: Tentativa de editar processo de outro escritório.';
    END IF;

    -- 4. Executar o UPDATE (APENAS 4 campos de negócio)
    UPDATE public.processos
    SET 
        titulo = COALESCE((dados_complementares->>'titulo')::TEXT, titulo),
        descricao = COALESCE((dados_complementares->>'descricao')::TEXT, descricao),
        status = COALESCE((dados_complementares->>'status')::TEXT, status),
        local = COALESCE((dados_complementares->>'local')::TEXT, local),
        updated_at = NOW()
    WHERE id = processo_id
    RETURNING to_jsonb(public.processos.*) INTO v_updated_processo;

    -- 5. Log de auditoria
    INSERT INTO public.auditoria (
        tenant_id,
        actor_id,
        module,
        action,
        target_id,
        details
    ) VALUES (
        v_user_empresa_id,
        v_user_id,
        'processos',
        'update',
        processo_id,
        dados_complementares
    );

    RETURN v_updated_processo;
END;
$$;