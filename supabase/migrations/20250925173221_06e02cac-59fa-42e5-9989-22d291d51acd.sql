-- Corrigir Security Definer Views - Recriar com SECURITY INVOKER
-- Isso garante que as views executem com os privilégios do usuário consultante, não do criador

-- 1. Recriar view 'contatos' com SECURITY INVOKER
DROP VIEW IF EXISTS public.contatos;
CREATE VIEW public.contatos
WITH (security_invoker = true)
AS
SELECT id,
    user_id,
    empresa_id,
    filial_id,
    nome_fantasia AS nome,
    tipo_pessoa,
    cpf_cnpj,
    email,
    celular,
    telefone,
    ativo,
    observacao,
    created_at,
    updated_at
FROM contatos_v2 c;

-- 2. Recriar view 'vw_agenda_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_agenda_pt;
CREATE VIEW public.vw_agenda_pt
WITH (security_invoker = true)
AS
SELECT id,
    tenant_id AS empresa_id,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    (status)::text AS status,
    prioridade,
    contato_responsavel_id,
    contato_solicitante_id,
    processo_id,
    observacoes,
    created_at AS criado_em,
    updated_at AS atualizado_em
FROM agendas a;

-- 3. Recriar view 'vw_anexos_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_anexos_pt;
CREATE VIEW public.vw_anexos_pt
WITH (security_invoker = true)
AS
SELECT id,
    tenant_id AS empresa_id,
    modulo,
    record_type AS tipo_registro,
    record_id AS registro_id,
    original_name AS nome_original,
    storage_path AS caminho_storage,
    mime_type AS tipo_mime,
    size_bytes AS tamanho_bytes,
    metadata AS metadados,
    ocr_text AS texto_ocr,
    ocr_confidence AS confianca_ocr,
    ocr_status AS status_ocr,
    virus_scan_status AS status_virus,
    status,
    created_by AS criado_por,
    created_at AS criado_em,
    updated_at AS atualizado_em
FROM anexos a;

-- 4. Recriar view 'vw_contas_compat' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_contas_compat;
CREATE VIEW public.vw_contas_compat
WITH (security_invoker = true)
AS
SELECT id,
    nome,
    tipo,
    banco,
    agencia,
    conta,
    user_id AS tenant_id
FROM contas_financeiras cf;

-- 5. Recriar view 'vw_contatos_compat' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_contatos_compat;
CREATE VIEW public.vw_contatos_compat
WITH (security_invoker = true)
AS
SELECT id,
    nome_fantasia AS nome,
    cpf_cnpj AS documento,
    COALESCE(celular, telefone) AS telefone,
    email,
    user_id AS tenant_id
FROM contatos_v2 c;

-- 6. Recriar view 'vw_contatos_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_contatos_pt;
CREATE VIEW public.vw_contatos_pt
WITH (security_invoker = true)
AS
SELECT id,
    user_id AS empresa_id,
    nome,
    nome_fantasia,
    cpf_cnpj,
    tipo_pessoa,
    email,
    celular,
    telefone,
    ativo,
    observacao AS observacoes,
    created_at AS criado_em,
    updated_at AS atualizado_em
FROM contatos_v2 c;

-- 7. Recriar view 'vw_etiquetas_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_etiquetas_pt;
CREATE VIEW public.vw_etiquetas_pt
WITH (security_invoker = true)
AS
SELECT id,
    user_id AS empresa_id,
    nome,
    slug,
    cor,
    icone,
    descricao,
    ativa,
    created_at AS criado_em,
    updated_at AS atualizado_em
FROM etiquetas e;

-- 8. Recriar view 'vw_processo_partes_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_processo_partes_pt;
CREATE VIEW public.vw_processo_partes_pt
WITH (security_invoker = true)
AS
SELECT id,
    user_id AS empresa_id,
    processo_id,
    contato_id,
    (qualificacao)::text AS papel,
    principal,
    observacoes AS metadados,
    created_at AS criado_em
FROM processo_partes pp;

-- 9. Recriar view 'vw_processos_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_processos_pt;
CREATE VIEW public.vw_processos_pt
WITH (security_invoker = true)
AS
SELECT id,
    user_id AS empresa_id,
    numero_processo,
    (tipo)::text AS tipo_processo,
    (status)::text AS status,
    tribunal,
    comarca,
    vara,
    (instancia)::text AS instancia,
    cliente_principal_id,
    advogado_responsavel_id,
    valor_causa,
    assunto_principal,
    data_distribuicao,
    (etiqueta)::text AS etiqueta,
    (situacao)::text AS situacao,
    observacoes,
    created_at AS criado_em,
    updated_at AS atualizado_em
FROM processos p;

-- 10. Recriar view 'vw_transacoes_financeiras_pt' com SECURITY INVOKER
DROP VIEW IF EXISTS public.vw_transacoes_financeiras_pt;
CREATE VIEW public.vw_transacoes_financeiras_pt
WITH (security_invoker = true)
AS
SELECT id,
    user_id AS empresa_id,
    tipo,
    categoria,
    historico,
    numero_documento,
    data_emissao,
    data_vencimento,
    data_competencia,
    COALESCE(data_liquidacao, NULL::date) AS data_liquidacao,
    valor_documento,
    COALESCE(valor_recebido, valor_documento) AS valor_recebido,
    situacao AS status,
    forma_pagamento,
    contato_id,
    conta_financeira_id,
    origem_tipo,
    origem_id,
    observacoes,
    created_at AS criado_em,
    updated_at AS atualizado_em
FROM transacoes_financeiras t;