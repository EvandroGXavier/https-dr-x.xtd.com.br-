-- Fix type mismatch in saas_list_empresas_com_assinatura (varchar -> text)
CREATE OR REPLACE FUNCTION public.saas_list_empresas_com_assinatura()
RETURNS TABLE(
  empresa_id integer,
  razao_social text,
  nome_fantasia text,
  plano text,
  valor numeric,
  dia_vencimento integer,
  status text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id AS empresa_id,
    e.nome::text AS razao_social,
    e.nome::text AS nome_fantasia,
    COALESCE(a.plano_id::text, e.plano::text, 'Sem plano') AS plano,
    COALESCE(a.valor_mensal, e.valor_plano, 0)::numeric AS valor,
    COALESCE(a.dia_vencimento, 10)::int AS dia_vencimento,
    COALESCE(a.status, CASE WHEN e.ativa THEN 'ATIVA' ELSE 'INATIVA' END)::text AS status,
    COALESCE(e.updated_at, e.created_at) AS updated_at
  FROM public.saas_empresas e
  LEFT JOIN public.saas_assinaturas a ON e.id = a.empresa_id
  ORDER BY e.created_at DESC;
END;
$function$;