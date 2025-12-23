-- =====================================================
-- SISTEMA DE FUNIL DE ATENDIMENTO COM ETIQUETAS
-- =====================================================

-- 1. ADICIONAR COLUNA 'grupo' À TABELA 'etiquetas'
ALTER TABLE public.etiquetas
ADD COLUMN IF NOT EXISTS grupo TEXT;

COMMENT ON COLUMN public.etiquetas.grupo IS 'Permite agrupar etiquetas para comportamentos especiais, como "Fase do Processo", onde apenas uma etiqueta do grupo pode ser aplicada por vez a um item.';

-- 2. CRIAR ÍNDICE PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_etiquetas_grupo ON public.etiquetas(user_id, grupo) WHERE grupo IS NOT NULL;

-- 3. CRIAR FUNÇÃO RPC PARA TROCA ATÔMICA DE ETIQUETAS DE GRUPO
CREATE OR REPLACE FUNCTION public.trocar_etiqueta_de_grupo(
    p_item_id UUID,
    p_modulo TEXT,
    p_etiqueta_adicionar_id UUID,
    p_grupo TEXT
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    etiqueta_remover_id UUID;
    usuario_atual UUID;
BEGIN
    -- Obter usuário atual
    usuario_atual := auth.uid();
    
    IF usuario_atual IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Validar que a etiqueta a ser adicionada existe e pertence ao usuário
    IF NOT EXISTS (
        SELECT 1 FROM public.etiquetas 
        WHERE id = p_etiqueta_adicionar_id 
          AND user_id = usuario_atual
          AND grupo = p_grupo
    ) THEN
        RAISE EXCEPTION 'Etiqueta inválida ou não pertence ao grupo especificado';
    END IF;

    -- Encontrar a etiqueta do mesmo grupo que já está vinculada ao item
    SELECT ev.etiqueta_id INTO etiqueta_remover_id
    FROM public.etiqueta_vinculos ev
    JOIN public.etiquetas e ON ev.etiqueta_id = e.id
    WHERE ev.referencia_tipo = p_modulo
      AND ev.referencia_id = p_item_id
      AND e.grupo = p_grupo
      AND e.user_id = usuario_atual
    LIMIT 1;

    -- Se encontrou, remove o vínculo antigo
    IF etiqueta_remover_id IS NOT NULL THEN
        DELETE FROM public.etiqueta_vinculos
        WHERE referencia_tipo = p_modulo
          AND referencia_id = p_item_id
          AND etiqueta_id = etiqueta_remover_id;
    END IF;

    -- Verifica se o vínculo já existe antes de inserir
    IF NOT EXISTS (
        SELECT 1 FROM public.etiqueta_vinculos
        WHERE referencia_tipo = p_modulo
          AND referencia_id = p_item_id
          AND etiqueta_id = p_etiqueta_adicionar_id
    ) THEN
        -- Adiciona o novo vínculo
        INSERT INTO public.etiqueta_vinculos (
            referencia_tipo, 
            referencia_id, 
            etiqueta_id, 
            user_id,
            empresa_id,
            filial_id
        )
        SELECT 
            p_modulo,
            p_item_id,
            p_etiqueta_adicionar_id,
            usuario_atual,
            e.empresa_id,
            e.filial_id
        FROM public.etiquetas e
        WHERE e.id = p_etiqueta_adicionar_id;
    END IF;

    -- Log de auditoria
    PERFORM public.log_security_event(
        'processo_fase_alterada',
        format('Fase do processo alterada: %s', p_grupo),
        jsonb_build_object(
            'processo_id', p_item_id,
            'etiqueta_antiga', etiqueta_remover_id,
            'etiqueta_nova', p_etiqueta_adicionar_id,
            'grupo', p_grupo
        )
    );
END;
$$;