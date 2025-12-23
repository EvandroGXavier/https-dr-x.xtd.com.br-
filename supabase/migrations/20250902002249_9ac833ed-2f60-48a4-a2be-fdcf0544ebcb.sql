-- Fix security definer view issue by dropping the problematic view and replacing with a security definer function
-- The issue is that views can bypass RLS, so we need to ensure proper access control

-- Drop the existing view that's causing the security issue
DROP VIEW IF EXISTS public.vw_processo_anexos_consolidados;

-- Create a security definer function that respects RLS and returns the consolidated anexos data
CREATE OR REPLACE FUNCTION public.get_processo_anexos_consolidados(
  p_processo_id uuid DEFAULT NULL
)
RETURNS TABLE (
  processo_id uuid,
  anexo_id uuid,
  titulo text,
  arquivo_url text,
  origem origem_anexo,
  contato_id uuid,
  contato_nome text,
  created_at timestamp with time zone
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return data from processo_anexos with proper RLS applied
  RETURN QUERY
  SELECT 
    pa.processo_id,
    pa.id as anexo_id,
    pa.titulo,
    pa.arquivo_url,
    pa.origem,
    pa.contato_id,
    c.nome as contato_nome,
    pa.created_at
  FROM public.processo_anexos pa
  LEFT JOIN public.contatos c ON pa.contato_id = c.id
  WHERE pa.origem = 'processo'
    AND (p_processo_id IS NULL OR pa.processo_id = p_processo_id)
    AND (pa.user_id = auth.uid() OR has_role('admin')) -- Explicit RLS check

  UNION ALL

  SELECT 
    pp.processo_id,
    ca.id as anexo_id,
    ca.arquivo_nome_original as titulo,
    ca.arquivo_caminho as arquivo_url,
    'contato'::origem_anexo as origem,
    ca.contato_id,
    c.nome as contato_nome,
    ca.created_at
  FROM public.processo_partes pp
  JOIN public.contato_anexo ca ON pp.contato_id = ca.contato_id
  JOIN public.contatos c ON ca.contato_id = c.id
  WHERE ca.deleted_at IS NULL
    AND (p_processo_id IS NULL OR pp.processo_id = p_processo_id)
    AND (pp.user_id = auth.uid() OR has_role('admin')) -- Explicit RLS check
    AND (ca.user_id = auth.uid() OR has_role('admin')) -- Explicit RLS check
    AND (c.user_id = auth.uid() OR has_role('admin')); -- Explicit RLS check
END;
$$ LANGUAGE plpgsql;