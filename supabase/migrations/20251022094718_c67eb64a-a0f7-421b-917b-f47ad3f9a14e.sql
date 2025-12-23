
-- Drop e recriar função com nova assinatura UUID
DROP FUNCTION IF EXISTS public.saas_list_empresas_com_assinatura();

CREATE OR REPLACE FUNCTION public.saas_list_empresas_com_assinatura()
RETURNS TABLE (
  empresa_uuid UUID,
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  plano TEXT,
  valor NUMERIC,
  dia_vencimento INTEGER,
  status TEXT,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id AS empresa_uuid,
    e.nome AS razao_social,
    e.nome AS nome_fantasia,
    e.cnpj,
    e.plano,
    COALESCE(a.valor_mensal, 0) AS valor,
    COALESCE(a.dia_vencimento, 10) AS dia_vencimento,
    CASE 
      WHEN e.ativa = false THEN 'CANCELADA'
      WHEN a.status = 'trial' THEN 'TRIAL'
      WHEN a.status = 'ativa' THEN 'ATIVA'
      ELSE 'INADIMPLENTE'
    END AS status,
    e.updated_at
  FROM public.saas_empresas e
  LEFT JOIN public.saas_assinaturas a ON a.empresa_id = e.id
  WHERE e.ativa = true
  ORDER BY e.nome;
$$;
