-- ============================================================================
-- CORREÇÃO DA FUNÇÃO get_contexto_seguranca()
-- Alinha com o padrão do sistema onde tenant_id = auth.uid()
-- ============================================================================

BEGIN;

-- Recriar a função com a lógica correta
CREATE OR REPLACE FUNCTION public.get_contexto_seguranca()
RETURNS public.contexto_seguranca
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_contexto public.contexto_seguranca;
BEGIN
  -- 1. Pega o user_id do token de autenticação
  v_contexto.user_id := auth.uid();
  
  -- 2. No sistema atual, tenant_id = user_id (auth.uid())
  v_contexto.tenant_id := auth.uid();

  -- 3. TRAVA IMEDIATA: Se não houver usuário autenticado
  IF v_contexto.user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado. Ação bloqueada.';
  END IF;

  -- 4. Busca hierarquia (empresa_id e filial_id) no perfil do usuário
  SELECT empresa_id, filial_id
  INTO v_contexto.empresa_id, v_contexto.filial_id
  FROM public.profiles
  WHERE user_id = v_contexto.user_id;

  -- 5. TRAVA DE PERFIL: Verifica se o perfil tem os dados necessários
  IF v_contexto.empresa_id IS NULL OR v_contexto.filial_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de usuário incompleto (empresa_id ou filial_id não definidos). Configure seu perfil.';
  END IF;

  RETURN v_contexto;
END;
$$;

COMMIT;