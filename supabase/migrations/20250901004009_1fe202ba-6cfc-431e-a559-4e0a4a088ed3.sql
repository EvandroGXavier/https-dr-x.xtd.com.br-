-- Corrigir função com search_path para segurança
CREATE OR REPLACE FUNCTION public.saas_list_empresas_com_assinatura()
RETURNS TABLE(
  empresa_id integer,
  razao_social text,
  nome_fantasia text,
  plano text,
  valor numeric,
  dia_vencimento int,
  status text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se é superadmin
  IF NOT EXISTS(SELECT 1 FROM public.saas_superadmins s WHERE s.email = auth.email()) 
     AND auth.role() != 'service_role' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    e.id as empresa_id,
    e.nome as razao_social,
    COALESCE(e.nome, '') as nome_fantasia,
    COALESCE(p.nome, 'Sem plano') as plano,
    COALESCE(a.valor_mensal, 0) as valor,
    COALESCE(a.dia_vencimento, 1) as dia_vencimento,
    COALESCE(a.status, 'INATIVA') as status,
    COALESCE(a.updated_at, e.updated_at) as updated_at
  FROM public.empresas e
  LEFT JOIN public.saas_assinaturas a ON a.empresa_id = e.id
  LEFT JOIN public.saas_planos p ON p.id = a.plano_id
  ORDER BY e.nome;
END;
$$;