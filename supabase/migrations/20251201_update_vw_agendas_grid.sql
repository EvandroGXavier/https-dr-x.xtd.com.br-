-- ==========================================
-- ATUALIZAÇÃO: Módulo de Agenda V2
-- Atualiza VIEW para incluir colunas faltantes
-- ==========================================

CREATE OR REPLACE VIEW public.vw_agendas_grid AS
SELECT
    a.id,
    a.titulo,
    a.descricao,
    a.data_inicio,
    a.data_fim,
    a.status,
    a.prioridade,
    a.observacoes,
    a.criado_em AS created_at,
    a.atualizado_em AS updated_at,
    a.tenant_id,
    a.empresa_id,
    a.filial_id,
    a.processo_id,
    -- Colunas adicionadas para compatibilidade
    a.contato_responsavel_id,
    a.contato_solicitante_id,
    a.origem_config_id,
    a.origem_modulo,
    a.origem_registro_id,
    -- Dados dos joins
    solicitante.nome_fantasia AS solicitante_nome,
    solicitante.id AS solicitante_id,
    responsavel.nome_fantasia AS responsavel_nome,
    responsavel.id AS responsavel_id
FROM
    public.agendas a
LEFT JOIN
    public.contatos_v2 solicitante ON a.contato_solicitante_id = solicitante.id
LEFT JOIN
    public.contatos_v2 responsavel ON a.contato_responsavel_id = responsavel.id;

COMMENT ON VIEW public.vw_agendas_grid IS 'View otimizada para grid de agendas com dados desnormalizados de contatos (Atualizada)';
