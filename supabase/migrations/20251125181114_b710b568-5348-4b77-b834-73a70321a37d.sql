-- =============================================================================
-- CRITICAL SECURITY FIX: Adicionar security_invoker=true em TODAS as views
-- Issue: Views sem security_invoker ignoram RLS e causam vazamento de dados
-- =============================================================================

-- 1. security_status
DROP VIEW IF EXISTS public.security_status CASCADE;
CREATE VIEW public.security_status 
WITH (security_invoker = true) AS
SELECT
  t.tablename,
  COUNT(p.policyname) AS policy_count,
  c.relrowsecurity AS rls_enabled,
  CASE 
    WHEN COUNT(p.policyname) = 0 AND c.relrowsecurity THEN 'WARNING'
    WHEN COUNT(p.policyname) > 0 AND c.relrowsecurity THEN 'OK'
    WHEN NOT c.relrowsecurity THEN 'CRITICAL'
    ELSE 'UNKNOWN'
  END AS status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
GROUP BY t.tablename, c.relrowsecurity
ORDER BY status, t.tablename;

GRANT SELECT ON public.security_status TO authenticated, service_role;

-- 2. v_produtos_busca
DROP VIEW IF EXISTS public.v_produtos_busca CASCADE;
CREATE VIEW public.v_produtos_busca 
WITH (security_invoker = true) AS
SELECT
  p.id, p.tenant_id, p.nome, p.apelido, p.sku, p.codigo_barras, p.ncm,
  p.status, p.preco_base, p.marca_id, p.categoria_id, p.unidade_id,
  p.foto_capa_url, p.created_at, p.updated_at,
  COALESCE(p.nome,'') || ' ' || COALESCE(p.apelido,'') || ' ' || COALESCE(p.sku,'') || ' ' || COALESCE(p.codigo_barras,'') AS termo
FROM public.produtos p;

GRANT SELECT ON public.v_produtos_busca TO authenticated, service_role;

-- 3. v_produtos_estoque
DROP VIEW IF EXISTS public.v_produtos_estoque CASCADE;
CREATE VIEW public.v_produtos_estoque 
WITH (security_invoker = true) AS
SELECT
  p.id AS produto_id,
  p.tenant_id,
  COALESCE((SELECT SUM(ci.quantidade) FROM public.compras_itens ci WHERE ci.produto_id = p.id), 0) AS total_comprado,
  COALESCE((SELECT SUM(vi.quantidade) FROM public.vendas_itens vi WHERE vi.produto_id = p.id), 0) AS total_vendido,
  (COALESCE((SELECT SUM(ci.quantidade) FROM public.compras_itens ci WHERE ci.produto_id = p.id), 0) -
   COALESCE((SELECT SUM(vi.quantidade) FROM public.vendas_itens vi WHERE vi.produto_id = p.id), 0)) AS estoque_atual
FROM public.produtos p;

GRANT SELECT ON public.v_produtos_estoque TO authenticated, service_role;

-- 4. vw_atendimento_stats
DROP VIEW IF EXISTS public.vw_atendimento_stats CASCADE;
CREATE VIEW public.vw_atendimento_stats 
WITH (security_invoker = true) AS
SELECT 
  COUNT(*) FILTER (WHERE status_atendimento = 'aberto') AS abertos,
  COUNT(*) FILTER (WHERE status_atendimento = 'pendente') AS pendentes,
  COUNT(*) FILTER (WHERE status_atendimento = 'resolvido') AS resolvidos,
  COUNT(*) FILTER (WHERE responsavel_id IS NULL) AS nao_atribuidos,
  COUNT(*) FILTER (WHERE responsavel_id = auth.uid()) AS meus_atendimentos,
  AVG(EXTRACT(epoch FROM data_resolucao - created_at) / 3600) FILTER (WHERE status_atendimento = 'resolvido') AS tempo_medio_resolucao_horas
FROM public.wa_atendimentos
WHERE user_id = auth.uid() OR responsavel_id = auth.uid();

GRANT SELECT ON public.vw_atendimento_stats TO authenticated, service_role;

-- 5. vw_biblioteca_grid
DROP VIEW IF EXISTS public.vw_biblioteca_grid CASCADE;
CREATE VIEW public.vw_biblioteca_grid 
WITH (security_invoker = true) AS
SELECT
  m.id,
  m.titulo,
  m.descricao,
  m.data_criacao,
  m.data_atualizacao,
  m.criado_por,
  m.atualizado_por,
  m.tenant_id,
  COALESCE(string_agg(DISTINCT e.nome, ', ' ORDER BY e.nome), '') AS etiquetas
FROM public.biblioteca_modelos_v2 m
LEFT JOIN public.etiqueta_vinculos ev
  ON m.id::text = ev.referencia_id::text AND ev.referencia_tipo = 'biblioteca'
LEFT JOIN public.etiquetas e
  ON e.id::text = ev.etiqueta_id::text
WHERE m.data_exclusao_logica IS NULL
GROUP BY m.id, m.titulo, m.descricao, m.data_criacao, m.data_atualizacao, m.criado_por, m.atualizado_por, m.tenant_id;

GRANT SELECT ON public.vw_biblioteca_grid TO authenticated, service_role;
COMMENT ON VIEW public.vw_biblioteca_grid IS 'Grid otimizada da Biblioteca V2 com etiquetas agregadas.';

