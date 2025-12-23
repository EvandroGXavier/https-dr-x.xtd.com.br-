-- Limpeza de dados órfãos relacionados a contatos

-- 1. Deletar vínculos de etiquetas órfãos de contatos
DELETE FROM public.etiqueta_vinculos 
WHERE referencia_tipo = 'contatos' 
AND referencia_id NOT IN (SELECT id FROM public.contatos);

-- 2. Deletar agendas órfãs
DELETE FROM public.agendas WHERE 
  (contato_responsavel_id IS NOT NULL AND contato_responsavel_id NOT IN (SELECT id FROM public.contatos))
  OR 
  (contato_solicitante_id IS NOT NULL AND contato_solicitante_id NOT IN (SELECT id FROM public.contatos));

-- 3. Deletar partes de processos órfãs
DELETE FROM public.processo_partes 
WHERE contato_id NOT IN (SELECT id FROM public.contatos);

-- 4. Deletar transações financeiras órfãs
DELETE FROM public.transacoes_financeiras 
WHERE contato_id IS NOT NULL 
AND contato_id NOT IN (SELECT id FROM public.contatos);

-- 5. Deletar contratos órfãos
DELETE FROM public.processo_contratos 
WHERE cliente_contrato_id NOT IN (SELECT id FROM public.contatos);

-- 6. Deletar anexos órfãos de contatos
DELETE FROM public.contato_anexo 
WHERE contato_id NOT IN (SELECT id FROM public.contatos);

-- 7. Deletar jobs AID órfãos
DELETE FROM public.aid_jobs 
WHERE contato_id IS NOT NULL 
AND contato_id NOT IN (SELECT id FROM public.contatos);

-- 8. Log da limpeza
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
) VALUES (
  auth.uid(),
  'data_cleanup',
  'Limpeza de dados órfãos relacionados a contatos',
  jsonb_build_object(
    'operation', 'orphan_cleanup',
    'reason', 'Preparação final para Contatos V2'
  )
);