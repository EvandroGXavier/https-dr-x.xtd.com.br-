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
  cliente_contrato_id IN (SELECT id FROM public.contatos);

-- 6. Deletar anexos de processos que referenciam contatos antigos
DELETE FROM public.processo_anexos WHERE contato_id IN (SELECT id FROM public.contatos);

-- 7. Deletar logs de anexos de contatos
DELETE FROM public.contato_anexo_log WHERE contato_anexo_id IN (
  SELECT id FROM public.contato_anexo WHERE contato_id IN (SELECT id FROM public.contatos)
);

-- 8. Deletar anexos de contatos
DELETE FROM public.contato_anexo WHERE contato_id IN (SELECT id FROM public.contatos);

-- 9. Deletar documentos de contatos antigos
DELETE FROM public.contato_documentos WHERE contato_id IN (SELECT id FROM public.contatos);

-- 10. Deletar gerações de documentos que referenciam contatos antigos
DELETE FROM public.documentos_geracoes WHERE contato_id IN (SELECT id FROM public.contatos);

-- 11. Deletar logs de email que referenciam contatos antigos
DELETE FROM public.email_logs WHERE contato_id IN (SELECT id FROM public.contatos);

-- 12. Deletar links do WhatsApp que referenciam contatos antigos
DELETE FROM public.whatsapp_contacts_link WHERE contato_id IN (SELECT id FROM public.contatos);

-- 13. Deletar contatos do WhatsApp que referenciam contatos antigos
DELETE FROM public.wa_contacts WHERE contato_id IN (SELECT id FROM public.contatos);

-- 14. Deletar auditorias que podem referenciar contatos antigos
DELETE FROM public.security_audit_log WHERE 
  metadata->>'table_name' = 'contatos' AND 
  metadata->>'record_id' IN (SELECT id::text FROM public.contatos);

-- 15. Deletar jobs do AID relacionados a contatos antigos
DELETE FROM public.aid_jobs WHERE contato_id IN (SELECT id FROM public.contatos);

-- 16. Deletar relações de anexos que podem referenciar contatos
DELETE FROM public.anexo_relacoes WHERE 
  modulo = 'contatos' AND 
  record_id IN (SELECT id FROM public.contatos);

-- 17. Finalmente, deletar todos os contatos da tabela antiga
DELETE FROM public.contatos;

-- 18. Log da operação de limpeza
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
    'timestamp', extract(epoch from now()),
    'tables_cleaned', jsonb_build_array(
      'etiqueta_vinculos',
      'agendas', 
      'processo_partes',
      'transacoes_financeiras',
      'processo_contratos',
      'processo_anexos',
      'contato_anexo_log',
      'contato_anexo',
      'contato_documentos',
      'documentos_geracoes',
      'email_logs',
      'whatsapp_contacts_link',
      'wa_contacts',
      'security_audit_log',
      'aid_jobs',
      'anexo_relacoes',
      'contatos'
    )
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