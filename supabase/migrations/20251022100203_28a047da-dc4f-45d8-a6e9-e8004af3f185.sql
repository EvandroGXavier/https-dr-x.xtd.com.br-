-- Atualizar a função de contexto para aceitar UUIDs

-- Tentar remover versões anteriores com assinatura integer
DROP FUNCTION IF EXISTS public.set_context(INTEGER, INTEGER);
-- Também remover uma possível assinatura (TEXT, TEXT) antiga
DROP FUNCTION IF EXISTS public.set_context(TEXT, TEXT);
-- Remover versão sem schema caso exista
DROP FUNCTION IF EXISTS set_context(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS set_context(TEXT, TEXT);

-- Recriar com assinatura UUID
CREATE OR REPLACE FUNCTION public.set_context(
  p_empresa UUID,
  p_filial UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Define o tenant (empresa) no contexto da sessão
  IF p_empresa IS NULL THEN
    PERFORM set_config('app.tenant_id', '', true);
  ELSE
    PERFORM set_config('app.tenant_id', p_empresa::text, true);
  END IF;

  -- Define a filial no contexto da sessão (opcional)
  IF p_filial IS NULL THEN
    PERFORM set_config('app.filial_id', '', true);
  ELSE
    PERFORM set_config('app.filial_id', p_filial::text, true);
  END IF;
END;
$$;