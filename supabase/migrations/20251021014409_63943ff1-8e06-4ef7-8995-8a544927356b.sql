-- Criar tabela para templates de automação de fase
CREATE TABLE IF NOT EXISTS public.processos_fase_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  etiqueta_fase_id uuid NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
  tarefa_descricao text NOT NULL CHECK (length(tarefa_descricao) >= 3),
  alerta_dias integer CHECK (alerta_dias >= 0),
  etiqueta_auto_id uuid REFERENCES public.etiquetas(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.processos_fase_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Templates de fase - SELECT por tenant"
  ON public.processos_fase_templates
  FOR SELECT
  USING (tenant_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Templates de fase - INSERT por tenant"
  ON public.processos_fase_templates
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Templates de fase - UPDATE por tenant"
  ON public.processos_fase_templates
  FOR UPDATE
  USING (tenant_id = auth.uid() OR has_role('admin'))
  WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Templates de fase - DELETE por tenant"
  ON public.processos_fase_templates
  FOR DELETE
  USING (tenant_id = auth.uid() OR has_role('admin'));

-- Índices para performance
CREATE INDEX idx_fase_templates_tenant ON public.processos_fase_templates(tenant_id);
CREATE INDEX idx_fase_templates_etiqueta ON public.processos_fase_templates(etiqueta_fase_id);

-- Trigger para updated_at
CREATE TRIGGER update_processos_fase_templates_updated_at
  BEFORE UPDATE ON public.processos_fase_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Atualizar função de automação para usar nova tabela
CREATE OR REPLACE FUNCTION public.processar_automacao_fase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_etiqueta RECORD;
  v_template RECORD;
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
    AND (e.grupo = 'fase' OR COALESCE(e.tipo, '') = 'fase');
  
  -- Se não for etiqueta de fase, ignorar
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Buscar template configurado para esta fase
  SELECT t.* INTO v_template
  FROM public.processos_fase_templates t
  WHERE t.etiqueta_fase_id = v_etiqueta.id
    AND t.tenant_id = v_tenant_id
  LIMIT 1;
  
  -- Se não houver template, apenas retornar
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
  IF v_template.alerta_dias IS NOT NULL THEN
    v_data_fim := now() + (v_template.alerta_dias || ' days')::interval;
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
    format('[%s] %s', v_etiqueta.nome, COALESCE(v_processo.titulo, 'Processo')),
    v_template.tarefa_descricao,
    now(),
    v_data_fim,
    'analise',
    'media',
    NEW.processo_id,
    v_tenant_id,
    v_tenant_id
  ) RETURNING id INTO v_agenda_id;
  
  -- Adicionar etiqueta adicional ao processo, se configurada
  IF v_template.etiqueta_auto_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.processo_etiquetas (
        processo_id,
        etiqueta_id,
        user_id
      ) VALUES (
        NEW.processo_id,
        v_template.etiqueta_auto_id,
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
      'tarefa', v_template.tarefa_descricao,
      'alerta_dias', v_template.alerta_dias,
      'etiqueta_auto_id', v_template.etiqueta_auto_id
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