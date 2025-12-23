-- Migração para limpeza completa da tabela contatos antiga e dados relacionados
-- Isso garante que não haverá conflitos com o novo sistema Contatos V2

-- 1. Deletar vínculos de etiquetas com contatos
DELETE FROM public.etiqueta_vinculos WHERE referencia_tipo = 'contatos';

-- 2. Deletar agendas que referenciam contatos da tabela antiga
DELETE FROM public.agendas WHERE 
  contato_responsavel_id IN (SELECT id FROM public.contatos) OR 
  contato_solicitante_id IN (SELECT id FROM public.contatos);

-- 3. Deletar partes de processos que referenciam contatos antigos
DELETE FROM public.processo_partes WHERE contato_id IN (SELECT id FROM public.contatos);

-- 4. Deletar transações financeiras que referenciam contatos antigos
DELETE FROM public.transacoes_financeiras WHERE contato_id IN (SELECT id FROM public.contatos);

-- 5. Deletar contratos que referenciam contatos antigos
DELETE FROM public.processo_contratos WHERE 
  cliente_contrato_id IN (SELECT id FROM public.contatos) OR
  advogado_contrato_id IN (SELECT id FROM public.contatos);

-- 6. Deletar logs de anexos de contatos
DELETE FROM public.contato_anexo_log WHERE contato_anexo_id IN (
  SELECT id FROM public.contato_anexo WHERE contato_id IN (SELECT id FROM public.contatos)
);

-- 7. Deletar anexos de contatos
DELETE FROM public.contato_anexo WHERE contato_id IN (SELECT id FROM public.contatos);

-- 8. Deletar documentos de contatos antigos (se existir referência direta)
DELETE FROM public.contato_documentos WHERE contato_id IN (SELECT id FROM public.contatos);

-- 9. Deletar honorários que referenciam contatos antigos
DELETE FROM public.processo_honorarios WHERE cliente_id IN (SELECT id FROM public.contatos);

-- 10. Deletar auditorias que podem referenciar contatos antigos
DELETE FROM public.security_audit_log WHERE 
  metadata->>'table_name' = 'contatos' AND 
  metadata->>'record_id' IN (SELECT id::text FROM public.contatos);

-- 11. Deletar jobs do AID relacionados a contatos antigos
DELETE FROM public.aid_jobs WHERE contato_id IN (SELECT id FROM public.contatos);

-- 12. Finalmente, deletar todos os contatos da tabela antiga
DELETE FROM public.contatos;

-- 13. Reset da sequência se houver (para garantir IDs limpos quando recriados)
-- Como usamos UUID, não há sequência, mas vamos garantir que a tabela está totalmente limpa

-- 14. Log da operação de limpeza
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
) VALUES (
  auth.uid(),
  'data_cleanup',
  'Limpeza completa da tabela contatos antiga e dados relacionados',
  jsonb_build_object(
    'operation', 'contatos_v1_cleanup',
    'reason', 'Migração para Contatos V2',
    'timestamp', extract(epoch from now())
  )
);

-- Comentário: As novas tabelas do sistema V2 são preservadas:
-- - contato_enderecos
-- - contato_pf  
-- - contato_pj
-- - contato_meios_contato
-- - contato_vinculos
-- - contato_financeiro_config
-- Estas tabelas fazem parte da nova arquitetura e não devem ser afetadas.