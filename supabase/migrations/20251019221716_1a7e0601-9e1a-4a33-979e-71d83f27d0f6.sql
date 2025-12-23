-- Ajustar função para inserir colunas obrigatórias e remover created_at
CREATE OR REPLACE FUNCTION public.criar_agenda_padrao_processo()
RETURNS TRIGGER AS $$
DECLARE
  v_config record;
  v_titulo text;
  v_prazo_minutos integer;
  v_descr text;
  v_participantes jsonb;
  v_data_inicio timestamptz;
  v_data_fim timestamptz;
  v_tenant_id uuid;
BEGIN
  -- Usar user_id como tenant_id (padrão do sistema multi-tenant por usuário)
  v_tenant_id := NEW.user_id;

  -- Buscar config ativa do módulo Processos (gatilho on_create)
  SELECT * INTO v_config
  FROM public.agenda_configuracoes
  WHERE modulo_origem = 'Processos'
    AND gatilho = 'on_create'
    AND ativo = true
    AND tenant_id = v_tenant_id
  ORDER BY updated_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_titulo := COALESCE(v_config.nome_fluxo, 'Atendimento Inicial (Briefing)') || ': ' || COALESCE(NEW.assunto_principal, 'Novo Processo');
    v_prazo_minutos := COALESCE(v_config.prazo_padrao_minutos, 30);
    v_descr := COALESCE(v_config.descricao_padrao, 'Primeira reunião para coleta de informações.');
    v_participantes := COALESCE(v_config.participantes_padrao, '[]'::jsonb);
    v_data_inicio := now();
    v_data_fim := now() + make_interval(mins => v_prazo_minutos);

    INSERT INTO public.agendas (
      titulo,
      descricao,
      data_inicio,
      data_fim,
      status,
      processo_id,
      origem_config_id,
      origem_modulo,
      origem_registro_id,
      tenant_id,
      user_id,
      contato_responsavel_id,
      contato_solicitante_id
    ) VALUES (
      v_titulo,
      v_descr,
      v_data_inicio,
      v_data_fim,
      'analise',
      NEW.id,
      v_config.id,
      'Processos',
      NEW.id,
      v_tenant_id,
      NEW.user_id,
      v_tenant_id,   -- placeholder (mesma estratégia usada no upsert transacional)
      v_tenant_id    -- placeholder
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;