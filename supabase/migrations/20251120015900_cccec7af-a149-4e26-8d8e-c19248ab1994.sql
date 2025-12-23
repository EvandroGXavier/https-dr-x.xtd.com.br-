-- Correção da função get_contexto_seguranca para buscar tenant_id do profile
-- quando não estiver presente no JWT token

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
  -- 1. Obter user_id do token (obrigatório)
  v_contexto.user_id := auth.uid();
  
  -- 2. Validar user_id PRIMEIRO (não depende de tenant_id)
  IF v_contexto.user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado. Ação bloqueada.';
  END IF;

  -- 3. Tentar obter tenant_id do JWT token primeiro
  v_contexto.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
  
  -- 4. Se não estiver no JWT, buscar do profile (FALLBACK)
  IF v_contexto.tenant_id IS NULL THEN
    SELECT empresa_id 
    INTO v_contexto.tenant_id
    FROM public.profiles 
    WHERE user_id = v_contexto.user_id;
  END IF;
  
  -- 5. Validar tenant_id DEPOIS de tentar buscar do profile
  IF v_contexto.tenant_id IS NULL THEN
    RAISE EXCEPTION 'Usuário sem empresa configurada. Configure no perfil antes de continuar.';
  END IF;

  -- 6. Buscar hierarquia completa do perfil
  SELECT empresa_id, filial_id
  INTO v_contexto.empresa_id, v_contexto.filial_id
  FROM public.profiles 
  WHERE user_id = v_contexto.user_id;
  
  -- 7. Validação final de consistência
  IF v_contexto.empresa_id IS NULL THEN
    RAISE EXCEPTION 'Hierarquia de empresa inválida. Verifique o perfil do usuário.';
  END IF;
  
  -- 8. GARANTIR: tenant_id = empresa_id (Padrão do Sistema)
  v_contexto.tenant_id := v_contexto.empresa_id;
  
  RETURN v_contexto;
END;
$$;

COMMENT ON FUNCTION public.get_contexto_seguranca() IS 
'Obtém contexto de segurança do usuário autenticado.
Busca tenant_id do JWT primeiro, depois do profile como fallback.
REGRA: tenant_id SEMPRE = empresa_id (conforme TENANT_ID_PATTERN.md)';