-- Atualizar função get_agendas_with_contacts para incluir filtro por etiquetas
CREATE OR REPLACE FUNCTION public.get_agendas_with_contacts(
  limit_count integer DEFAULT 100,
  offset_count integer DEFAULT 0,
  status_filter agenda_status DEFAULT NULL,
  responsavel_filter uuid DEFAULT NULL,
  solicitante_filter uuid DEFAULT NULL,
  etiqueta_filter uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  titulo text,
  descricao text,
  data_inicio timestamp with time zone,
  data_fim timestamp with time zone,
  status agenda_status,
  prioridade text,
  observacoes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  responsavel_nome text,
  responsavel_email text,
  solicitante_nome text,
  solicitante_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.titulo,
    a.descricao,
    a.data_inicio,
    a.data_fim,
    a.status,
    a.prioridade,
    a.observacoes,
    a.created_at,
    a.updated_at,
    cr.nome as responsavel_nome,
    cr.email as responsavel_email,
    cs.nome as solicitante_nome,
    cs.email as solicitante_email
  FROM public.agendas a
  LEFT JOIN public.contatos cr ON a.contato_responsavel_id = cr.id
  LEFT JOIN public.contatos cs ON a.contato_solicitante_id = cs.id
  LEFT JOIN public.etiqueta_vinculos ev ON (a.id = ev.referencia_id AND ev.referencia_tipo = 'agenda')
  WHERE (a.user_id = auth.uid() OR has_role('admin'))
    AND (status_filter IS NULL OR a.status = status_filter)
    AND (responsavel_filter IS NULL OR a.contato_responsavel_id = responsavel_filter)
    AND (solicitante_filter IS NULL OR a.contato_solicitante_id = solicitante_filter)
    AND (etiqueta_filter IS NULL OR ev.etiqueta_id = etiqueta_filter)
  GROUP BY a.id, cr.nome, cr.email, cs.nome, cs.email
  ORDER BY a.data_inicio DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$function$;