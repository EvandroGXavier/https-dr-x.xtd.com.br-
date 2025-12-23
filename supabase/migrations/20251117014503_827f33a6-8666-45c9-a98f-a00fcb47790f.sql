-- Inicia uma transação segura.
BEGIN;

-- Garante que o usuário 'authenticated' (frontend) tenha uso do schema 'public'
GRANT USAGE ON SCHEMA public TO authenticated;

----------------------------------------------------------------
-- FASE 5: FUNÇÃO "COMPLEMENTAR" (RPC) - ATUALIZAR PROCESSO
-- Cria ou substitui a função de ATUALIZAR.
----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.atualizar_processo_v1(
  processo_id uuid, -- O ID do processo a ser atualizado
  dados_complementares JSONB
)
RETURNS void -- Retorna vazio
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador (para auditoria)
SET search_path = public
AS $$
DECLARE
  -- 1. Obter o "Básico" (Helper)
  v_contexto public.contexto_seguranca := public.get_contexto_seguranca();
  
  -- 2. Definir o "Complementar" (Campos específicos)
  v_numero_cnj TEXT;
  
  -- 3. Para Auditoria (guardar o estado anterior)
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- 3. Validação de Negócio (Lógica complementar)
  v_numero_cnj := dados_complementares ->> 'numero_cnj';
  IF v_numero_cnj IS NULL OR length(v_numero_cnj) < 5 THEN
    RAISE EXCEPTION 'O campo "numero_cnj" é obrigatório e deve ser válido.';
  END IF;

  -- 4. Captura o estado ANTERIOR para auditoria
  -- TRAVA DE SEGURANÇA: Só podemos atualizar o que pertence ao nosso contexto.
  SELECT row_to_json(p)
  INTO v_old_data
  FROM public.processos p
  WHERE id = processo_id
  AND tenant_id = v_contexto.tenant_id
  AND filial_id = v_contexto.filial_id; -- Trava de RLS/RBAC

  IF v_old_data IS NULL THEN
    RAISE EXCEPTION 'Processo não encontrado ou sem permissão para atualizar. (ID: %)', processo_id;
  END IF;

  -- 5. O UPDATE SEGURO (SQL Estático)
  -- Mescla o JSON existente com os novos dados complementares.
  -- 'updated_at' será atualizado automaticamente pelo trigger.
  UPDATE public.processos
  SET
    numero_cnj = v_numero_cnj,
    dados = v_old_data::jsonb || dados_complementares::jsonb 
  WHERE
    id = processo_id
  AND tenant_id = v_contexto.tenant_id -- Dupla verificação
  AND filial_id = v_contexto.filial_id -- Dupla verificação
  RETURNING row_to_json(processos) INTO v_new_data;

  -- 6. AUDITORIA CENTRALIZADA (Obrigatório pelo PROMPT)
  INSERT INTO public.auditoria 
    (actor_id, tenant_id, action, module, target_id, details)
  VALUES 
    (
      v_contexto.user_id, 
      v_contexto.tenant_id, 
      'update',             -- Ação
      'processos',          -- Módulo
      processo_id,          -- Alvo
      jsonb_build_object(
        'old', v_old_data,  -- O que era
        'new', v_new_data   -- O que ficou
      )
    );
END;
$$;


----------------------------------------------------------------
-- FASE 6: FUNÇÃO "COMPLEMENTAR" (RPC) - DELETAR PROCESSO
-- Cria ou substitui a função de DELETAR.
----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deletar_processo_v1(
  processo_id uuid -- O ID do processo a ser deletado
)
RETURNS void -- Retorna vazio
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- 1. Obter o "Básico" (Helper)
  v_contexto public.contexto_seguranca := public.get_contexto_seguranca();
  
  -- Para Auditoria
  v_old_data jsonb;
BEGIN
  -- 2. Captura o estado ANTERIOR para auditoria E verifica a permissão
  SELECT row_to_json(p)
  INTO v_old_data
  FROM public.processos p
  WHERE id = processo_id
  AND tenant_id = v_contexto.tenant_id
  AND filial_id = v_contexto.filial_id;

  IF v_old_data IS NULL THEN
    RAISE EXCEPTION 'Processo não encontrado ou sem permissão para deletar. (ID: %)', processo_id;
  END IF;

  -- 3. O DELETE SEGURO
  DELETE FROM public.processos
  WHERE
    id = processo_id
  AND tenant_id = v_contexto.tenant_id -- Trava de segurança
  AND filial_id = v_contexto.filial_id; -- Trava de segurança

  -- 4. AUDITORIA CENTRALIZADA (Obrigatório pelo PROMPT)
  INSERT INTO public.auditoria 
    (actor_id, tenant_id, action, module, target_id, details)
  VALUES 
    (
      v_contexto.user_id, 
      v_contexto.tenant_id, 
      'delete',             -- Ação
      'processos',          -- Módulo
      processo_id,          -- Alvo
      jsonb_build_object('deleted_record', v_old_data) -- Detalhes
    );
END;
$$;


----------------------------------------------------------------
-- FASE 7: HABILITAÇÃO DAS NOVAS RPCS
-- Garante que o frontend possa EXECUTAR estas funções.
----------------------------------------------------------------

-- Concede permissão para o 'authenticated' (frontend) EXECUTAR as funções.
GRANT EXECUTE ON FUNCTION public.atualizar_processo_v1(uuid, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.deletar_processo_v1(uuid) TO authenticated;


-- Finaliza a transação
COMMIT;