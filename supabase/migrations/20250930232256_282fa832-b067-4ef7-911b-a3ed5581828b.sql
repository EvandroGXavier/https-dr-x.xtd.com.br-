-- Função para criar vínculo bidirecional de forma atômica
CREATE OR REPLACE FUNCTION public.criar_vinculo_bidirecional(
  contato_a_uuid UUID,
  contato_b_uuid UUID,
  tipo_vinculo TEXT,
  observacao TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_empresa_id INTEGER;
  v_filial_id INTEGER;
  v_vinculo_ab_id UUID;
  v_vinculo_ba_id UUID;
  resultado jsonb;
BEGIN
  -- Obter user_id do contexto de autenticação
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Buscar empresa_id e filial_id do perfil do usuário
  SELECT empresa_id, filial_id 
  INTO v_empresa_id, v_filial_id
  FROM public.profiles 
  WHERE user_id = v_user_id;
  
  -- Validar que os contatos existem e pertencem ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.contatos_v2 
    WHERE id = contato_a_uuid AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Contato A não encontrado ou sem permissão';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM public.contatos_v2 
    WHERE id = contato_b_uuid AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Contato B não encontrado ou sem permissão';
  END IF;
  
  -- Inserir vínculo A -> B
  INSERT INTO public.contato_vinculos (
    contato_id,
    vinculado_id,
    tipo_vinculo,
    bidirecional,
    observacao,
    empresa_id,
    filial_id,
    user_id
  ) VALUES (
    contato_a_uuid,
    contato_b_uuid,
    tipo_vinculo::public.tipo_vinculo,
    true,
    observacao,
    v_empresa_id,
    v_filial_id,
    v_user_id
  )
  RETURNING id INTO v_vinculo_ab_id;
  
  -- Inserir vínculo reverso B -> A
  INSERT INTO public.contato_vinculos (
    contato_id,
    vinculado_id,
    tipo_vinculo,
    bidirecional,
    observacao,
    empresa_id,
    filial_id,
    user_id
  ) VALUES (
    contato_b_uuid,
    contato_a_uuid,
    tipo_vinculo::public.tipo_vinculo,
    true,
    observacao,
    v_empresa_id,
    v_filial_id,
    v_user_id
  )
  RETURNING id INTO v_vinculo_ba_id;
  
  -- Log da operação
  PERFORM public.log_security_event(
    'vinculo_bidirecional_criado',
    format('Vínculo bidirecional criado entre %s e %s', contato_a_uuid, contato_b_uuid),
    jsonb_build_object(
      'contato_a', contato_a_uuid,
      'contato_b', contato_b_uuid,
      'tipo_vinculo', tipo_vinculo,
      'vinculo_ab_id', v_vinculo_ab_id,
      'vinculo_ba_id', v_vinculo_ba_id
    )
  );
  
  resultado := jsonb_build_object(
    'success', true,
    'vinculo_ab_id', v_vinculo_ab_id,
    'vinculo_ba_id', v_vinculo_ba_id
  );
  
  RETURN resultado;
END;
$$;

COMMENT ON FUNCTION public.criar_vinculo_bidirecional IS 'Cria um vínculo bidirecional entre dois contatos de forma atômica';

-- Função para definir endereço principal de forma atômica
CREATE OR REPLACE FUNCTION public.definir_endereco_principal(
  contato_alvo_id UUID,
  endereco_alvo_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_linhas_atualizadas INTEGER;
  resultado jsonb;
BEGIN
  -- Obter user_id do contexto de autenticação
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Validar que o contato existe e pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.contatos_v2 
    WHERE id = contato_alvo_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Contato não encontrado ou sem permissão';
  END IF;
  
  -- Validar que o endereço existe e pertence ao contato
  IF NOT EXISTS (
    SELECT 1 FROM public.contato_enderecos 
    WHERE id = endereco_alvo_id AND contato_id = contato_alvo_id
  ) THEN
    RAISE EXCEPTION 'Endereço não encontrado para este contato';
  END IF;
  
  -- Desmarcar todos os outros endereços como principal
  UPDATE public.contato_enderecos
  SET principal = false,
      updated_at = now()
  WHERE contato_id = contato_alvo_id
    AND id != endereco_alvo_id
    AND principal = true;
  
  GET DIAGNOSTICS v_linhas_atualizadas = ROW_COUNT;
  
  -- Marcar o novo endereço como principal
  UPDATE public.contato_enderecos
  SET principal = true,
      updated_at = now()
  WHERE id = endereco_alvo_id
    AND contato_id = contato_alvo_id;
  
  -- Log da operação
  PERFORM public.log_security_event(
    'endereco_principal_definido',
    format('Endereço principal definido para contato %s', contato_alvo_id),
    jsonb_build_object(
      'contato_id', contato_alvo_id,
      'endereco_id', endereco_alvo_id,
      'enderecos_desmarcados', v_linhas_atualizadas
    )
  );
  
  resultado := jsonb_build_object(
    'success', true,
    'endereco_id', endereco_alvo_id,
    'enderecos_desmarcados', v_linhas_atualizadas
  );
  
  RETURN resultado;
END;
$$;

COMMENT ON FUNCTION public.definir_endereco_principal IS 'Define um endereço como principal de forma atômica, desmarcando os outros';