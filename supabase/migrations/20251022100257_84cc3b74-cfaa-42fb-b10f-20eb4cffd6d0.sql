-- Criar função separada para contexto com UUIDs, evitando conflito de assinatura
CREATE OR REPLACE FUNCTION public.set_context_uuid(
  p_empresa UUID,
  p_filial UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Define tenant (empresa)
  PERFORM set_config('app.tenant_id', COALESCE(p_empresa::text, ''), true);
  -- Define filial
  PERFORM set_config('app.filial_id', COALESCE(p_filial::text, ''), true);
END;
$$;