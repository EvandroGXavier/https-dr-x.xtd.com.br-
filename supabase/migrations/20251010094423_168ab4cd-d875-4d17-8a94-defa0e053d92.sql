-- =============================================================================
-- RECRIAR VIEWS COMPATIBILIDADE (VERSÃO FINAL - CAMPOS CORRETOS)
-- =============================================================================

CREATE OR REPLACE VIEW public.vw_contatos_compat AS
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

CREATE OR REPLACE VIEW public.vw_contatos_completo AS
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