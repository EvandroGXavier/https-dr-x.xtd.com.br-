-- Corrigir o trigger da agenda automática para não depender de tenant_id em processos
-- A tabela processos usa user_id, não tenant_id

DROP TRIGGER IF EXISTS trg_criar_agenda_padrao_processo ON public.processos;

-- Recriar função sem referência a tenant_id que não existe em processos
CREATE OR REPLACE FUNCTION public.criar_agenda_padrao_processo()
RETURNS TRIGGER AS $$
DECLARE
  v_config record;
  v_titulo text;
  v_prazo_minutos integer;
  v_descr text;
  v_participantes jsonb;
  v_data_inicio timestamp with time zone;
  v_data_fim timestamp with time zone;
  v_tenant_id uuid;
BEGIN
  -- Usar user_id como tenant_id (padrão do sistema)
  v_tenant_id := new.user_id;
  
  -- Busca configuração ativa para Atendimento no módulo Processos, gatilho on_create
  SELECT *
    INTO v_config
  FROM public.agenda_configuracoes
  WHERE modulo_origem = 'Processos'
    AND gatilho = 'on_create'
    AND tipo = 'Atendimento'
    AND ativo = true
    AND tenant_id = v_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_titulo := 'Atendimento Inicial (Briefing): ' || COALESCE(new.assunto_principal, 'Novo Processo');
    v_prazo_minutos := COALESCE(v_config.prazo_padrao_minutos, 30);
    v_descr := COALESCE(v_config.descricao_padrao, 'Primeira reunião para coleta de informações sobre o caso.');
    v_participantes := COALESCE(v_config.participantes_padrao, '[]'::jsonb);
    v_data_inicio := NOW();
    v_data_fim := NOW() + (v_prazo_minutos || ' minutes')::interval;

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
      created_at,
      updated_at
    )
    VALUES (
      v_titulo,
      v_descr,
      v_data_inicio,
      v_data_fim,
      'analise',
      new.id,
      v_config.id,
      'Processos',
      new.id,
      v_tenant_id,
      new.user_id,
      NOW(),
      NOW()
    );

    -- Registrar auditoria
    INSERT INTO public.auditorias (module, action, target, payload, actor, tenant_id, criado_em)
    VALUES (
      'agenda',
      'create_auto',
      new.id::text,
      jsonb_build_object(
        'fluxo', v_config.nome_fluxo,
        'agenda_config_id', v_config.id,
        'processo_id', new.id
      ),
      new.user_id,
      v_tenant_id,
      NOW()
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
CREATE TRIGGER trg_criar_agenda_padrao_processo
AFTER INSERT ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.criar_agenda_padrao_processo();