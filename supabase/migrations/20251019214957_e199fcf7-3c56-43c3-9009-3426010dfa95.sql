-- ========================================
-- AGENDA COMO NÚCLEO DE AUTOMAÇÃO V1
-- ========================================

-- 1. Função de auditoria genérica (se não existir)
CREATE OR REPLACE FUNCTION public.auditar_evento(
  p_module TEXT,
  p_action TEXT,
  p_target UUID,
  p_details JSONB
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.auditorias (module, action, target, payload, actor, tenant_id, criado_em)
  VALUES (
    p_module, 
    p_action, 
    p_target::TEXT, 
    COALESCE(p_details, '{}'::JSONB), 
    auth.uid(), 
    auth.uid(), 
    NOW()
  );
EXCEPTION WHEN undefined_column THEN
  -- Ignora se a tabela auditorias tiver estrutura diferente
  NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tabela de configurações de agendas automáticas
CREATE TABLE IF NOT EXISTS public.agenda_configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fluxo TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'Atendimento' | 'Audiência' | 'Interna' | 'Prazo' | 'Outro'
  modulo_origem TEXT NOT NULL, -- 'Processos' | 'Financeiro' | ...
  responsavel_padrao TEXT, -- 'advogado_logado' | 'responsavel_cliente' | 'equipe_X'
  prazo_padrao_minutos INTEGER DEFAULT 30, -- prazo em minutos
  participantes_padrao JSONB DEFAULT '[]'::JSONB, -- ex: [{ "papel": "cliente_principal" }]
  descricao_padrao TEXT,
  gatilho TEXT NOT NULL, -- 'on_create', 'on_approve_fees', etc.
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  
  tenant_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_agenda_config_tenant ON public.agenda_configuracoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agenda_config_modulo ON public.agenda_configuracoes(modulo_origem, gatilho);
CREATE INDEX IF NOT EXISTS idx_agenda_config_ativo ON public.agenda_configuracoes(ativo, tenant_id);

-- 4. Habilitar RLS
ALTER TABLE public.agenda_configuracoes ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS
CREATE POLICY "agenda_config_select_by_tenant"
ON public.agenda_configuracoes
FOR SELECT
USING (tenant_id = auth.uid());

CREATE POLICY "agenda_config_write_by_admin"
ON public.agenda_configuracoes
FOR ALL
USING (
  tenant_id = auth.uid()
  AND has_role('admin'::app_role)
)
WITH CHECK (
  tenant_id = auth.uid()
  AND has_role('admin'::app_role)
);

-- 6. Trigger de updated_at
CREATE TRIGGER trg_agenda_config_updated_at
BEFORE UPDATE ON public.agenda_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_timestamp();

-- 7. Ajuste na tabela agendas (rastro de origem automática)
ALTER TABLE public.agendas
  ADD COLUMN IF NOT EXISTS origem_config_id UUID REFERENCES public.agenda_configuracoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origem_modulo TEXT,
  ADD COLUMN IF NOT EXISTS origem_registro_id UUID;

CREATE INDEX IF NOT EXISTS idx_agendas_origem_config ON public.agendas(origem_config_id);
CREATE INDEX IF NOT EXISTS idx_agendas_origem_registro ON public.agendas(origem_modulo, origem_registro_id);

-- 8. Função: criar agenda padrão ao criar processo (Briefing)
CREATE OR REPLACE FUNCTION public.criar_agenda_padrao_processo()
RETURNS TRIGGER AS $$
DECLARE
  v_config RECORD;
  v_titulo TEXT;
  v_prazo_minutos INTEGER;
  v_descr TEXT;
  v_participantes JSONB;
  v_data_inicio TIMESTAMP WITH TIME ZONE;
  v_data_fim TIMESTAMP WITH TIME ZONE;
  v_agenda_id UUID;
BEGIN
  -- Busca configuração ativa para Briefing no módulo Processos, gatilho on_create
  SELECT *
    INTO v_config
  FROM public.agenda_configuracoes
  WHERE modulo_origem = 'Processos'
    AND gatilho = 'on_create'
    AND nome_fluxo ILIKE '%Briefing%'
    AND ativo = TRUE
    AND tenant_id = NEW.tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    v_titulo := 'Atendimento Inicial (Briefing): ' || COALESCE(NEW.titulo, 'Novo Processo');
    v_prazo_minutos := COALESCE(v_config.prazo_padrao_minutos, 30);
    v_descr := COALESCE(v_config.descricao_padrao, 'Primeira reunião com o cliente para coleta de informações sobre o processo.');
    v_participantes := COALESCE(v_config.participantes_padrao, '[]'::JSONB);
    v_data_inicio := NOW();
    v_data_fim := NOW() + (v_prazo_minutos || ' minutes')::INTERVAL;

    INSERT INTO public.agendas (
      titulo, 
      descricao, 
      data_inicio, 
      data_fim, 
      status, 
      prioridade,
      processo_id,
      origem_config_id, 
      origem_modulo, 
      origem_registro_id, 
      tenant_id, 
      user_id,
      contato_responsavel_id,
      contato_solicitante_id,
      created_at,
      updated_at
    )
    VALUES (
      v_titulo,
      v_descr,
      v_data_inicio,
      v_data_fim,
      'analise', -- status inicial
      'alta', -- prioridade alta para briefing
      NEW.id, -- vincula ao processo
      v_config.id,
      'Processos',
      NEW.id,
      NEW.tenant_id,
      COALESCE(NEW.user_id, auth.uid()),
      NEW.user_id, -- responsável = criador do processo
      NEW.user_id, -- solicitante = criador do processo
      NOW(),
      NOW()
    )
    RETURNING id INTO v_agenda_id;

    -- Registra auditoria
    PERFORM public.auditar_evento(
      'agenda',
      'create_auto',
      v_agenda_id,
      jsonb_build_object(
        'fluxo', 'Briefing',
        'agenda_config_id', v_config.id,
        'processo_id', NEW.id,
        'processo_titulo', NEW.titulo
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger no insert de processos
DROP TRIGGER IF EXISTS trg_criar_agenda_padrao_processo ON public.processos;
CREATE TRIGGER trg_criar_agenda_padrao_processo
AFTER INSERT ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.criar_agenda_padrao_processo();

-- 10. Seed inicial (configuração padrão de Briefing) - comentado para execução manual por tenant
-- DESCOMENTE e ajuste o tenant_id para cada tenant que desejar:
-- INSERT INTO public.agenda_configuracoes (
--   nome_fluxo, 
--   tipo, 
--   modulo_origem, 
--   responsavel_padrao, 
--   prazo_padrao_minutos, 
--   participantes_padrao, 
--   descricao_padrao, 
--   gatilho, 
--   ativo,
--   tenant_id, 
--   created_by
-- )
-- VALUES (
--   'Briefing - Atendimento Inicial', 
--   'Atendimento', 
--   'Processos', 
--   'advogado_logado', 
--   30,
--   '[{"papel":"cliente_principal"}]'::JSONB, 
--   'Primeira reunião com o cliente para coleta de informações sobre o processo.', 
--   'on_create',
--   TRUE,
--   '<SEU_TENANT_UUID_AQUI>', 
--   auth.uid()
-- );

COMMENT ON TABLE public.agenda_configuracoes IS 'Configurações de agendas automáticas (fluxos). Apenas Admin pode gerenciar.';
COMMENT ON COLUMN public.agendas.origem_config_id IS 'ID da configuração que gerou esta agenda automaticamente (null = manual)';
COMMENT ON COLUMN public.agendas.origem_modulo IS 'Módulo de origem da agenda automática (ex: Processos, Financeiro)';
COMMENT ON COLUMN public.agendas.origem_registro_id IS 'ID do registro que disparou a criação automática (ex: processo_id)';
