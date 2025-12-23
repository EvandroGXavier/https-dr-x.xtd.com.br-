-- Limpeza da tabela contatos antiga - Estratégia Simples

-- Primeiro, deletar todos os contatos da tabela antiga
DELETE FROM public.contatos;

-- Log da operação
INSERT INTO public.security_audit_log (
  user_id,
  event_type,
  event_description,
  metadata
) VALUES (
  auth.uid(),
  'data_cleanup',
  'Limpeza da tabela contatos antiga para migração V2',
  jsonb_build_object(
    'operation', 'contatos_v1_cleanup',
    'reason', 'Preparação para Contatos V2'
  )
);