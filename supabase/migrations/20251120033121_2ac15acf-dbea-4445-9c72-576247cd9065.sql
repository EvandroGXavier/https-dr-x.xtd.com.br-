
-- Corrigir RPC criar_processo_v1 para usar empresa_id como tenant_id
-- Conforme padrão TENANT_ID_PATTERN: tenant_id = empresa_id

CREATE OR REPLACE FUNCTION public.criar_processo_v1(dados_complementares jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_empresa_id uuid;
  v_filial_id uuid;
  v_processo_id uuid;
  v_titulo text;
  v_descricao text;
  v_local text;
  v_status text;
BEGIN
  -- 1. Capturar ID do usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 2. Capturar empresa_id e filial_id do profile do usuário
  -- CORREÇÃO: Remover referência a tenant_id que não existe em profiles
  SELECT empresa_id, filial_id 
  INTO v_empresa_id, v_filial_id
  FROM public.profiles 
  WHERE user_id = v_user_id;

  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de usuário sem empresa_id vinculado.';
  END IF;

  -- 3. Extrair dados do JSON recebido
  v_titulo := COALESCE(dados_complementares->>'titulo', 'Novo Processo');
  v_descricao := dados_complementares->>'descricao';
  v_local := dados_complementares->>'local';
  v_status := COALESCE(dados_complementares->>'status', 'ativo');

  -- 4. Inserção na tabela processos
  -- PADRÃO CRÍTICO: tenant_id = empresa_id (conforme TENANT_ID_PATTERN.md)
  INSERT INTO public.processos (
    user_id,
    tenant_id,
    empresa_id,
    filial_id,
    titulo,
    descricao,
    local,
    status
  ) VALUES (
    v_user_id,
    v_empresa_id,  -- tenant_id = empresa_id
    v_empresa_id,
    v_filial_id,
    v_titulo,
    v_descricao,
    v_local,
    v_status
  ) RETURNING id INTO v_processo_id;

  -- 5. Log de auditoria
  INSERT INTO public.auditoria (
    tenant_id,
    actor_id,
    module,
    action,
    target_id,
    details
  ) VALUES (
    v_empresa_id,  -- tenant_id = empresa_id
    v_user_id,
    'processos',
    'create',
    v_processo_id,
    jsonb_build_object(
      'titulo', v_titulo,
      'status', v_status
    )
  );

  RETURN v_processo_id;
END;
$$;

-- Corrigir também o RPC atualizar_processo_v1
CREATE OR REPLACE FUNCTION public.atualizar_processo_v1(
  processo_id uuid,
  dados_complementares jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_empresa_id uuid;
BEGIN
  -- Capturar ID do usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Capturar empresa_id do profile (para auditoria)
  SELECT empresa_id 
  INTO v_empresa_id
  FROM public.profiles 
  WHERE user_id = v_user_id;

  -- Atualizar processo
  UPDATE public.processos
  SET
    titulo = COALESCE(dados_complementares->>'titulo', titulo),
    descricao = COALESCE(dados_complementares->>'descricao', descricao),
    local = COALESCE(dados_complementares->>'local', local),
    status = COALESCE(dados_complementares->>'status', status),
    updated_at = now()
  WHERE id = processo_id
    AND tenant_id = v_empresa_id;  -- RLS: só atualiza se pertence ao tenant

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Processo não encontrado ou sem permissão';
  END IF;

  -- Log de auditoria
  INSERT INTO public.auditoria (
    tenant_id,
    actor_id,
    module,
    action,
    target_id,
    details
  ) VALUES (
    v_empresa_id,
    v_user_id,
    'processos',
    'update',
    processo_id,
    dados_complementares
  );
END;
$$;