-- 6. vw_contatos_compat (IMPORTANTE: Dependência de vw_contatos_completo)
DROP VIEW IF EXISTS public.vw_contatos_completo CASCADE;
DROP VIEW IF EXISTS public.vw_contatos_compat CASCADE;

CREATE VIEW public.vw_contatos_compat 
WITH (security_invoker = true) AS
SELECT 
  c.id,
  c.nome_fantasia,
  c.cpf_cnpj,
  c.observacao,
  c.classificacao,
  c.responsavel_id,
  c.created_at,
  c.updated_at,
  c.empresa_id,
  c.filial_id,
  c.user_id,
  c.tenant_id,
  (SELECT cm.valor 
   FROM public.contato_meios_contato cm 
   WHERE cm.contato_id = c.id 
     AND cm.tipo = 'Email' 
     AND cm.principal = true 
   LIMIT 1) as email,
  (SELECT cm.valor 
   FROM public.contato_meios_contato cm 
   WHERE cm.contato_id = c.id 
     AND cm.tipo = 'Celular' 
     AND cm.principal = true 
   LIMIT 1) as celular,
  (SELECT cm.valor 
   FROM public.contato_meios_contato cm 
   WHERE cm.contato_id = c.id 
     AND cm.tipo = 'Telefone' 
   LIMIT 1) as telefone
FROM public.contatos_v2 c;

GRANT SELECT ON public.vw_contatos_compat TO authenticated, service_role;

-- 7. vw_contatos_completo (Depende de vw_contatos_compat - criar APÓS)
CREATE VIEW public.vw_contatos_completo 
WITH (security_invoker = true) AS
SELECT 
  vc.*,
  pf.cpf,
  pf.rg,
  pf.data_nascimento,
  pf.sexo,
  pf.estado_civil,
  pf.profissao,
  pj.cnpj,
  pj.razao_social,
  pj.data_abertura,
  pj.porte,
  pj.natureza_juridica
FROM public.vw_contatos_compat vc
LEFT JOIN public.contato_pf pf ON vc.id = pf.contato_id
LEFT JOIN public.contato_pj pj ON vc.id = pj.contato_id;

GRANT SELECT ON public.vw_contatos_completo TO authenticated, service_role;

-- 8. vw_contatos_whatsapp
DROP VIEW IF EXISTS public.vw_contatos_whatsapp CASCADE;
CREATE VIEW public.vw_contatos_whatsapp 
WITH (security_invoker = true) AS
SELECT 
  c.id AS contato_id,
  c.tenant_id,
  COALESCE(c.nome_fantasia, 'Sem nome') AS nome_exibicao,
  m.valor AS numero_whatsapp
FROM public.contatos_v2 c
JOIN public.contato_meios_contato m ON m.contato_id = c.id
WHERE m.tipo ILIKE 'celular';

GRANT SELECT ON public.vw_contatos_whatsapp TO authenticated, service_role;

-- 9. vw_wa_contatos
DROP VIEW IF EXISTS public.vw_wa_contatos CASCADE;
CREATE VIEW public.vw_wa_contatos 
WITH (security_invoker = true) AS
SELECT
  c.id AS contato_id,
  c.user_id,
  COALESCE(c.nome_fantasia, 'Sem nome') AS nome_exibicao,
  w.wa_phone_e164 AS numero_whatsapp,
  w.profile_name,
  w.opt_in_status,
  w.last_seen_at,
  w.created_at AS data_vinculo
FROM public.wa_contacts w
JOIN public.contatos_v2 c ON c.id = w.contato_id
WHERE w.contato_id IS NOT NULL;

GRANT SELECT ON public.vw_wa_contatos TO authenticated, service_role;

-- 10. vw_wa_threads
DROP VIEW IF EXISTS public.vw_wa_threads CASCADE;
CREATE VIEW public.vw_wa_threads 
WITH (security_invoker = true) AS
SELECT
  a.id AS thread_id,
  a.wa_contact_id,
  wc.contato_id,
  a.user_id,
  a.status,
  a.responsavel_id,
  a.last_message_at AS ultima_mensagem,
  COUNT(m.id) AS total_mensagens,
  SUM(CASE WHEN m.direction='in' AND m.read_at IS NULL THEN 1 ELSE 0 END) AS mensagens_nao_lidas,
  MAX(m.timestamp) AS timestamp_ultima_mensagem,
  COALESCE(cv.nome_fantasia, 'Sem nome') AS contato_nome
FROM public.wa_atendimentos a
LEFT JOIN public.wa_contacts wc ON wc.id = a.wa_contact_id
LEFT JOIN public.contatos_v2 cv ON cv.id = wc.contato_id
LEFT JOIN public.wa_messages m ON m.thread_id = a.id
GROUP BY a.id, a.wa_contact_id, wc.contato_id, a.user_id, a.status, a.responsavel_id, a.last_message_at, cv.nome_fantasia;

GRANT SELECT ON public.vw_wa_threads TO authenticated, service_role;

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================
COMMENT ON VIEW public.security_status IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.v_produtos_busca IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.v_produtos_estoque IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_atendimento_stats IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_biblioteca_grid IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_contatos_compat IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_contatos_completo IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_contatos_whatsapp IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_wa_contatos IS 'Security-invoker enabled: Respects RLS';
COMMENT ON VIEW public.vw_wa_threads IS 'Security-invoker enabled: Respects RLS';