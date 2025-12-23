-- Tabela de blueprints de workflow
CREATE TABLE IF NOT EXISTS workflow_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo_referencia TEXT NOT NULL DEFAULT 'processo',
  gatilho TEXT NOT NULL,
  filtros JSONB DEFAULT '{}'::jsonb,
  configuracao JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, codigo)
);

-- RLS para workflow_modelos
ALTER TABLE workflow_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_modelos_select_by_tenant" ON workflow_modelos
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "workflow_modelos_insert_by_tenant" ON workflow_modelos
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "workflow_modelos_update_by_tenant" ON workflow_modelos
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "workflow_modelos_delete_by_tenant" ON workflow_modelos
  FOR DELETE USING (tenant_id = auth.uid());

-- Tabela de passos do workflow
CREATE TABLE IF NOT EXISTS workflow_passos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_modelo_id UUID NOT NULL REFERENCES workflow_modelos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL,
  tipo_acao TEXT NOT NULL,
  descricao TEXT,
  configuracao JSONB DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para workflow_passos
ALTER TABLE workflow_passos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_passos_select_by_tenant" ON workflow_passos
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "workflow_passos_insert_by_tenant" ON workflow_passos
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "workflow_passos_update_by_tenant" ON workflow_passos
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "workflow_passos_delete_by_tenant" ON workflow_passos
  FOR DELETE USING (tenant_id = auth.uid());

-- Tabela de execuções de workflow
CREATE TABLE IF NOT EXISTS workflow_execucoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_modelo_id UUID NOT NULL REFERENCES workflow_modelos(id),
  referencia_tipo TEXT NOT NULL,
  referencia_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  criado_por UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para workflow_execucoes
ALTER TABLE workflow_execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_execucoes_select_by_tenant" ON workflow_execucoes
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "workflow_execucoes_insert_by_tenant" ON workflow_execucoes
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "workflow_execucoes_update_by_tenant" ON workflow_execucoes
  FOR UPDATE USING (tenant_id = auth.uid());

-- Tabela de execução de passos
CREATE TABLE IF NOT EXISTS workflow_execucao_passos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  workflow_execucao_id UUID NOT NULL REFERENCES workflow_execucoes(id) ON DELETE CASCADE,
  workflow_passo_id UUID NOT NULL REFERENCES workflow_passos(id),
  status TEXT NOT NULL DEFAULT 'pendente',
  resultado JSONB,
  mensagem_erro TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para workflow_execucao_passos
ALTER TABLE workflow_execucao_passos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_execucao_passos_select_by_tenant" ON workflow_execucao_passos
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "workflow_execucao_passos_insert_by_tenant" ON workflow_execucao_passos
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "workflow_execucao_passos_update_by_tenant" ON workflow_execucao_passos
  FOR UPDATE USING (tenant_id = auth.uid());

-- Tabela de documentos gerados
CREATE TABLE IF NOT EXISTS documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  processo_id UUID REFERENCES processos(id) ON DELETE CASCADE,
  modelo_id UUID REFERENCES biblioteca_modelos_v2(id),
  titulo TEXT NOT NULL,
  conteudo_html TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para documentos
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_select_by_tenant" ON documentos
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "documentos_insert_by_tenant" ON documentos
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "documentos_update_by_tenant" ON documentos
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "documentos_delete_by_tenant" ON documentos
  FOR DELETE USING (tenant_id = auth.uid());

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_modelos_updated_at BEFORE UPDATE ON workflow_modelos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_passos_updated_at BEFORE UPDATE ON workflow_passos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_execucoes_updated_at BEFORE UPDATE ON workflow_execucoes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_execucao_passos_updated_at BEFORE UPDATE ON workflow_execucao_passos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_workflow_modelos_tenant ON workflow_modelos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_passos_tenant ON workflow_passos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_passos_modelo ON workflow_passos(workflow_modelo_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execucoes_tenant ON workflow_execucoes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execucoes_referencia ON workflow_execucoes(referencia_tipo, referencia_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execucao_passos_tenant ON workflow_execucao_passos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tenant ON documentos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documentos_processo ON documentos(processo_id);