-- Corrigir função RPC upsert_agenda_transacional para cast correto de prioridade
CREATE OR REPLACE FUNCTION public.upsert_agenda_transacional(payload jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_agenda_id uuid;
    v_tenant_id uuid := auth.uid();
    parte jsonb;
    etapa jsonb;
    etiqueta_id_uuid uuid;
BEGIN
    -- Validar tenant_id
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Validar prioridade se fornecida
    IF (payload->>'prioridade') IS NOT NULL 
       AND (payload->>'prioridade') NOT IN ('baixa', 'media', 'alta', 'urgente') THEN
        RAISE EXCEPTION 'Prioridade inválida: %. Valores aceitos: baixa, media, alta, urgente', payload->>'prioridade';
    END IF;

    -- 1. Upsert da agenda principal
    IF (payload->>'id')::uuid IS NOT NULL THEN
        -- Atualização
        UPDATE agendas SET
            titulo = payload->>'titulo',
            descricao = payload->>'descricao',
            data_inicio = (payload->>'data_inicio')::timestamptz,
            data_fim = (payload->>'data_fim')::timestamptz,
            status = (payload->>'status')::agenda_status,
            prioridade = (payload->>'prioridade')::agenda_prioridade,
            observacoes = payload->>'observacoes',
            processo_id = (payload->>'processo_id')::uuid,
            empresa_id = (payload->>'empresa_id')::uuid,
            filial_id = (payload->>'filial_id')::uuid,
            updated_at = now()
        WHERE id = (payload->>'id')::uuid AND tenant_id = v_tenant_id
        RETURNING id INTO v_agenda_id;

        IF v_agenda_id IS NULL THEN
            RAISE EXCEPTION 'Agenda não encontrada ou sem permissão';
        END IF;
    ELSE
        -- Inserção
        INSERT INTO agendas (
            titulo, descricao, data_inicio, data_fim, status, prioridade, 
            observacoes, processo_id, empresa_id, filial_id, 
            tenant_id, user_id, contato_responsavel_id, contato_solicitante_id
        )
        VALUES (
            payload->>'titulo',
            payload->>'descricao',
            (payload->>'data_inicio')::timestamptz,
            (payload->>'data_fim')::timestamptz,
            COALESCE((payload->>'status')::agenda_status, 'analise'),
            (payload->>'prioridade')::agenda_prioridade,
            payload->>'observacoes',
            (payload->>'processo_id')::uuid,
            (payload->>'empresa_id')::uuid,
            (payload->>'filial_id')::uuid,
            v_tenant_id,
            v_tenant_id,
            v_tenant_id, -- placeholder, partes determinam quem é responsável
            v_tenant_id  -- placeholder, partes determinam quem é solicitante
        )
        RETURNING id INTO v_agenda_id;
    END IF;

    -- 2. Limpeza das tabelas relacionadas (apenas se for edição)
    IF (payload->>'id')::uuid IS NOT NULL THEN
        DELETE FROM agenda_partes WHERE agenda_id = v_agenda_id AND tenant_id = v_tenant_id;
        DELETE FROM agenda_etapas WHERE agenda_id = v_agenda_id AND tenant_id = v_tenant_id;
        DELETE FROM agenda_etiquetas WHERE agenda_id = v_agenda_id AND tenant_id = v_tenant_id;
        DELETE FROM agenda_locais WHERE agenda_id = v_agenda_id AND tenant_id = v_tenant_id;
    END IF;

    -- 3. Inserção dos novos relacionamentos
    
    -- Inserir Partes
    IF payload->'partes' IS NOT NULL AND jsonb_array_length(payload->'partes') > 0 THEN
        FOR parte IN SELECT * FROM jsonb_array_elements(payload->'partes')
        LOOP
            -- Validar que contato_id não é vazio
            IF (parte->>'contato_id') IS NOT NULL AND (parte->>'contato_id') != '' THEN
                INSERT INTO agenda_partes (agenda_id, contato_id, papel, tenant_id)
                VALUES (
                    v_agenda_id, 
                    (parte->>'contato_id')::uuid, 
                    parte->>'papel', 
                    v_tenant_id
                );
            END IF;
        END LOOP;
    END IF;

    -- Inserir Etapas
    IF payload->'etapas' IS NOT NULL AND jsonb_array_length(payload->'etapas') > 0 THEN
        FOR etapa IN SELECT * FROM jsonb_array_elements(payload->'etapas')
        LOOP
            -- Validar que título não é vazio
            IF (etapa->>'titulo') IS NOT NULL AND trim(etapa->>'titulo') != '' THEN
                INSERT INTO agenda_etapas (
                    agenda_id, ordem, titulo, descricao, status, 
                    prevista_para, responsavel_contato_id, tenant_id
                )
                VALUES (
                    v_agenda_id, 
                    (etapa->>'ordem')::integer, 
                    etapa->>'titulo', 
                    etapa->>'descricao', 
                    COALESCE(etapa->>'status', 'PENDENTE'), 
                    (etapa->>'prevista_para')::timestamptz,
                    (etapa->>'responsavel_contato_id')::uuid,
                    v_tenant_id
                );
            END IF;
        END LOOP;
    END IF;

    -- Inserir Local
    IF payload->'local' IS NOT NULL AND (payload->'local'->>'modalidade') IS NOT NULL THEN
        INSERT INTO agenda_locais (
            agenda_id, modalidade, endereco, link, pasta_arquivos, tenant_id
        )
        VALUES (
            v_agenda_id, 
            payload->'local'->>'modalidade', 
            payload->'local'->>'endereco', 
            payload->'local'->>'link',
            payload->'local'->>'pasta_arquivos',
            v_tenant_id
        );
    END IF;
    
    -- Inserir Etiquetas
    IF payload->'etiqueta_ids' IS NOT NULL AND jsonb_array_length(payload->'etiqueta_ids') > 0 THEN
        FOR etiqueta_id_uuid IN SELECT (jsonb_array_elements_text(payload->'etiqueta_ids'))::uuid
        LOOP
            INSERT INTO agenda_etiquetas (agenda_id, etiqueta_id, tenant_id) 
            VALUES (v_agenda_id, etiqueta_id_uuid, v_tenant_id);
        END LOOP;
    END IF;

    -- Registrar evento de auditoria
    PERFORM log_security_event(
        'agenda_upsert_transacional',
        format('Agenda %s salva transacionalmente', v_agenda_id),
        jsonb_build_object(
            'agenda_id', v_agenda_id,
            'is_new', (payload->>'id')::uuid IS NULL,
            'has_partes', jsonb_array_length(COALESCE(payload->'partes', '[]'::jsonb)),
            'has_etapas', jsonb_array_length(COALESCE(payload->'etapas', '[]'::jsonb)),
            'has_local', payload->'local' IS NOT NULL
        )
    );

    RETURN v_agenda_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Log do erro
        PERFORM log_security_event(
            'agenda_upsert_error',
            format('Erro ao salvar agenda: %s', SQLERRM),
            jsonb_build_object('error', SQLERRM, 'payload', payload)
        );
        RAISE;
END;
$function$;