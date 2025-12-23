-- Migration to update criar_processo_v1 to handle judicial fields with proper permissions
-- Timestamp: 20251209223000

-- Step 1: Grant necessary permissions for the RPC to bypass RLS
-- This is required because REVOKE removed INSERT/UPDATE/DELETE from authenticated users
GRANT EXECUTE ON FUNCTION public.criar_processo_v1(jsonb) TO authenticated;

-- Step 2: Recreate the RPC with complete logic
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
  
  -- Campos Processo
  v_titulo text;
  v_descricao text;
  v_local text;
  v_status text;
  
  -- Campos Judicial
  v_numero_processo text;
  v_tribunal text;
  v_vara text;
  v_comarca text;
  v_uf text;
  v_instancia text;
  v_tipo_acao text;
BEGIN
  -- 1. Capturar ID do usuário autenticado
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- 2. Capturar empresa_id e filial_id do profile do usuário
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
  
  -- Extrair dados judiciais
  v_numero_processo := dados_complementares->>'numero_processo';
  v_tribunal := dados_complementares->>'tribunal_orgao'; -- Mapear tribunal_orgao -> tribunal
  v_vara := dados_complementares->>'vara_turma'; -- Mapear vara_turma -> vara
  v_comarca := dados_complementares->>'localidade'; -- Mapear localidade -> comarca
  v_uf := dados_complementares->>'uf';
  v_instancia := dados_complementares->>'instancia';
  v_tipo_acao := dados_complementares->>'tipo_acao';

  -- Validar enum instancia (mapear valores da UI para o banco se necessário)
  -- UI: 1ª, 2ª, 3ª -> DB: primeira, segunda, superior, suprema
  IF v_instancia = '1ª' THEN 
    v_instancia := 'primeira';
  ELSIF v_instancia = '2ª' THEN 
    v_instancia := 'segunda';
  ELSIF v_instancia = '3ª' THEN 
    v_instancia := 'superior';
  END IF;

  -- 4. Inserção na tabela processos
  -- SECURITY DEFINER permite bypassing RLS
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

  -- 5. Inserção na tabela processos_tj (se houver dados judiciais)
  IF v_numero_processo IS NOT NULL OR v_tribunal IS NOT NULL THEN
    INSERT INTO public.processos_tj (
      processo_id,
      tenant_id,
      numero_oficial,
      numero_cnj,
      tribunal,
      vara,
      comarca,
      uf,
      instancia,
      classe,
      origem_dados
    ) VALUES (
      v_processo_id,
      v_empresa_id,
      COALESCE(v_numero_processo, 'S/N'), -- numero_oficial (pode ser CNJ ou outro formato)
      v_numero_processo, -- numero_cnj (campo específico para CNJ)
      v_tribunal,
      v_vara,
      v_comarca,
      v_uf,
      v_instancia,
      v_tipo_acao, -- classe
      'manual'
    );
  END IF;

  -- 6. Log de auditoria
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
    'create',
    v_processo_id,
    jsonb_build_object(
      'titulo', v_titulo,
      'status', v_status,
      'numero_cnj', v_numero_processo
    )
  );

  RETURN v_processo_id;
END;
$$;

-- Step 3: Ensure authenticated users can execute this function
GRANT EXECUTE ON FUNCTION public.criar_processo_v1(jsonb) TO authenticated;

-- Step 4: Add helpful comment
COMMENT ON FUNCTION public.criar_processo_v1(jsonb) IS 
'RPC para criar processos com dados judiciais. SECURITY DEFINER bypassa RLS. Valida tenant_id automaticamente.';
