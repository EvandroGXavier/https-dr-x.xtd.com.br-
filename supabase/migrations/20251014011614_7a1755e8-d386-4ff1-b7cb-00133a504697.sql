-- Hard Reset do Módulo de Agenda V1
-- Limpa a tabela principal e, em cascata, todas as tabelas relacionadas.
-- Esta operação é IRREVERSÍVEL e apagará permanentemente todos os dados.

TRUNCATE TABLE public.agendas RESTART IDENTITY CASCADE;

-- O CASCADE automaticamente limpará:
-- - public.agenda_partes
-- - public.agenda_locais
-- - public.agenda_etapas
-- - public.agenda_etiquetas

-- Registrar evento de auditoria
INSERT INTO public.auditorias (
  tenant_id,
  actor,
  module,
  action,
  target,
  payload
) VALUES (
  auth.uid(),
  auth.uid(),
  'agenda',
  'purge_v1',
  'agendas',
  jsonb_build_object(
    'description', 'Limpeza completa do módulo Agenda V1',
    'timestamp', now(),
    'affected_tables', ARRAY['agendas', 'agenda_partes', 'agenda_locais', 'agenda_etapas', 'agenda_etiquetas']
  )
);