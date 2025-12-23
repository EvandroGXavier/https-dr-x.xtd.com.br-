-- Criar função de automação de tarefas por fase
CREATE OR REPLACE FUNCTION public.processar_automacao_fase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_etiqueta RECORD;
  v_config RECORD;
  v_processo RECORD;
  v_agenda_id UUID;
  v_data_fim TIMESTAMPTZ;
  v_tenant_id UUID;
BEGIN
  -- Obter tenant_id do usuário autenticado
  v_tenant_id := auth.uid();
  
  -- Verificar se é uma etiqueta tipo "fase" sendo adicionada
  SELECT e.* INTO v_etiqueta
  FROM public.etiquetas e
  WHERE e.id = NEW.etiqueta_id
    AND (e.grupo = 'fase' OR e.tipo = 'fase');
  
  -- Se não for etiqueta de fase, ignorar
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Buscar configuração do template para esta fase
  SELECT pc.* INTO v_config
  FROM public.processos_config pc
  WHERE pc.chave = 'fase.' || v_etiqueta.slug
    AND pc.tenant_id = v_tenant_id
  LIMIT 1;
  
  -- Se não houver configuração, apenas retornar
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Buscar dados do processo
  SELECT p.* INTO v_processo
  FROM public.processos p
  WHERE p.id = NEW.processo_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Calcular data fim baseado em alerta_dias
  IF (v_config.valor_json->>'alerta_dias') IS NOT NULL THEN
    v_data_fim := now() + (COALESCE((v_config.valor_json->>'alerta_dias')::integer, 0) || ' days')::interval;
  ELSE
    v_data_fim := NULL;
  END IF;
  
  -- Criar tarefa na agenda
  INSERT INTO public.agendas (
    tenant_id,
    user_id,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    status,
    prioridade,
    processo_id,
    contato_responsavel_id,
    contato_solicitante_id
  ) VALUES (
    v_tenant_id,
    v_tenant_id,
    format('[%s] %s', v_etiqueta.nome, v_processo.titulo),
    v_config.valor_json->>'tarefa',
    now(),
    v_data_fim,
    'analise',
    'media',
    NEW.processo_id,
    v_tenant_id,
    v_tenant_id
  ) RETURNING id INTO v_agenda_id;
  
  -- Adicionar etiqueta adicional ao processo, se configurada
  IF (v_config.valor_json->>'etiqueta_auto') IS NOT NULL 
     AND (v_config.valor_json->>'etiqueta_auto') != '' THEN
    BEGIN
      INSERT INTO public.processo_etiquetas (
        processo_id,
        etiqueta_id,
        user_id
      ) VALUES (
        NEW.processo_id,
        (v_config.valor_json->>'etiqueta_auto')::uuid,
        v_tenant_id
      );
    EXCEPTION WHEN unique_violation THEN
      -- Etiqueta já existe, ignorar
      NULL;
    END;
  END IF;
  
  -- Registrar log de auditoria
  PERFORM public.log_security_event(
    'automacao_fase',
    format('Automação de fase executada: %s', v_etiqueta.nome),
    jsonb_build_object(
      'processo_id', NEW.processo_id,
      'etiqueta_fase_id', v_etiqueta.id,
      'etiqueta_fase_nome', v_etiqueta.nome,
      'agenda_criada_id', v_agenda_id,
      'tarefa', v_config.valor_json->>'tarefa',
      'alerta_dias', v_config.valor_json->>'alerta_dias',
      'etiqueta_auto_id', v_config.valor_json->>'etiqueta_auto'
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não bloqueia a operação
    PERFORM public.log_security_event(
      'automacao_fase_erro',
      format('Erro na automação de fase: %s', SQLERRM),
      jsonb_build_object(
        'processo_id', NEW.processo_id,
        'etiqueta_id', NEW.etiqueta_id,
        'erro', SQLERRM
      )
    );
    RETURN NEW;
END;
$$;

-- Criar trigger para executar automação quando etiqueta de fase for adicionada
DROP TRIGGER IF EXISTS trg_automacao_fase ON public.processo_etiquetas;
CREATE TRIGGER trg_automacao_fase
  AFTER INSERT ON public.processo_etiquetas
  FOR EACH ROW
  EXECUTE FUNCTION public.processar_automacao_fase();

-- Adicionar campos tipo e grupo em etiquetas se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'etiquetas' 
    AND column_name = 'tipo'
  ) THEN
    ALTER TABLE public.etiquetas ADD COLUMN tipo text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'etiquetas' 
    AND column_name = 'grupo'
  ) THEN
    ALTER TABLE public.etiquetas ADD COLUMN grupo text;
  END IF;
END $$;