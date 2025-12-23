-- ==================================================================
-- Ajuste do gatilho: criar agenda SOMENTE APÓS INSERT (processo salvo)
-- ==================================================================

-- 1) Função auxiliar set_updated_at (idempotente)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Função para criar agenda padrão após INSERT de processo
CREATE OR REPLACE FUNCTION public.criar_agenda_padrao_processo()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
  v_titulo TEXT;
  v_prazo INTERVAL;
  v_descr TEXT;
  v_data TIMESTAMPTZ;
  v_status_permite BOOLEAN;
  v_agenda_id UUID;
BEGIN
  -- Só roda se tenant_id está definido (processo foi salvo de verdade)
  IF NEW.tenant_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Status inicial permite criação de agenda?
  v_status_permite := COALESCE(
    NEW.status IN ('analise', 'briefing', 'novo', 'ativo'), 
    TRUE
  );

  IF NOT v_status_permite THEN
    RETURN NEW;
  END IF;

  -- Buscar config ativa do fluxo "Briefing" para módulo Processos
  SELECT *
  INTO v_config
  FROM public.agenda_configuracoes
  WHERE modulo_origem = 'Processos'
    AND gatilho = 'on_create'
    AND nome_fluxo ILIKE 'Briefing%'
    AND ativo = TRUE
    AND tenant_id = NEW.tenant_id
  LIMIT 1;

  IF FOUND THEN
    v_titulo := 'Briefing: ' || COALESCE(NEW.assunto_principal, NEW.titulo, 'Novo Processo');
    v_prazo := COALESCE(v_config.prazo_padrao_minutos || ' minutes', '30 minutes')::INTERVAL;
    v_descr := COALESCE(
      v_config.descricao_padrao, 
      'Primeira reunião com o cliente para coleta de informações sobre o processo.'
    );
    v_data := NOW() + v_prazo;

    -- Criar agenda automática
    INSERT INTO public.agendas (
      titulo,
      descricao,
      data_inicio,
      data_fim,
      status,
      prioridade,
      processo_id,
      contato_responsavel_id,
      contato_solicitante_id,
      tenant_id,
      user_id,
      origem_modulo,
      origem_registro_id
    )
    VALUES (
      v_titulo,
      v_descr,
      v_data,
      v_data + INTERVAL '1 hour',
      'analise',
      'media',
      NEW.id,
      COALESCE(NEW.cliente_principal_id, NEW.user_id),
      NEW.user_id,
      NEW.tenant_id,
      NEW.user_id,
      'Processos',
      NEW.id
    )
    RETURNING id INTO v_agenda_id;

    -- Log de auditoria (se a função existir)
    BEGIN
      PERFORM public.log_security_event(
        'agenda_auto_created',
        'Agenda automática criada para processo: ' || NEW.id::TEXT,
        jsonb_build_object(
          'agenda_id', v_agenda_id,
          'processo_id', NEW.id,
          'fluxo', 'Briefing'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignora se função de auditoria não existir
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Recriar o trigger AFTER INSERT
DROP TRIGGER IF EXISTS trg_criar_agenda_padrao_processo ON public.processos;

CREATE TRIGGER trg_criar_agenda_padrao_processo
  AFTER INSERT ON public.processos
  FOR EACH ROW
  EXECUTE FUNCTION public.criar_agenda_padrao_processo();