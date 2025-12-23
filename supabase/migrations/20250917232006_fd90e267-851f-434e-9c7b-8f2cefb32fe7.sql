-- Corrigir problemas de segurança identificados pelo linter
-- Remover SECURITY DEFINER das views e corrigir search_path das funções

-- 1) Recriar views sem SECURITY DEFINER (usar RLS das tabelas base)
DROP VIEW IF EXISTS public.vw_processos_pt CASCADE;
DROP VIEW IF EXISTS public.vw_processo_partes_pt CASCADE;
DROP VIEW IF EXISTS public.vw_agenda_pt CASCADE;
DROP VIEW IF EXISTS public.vw_contatos_pt CASCADE;
DROP VIEW IF EXISTS public.vw_transacoes_financeiras_pt CASCADE;
DROP VIEW IF EXISTS public.vw_etiquetas_pt CASCADE;
DROP VIEW IF EXISTS public.vw_anexos_pt CASCADE;

-- 2) Corrigir função set_updated_at com search_path
CREATE OR REPLACE FUNCTION public.set_updated_at() 
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- 3) Recriar views PT-BR sem SECURITY DEFINER
CREATE VIEW public.vw_processos_pt AS
SELECT
  p.id,
  p.user_id AS empresa_id,
  p.numero_processo,
  p.tipo::text as tipo_processo,
  p.status::text as status,
  p.tribunal,
  p.comarca,
  p.vara,
  p.instancia::text as instancia,
  p.cliente_principal_id,
  p.advogado_responsavel_id,
  p.valor_causa,
  p.assunto_principal,
  p.data_distribuicao,
  p.etiqueta::text as etiqueta,
  p.situacao::text as situacao,
  p.observacoes,
  p.created_at AS criado_em,
  p.updated_at AS atualizado_em
FROM public.processos p;

CREATE VIEW public.vw_processo_partes_pt AS
SELECT
  pp.id,
  pp.user_id AS empresa_id,
  pp.processo_id,
  pp.contato_id,
  pp.qualificacao::text AS papel,
  pp.principal,
  pp.observacoes AS metadados,
  pp.created_at AS criado_em
FROM public.processo_partes pp;

CREATE VIEW public.vw_agenda_pt AS
SELECT
  a.id,
  a.tenant_id AS empresa_id,
  a.titulo,
  a.descricao,
  a.data_inicio,
  a.data_fim,
  a.status::text as status,
  a.prioridade,
  a.contato_responsavel_id,
  a.contato_solicitante_id,
  a.processo_id,
  a.observacoes,
  a.created_at AS criado_em,
  a.updated_at AS atualizado_em
FROM public.agendas a;

CREATE VIEW public.vw_contatos_pt AS
SELECT
  c.id,
  c.user_id AS empresa_id,
  c.nome,
  c.nome_fantasia,
  c.cpf_cnpj,
  c.tipo_pessoa,
  c.email,
  c.celular,
  c.telefone,
  c.ativo,
  c.observacao AS observacoes,
  c.created_at AS criado_em,
  c.updated_at AS atualizado_em
FROM public.contatos_v2 c;

CREATE VIEW public.vw_transacoes_financeiras_pt AS
SELECT
  t.id,
  t.user_id AS empresa_id,
  t.tipo,
  t.categoria,
  t.historico,
  t.numero_documento,
  t.data_emissao,
  t.data_vencimento,
  t.data_competencia,
  COALESCE(t.data_liquidacao, NULL) as data_liquidacao,
  t.valor_documento,
  COALESCE(t.valor_recebido, t.valor_documento) as valor_recebido,
  t.situacao AS status,
  t.forma_pagamento,
  t.contato_id,
  t.conta_financeira_id,
  t.origem_tipo,
  t.origem_id,
  t.observacoes,
  t.created_at AS criado_em,
  t.updated_at AS atualizado_em
FROM public.transacoes_financeiras t;

CREATE VIEW public.vw_etiquetas_pt AS
SELECT
  e.id,
  e.user_id AS empresa_id,
  e.nome,
  e.slug,
  e.cor,
  e.icone,
  e.descricao,
  e.ativa,
  e.created_at AS criado_em,
  e.updated_at AS atualizado_em
FROM public.etiquetas e;

CREATE VIEW public.vw_anexos_pt AS
SELECT
  a.id,
  a.tenant_id AS empresa_id,
  a.modulo,
  a.record_type AS tipo_registro,
  a.record_id AS registro_id,
  a.original_name AS nome_original,
  a.storage_path AS caminho_storage,
  a.mime_type AS tipo_mime,
  a.size_bytes AS tamanho_bytes,
  a.metadata AS metadados,
  a.ocr_text AS texto_ocr,
  a.ocr_confidence AS confianca_ocr,
  a.ocr_status AS status_ocr,
  a.virus_scan_status AS status_virus,
  a.status,
  a.created_by AS criado_por,
  a.created_at AS criado_em,
  a.updated_at AS atualizado_em
FROM public.anexos a;

-- 4) Comentários para documentação
COMMENT ON VIEW public.vw_processos_pt IS 'View PT-BR para processos jurídicos - usa RLS das tabelas base';
COMMENT ON VIEW public.vw_processo_partes_pt IS 'View PT-BR para partes do processo - usa RLS das tabelas base';
COMMENT ON VIEW public.vw_contatos_pt IS 'View PT-BR para contatos/clientes - usa RLS das tabelas base';
COMMENT ON VIEW public.vw_agenda_pt IS 'View PT-BR para agenda/compromissos - usa RLS das tabelas base';
COMMENT ON VIEW public.vw_transacoes_financeiras_pt IS 'View PT-BR para transações financeiras - usa RLS das tabelas base';
COMMENT ON VIEW public.vw_etiquetas_pt IS 'View PT-BR para etiquetas/tags - usa RLS das tabelas base';
COMMENT ON VIEW public.vw_anexos_pt IS 'View PT-BR para anexos/documentos - usa RLS das tabelas base';