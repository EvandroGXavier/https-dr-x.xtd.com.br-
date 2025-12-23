-- ============================================================================
-- ETAPA 1: Atualizar enum qualificacao_parte com novos valores
-- ============================================================================

-- Adicionar novos tipos ao enum
ALTER TYPE qualificacao_parte ADD VALUE IF NOT EXISTS 'cliente';
ALTER TYPE qualificacao_parte ADD VALUE IF NOT EXISTS 'contrario';
ALTER TYPE qualificacao_parte ADD VALUE IF NOT EXISTS 'falecido';

-- ============================================================================
-- ETAPA 2: Criar tabela processos_tj
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.processos_tj (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  
  -- Identificação Judicial
  numero_oficial text NOT NULL,
  numero_cnj text,
  
  -- Localização Judicial
  tribunal text,
  uf char(2),
  comarca text,
  vara text,
  instancia text CHECK (instancia IN ('primeira', 'segunda', 'superior', 'suprema')),
  tipo_justica text CHECK (tipo_justica IN ('estadual', 'federal', 'trabalho', 'militar', 'eleitoral')),
  
  -- Classificação
  classe text,
  assunto text,
  
  -- Integração
  link_consulta text,
  origem_dados text CHECK (origem_dados IN ('manual', 'pje', 'esaj', 'integracao')) DEFAULT 'manual',
  
  -- Timestamps
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now(),
  
  -- Constraints
  UNIQUE(processo_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_processos_tj_processo ON public.processos_tj(processo_id);
CREATE INDEX IF NOT EXISTS idx_processos_tj_tenant ON public.processos_tj(tenant_id);
CREATE INDEX IF NOT EXISTS idx_processos_tj_numero ON public.processos_tj(numero_oficial);
CREATE INDEX IF NOT EXISTS idx_processos_tj_tribunal ON public.processos_tj(tribunal);

-- RLS
ALTER TABLE public.processos_tj ENABLE ROW LEVEL SECURITY;

CREATE POLICY processos_tj_tenant_access ON public.processos_tj
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Trigger de atualização
CREATE TRIGGER tg_processos_tj_updated
  BEFORE UPDATE ON public.processos_tj
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auditoria
CREATE OR REPLACE FUNCTION public.fn_audit_processos_tj()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.auditorias (actor, action, module, target, payload, tenant_id)
    VALUES (auth.uid(), 'INSERT', 'processos_tj', NEW.id::text, to_jsonb(NEW), NEW.tenant_id);
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.auditorias (actor, action, module, target, payload, tenant_id)
    VALUES (auth.uid(), 'UPDATE', 'processos_tj', NEW.id::text, jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)), NEW.tenant_id);
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.auditorias (actor, action, module, target, payload, tenant_id)
    VALUES (auth.uid(), 'DELETE', 'processos_tj', OLD.id::text, to_jsonb(OLD), OLD.tenant_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_audit_processos_tj
  AFTER INSERT OR UPDATE OR DELETE ON public.processos_tj
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_audit_processos_tj();