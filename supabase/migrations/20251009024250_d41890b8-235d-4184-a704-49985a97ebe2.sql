
-- Migration: Remover campo ativo e usar sistema de etiquetas

-- 1. Criar etiqueta "Ativo" para todos os tenants (se não existir)
INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa)
SELECT DISTINCT 
  'Ativo' as nome,
  'ativo' as slug,
  '#22C55E' as cor,
  '✓' as icone,
  'Contato ativo no sistema' as descricao,
  tenant_id as user_id,
  true as ativa
FROM public.contatos_v2
WHERE NOT EXISTS (
  SELECT 1 FROM public.etiquetas e 
  WHERE e.slug = 'ativo' AND e.user_id = contatos_v2.tenant_id
);

-- 2. Criar vinculo de etiqueta "ativo" para todos os contatos que estão ativos
INSERT INTO public.etiqueta_vinculos (
  user_id,
  etiqueta_id, 
  referencia_tipo, 
  referencia_id,
  created_at
)
SELECT DISTINCT
  c.user_id,
  e.id as etiqueta_id,
  'contato' as referencia_tipo,
  c.id as referencia_id,
  now() as created_at
FROM public.contatos_v2 c
JOIN public.etiquetas e ON (e.slug = 'ativo' AND e.user_id = c.tenant_id)
WHERE c.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.etiqueta_vinculos ev
    WHERE ev.etiqueta_id = e.id 
      AND ev.referencia_id = c.id 
      AND ev.referencia_tipo = 'contato'
  );

-- 3. Remover o campo ativo da tabela contatos_v2
ALTER TABLE public.contatos_v2 
DROP COLUMN IF EXISTS ativo CASCADE;

-- 4. Atualizar view vw_contatos_completo para incluir status baseado em etiqueta
CREATE OR REPLACE VIEW public.vw_contatos_completo AS
SELECT 
  c.*,
  CASE 
    WHEN length(regexp_replace(c.cpf_cnpj, '[^0-9]', '', 'g')) = 11 THEN 'pf'
    WHEN length(regexp_replace(c.cpf_cnpj, '[^0-9]', '', 'g')) = 14 THEN 'pj'
    ELSE 'lead'
  END as tipo_deduzido,
  COALESCE(c.nome_fantasia, c.nome) as nome_display,
  EXISTS (
    SELECT 1 FROM public.etiqueta_vinculos ev
    JOIN public.etiquetas e ON ev.etiqueta_id = e.id
    WHERE ev.referencia_id = c.id 
      AND ev.referencia_tipo = 'contato'
      AND e.slug = 'ativo'
  ) as ativo
FROM public.contatos_v2 c;

-- Log da operação
COMMENT ON TABLE public.contatos_v2 IS 'Tabela de contatos - campo ativo substituído por sistema de etiquetas';
COMMENT ON VIEW public.vw_contatos_completo IS 'View com tipo deduzido e status ativo baseado em etiquetas';
