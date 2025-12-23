-- MÓDULO DE INTEGRAÇÃO JUDICIÁRIA
-- 1. EVOLUÇÃO DAS TABELAS EXISTENTES

-- Adiciona campos na tabela de processos para suportar a integração
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS numero_cnj TEXT;
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS tipo_processo TEXT DEFAULT 'EXTRAJUDICIAL' NOT NULL;
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS status_integracao TEXT DEFAULT 'NAO_VINCULADO' NOT NULL;
ALTER TABLE public.processos ADD COLUMN IF NOT EXISTS ultima_sincronizacao_em TIMESTAMPTZ;

-- Adiciona um índice único para o número CNJ por tenant
DROP INDEX IF EXISTS idx_processos_tenant_numero_cnj;
CREATE UNIQUE INDEX idx_processos_tenant_numero_cnj ON public.processos(user_id, numero_cnj) WHERE numero_cnj IS NOT NULL;

-- 2. NOVAS TABELAS PARA O MÓDULO DE INTEGRAÇÃO

-- Tabela para configurar os tribunais disponíveis no sistema
CREATE TABLE IF NOT EXISTS public.tribunais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sigla TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  sistema TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Credenciais por tenant para acesso aos sistemas
CREATE TABLE IF NOT EXISTS public.credenciais_tribunal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  tribunal_id UUID NOT NULL REFERENCES public.tribunais(id),
  tipo TEXT NOT NULL,
  alias TEXT,
  ref_armazenamento TEXT NOT NULL,
  valido_ate DATE,
  homologado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela que efetivamente liga um processo interno a um processo judicial
CREATE TABLE IF NOT EXISTS public.processos_vinculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  tribunal_id UUID NOT NULL REFERENCES public.tribunais(id),
  numero_cnj TEXT NOT NULL,
  classe_processual TEXT,
  orgao_julgador TEXT,
  ultima_sincronizacao_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, processo_id),
  UNIQUE(user_id, numero_cnj)
);

-- Armazena os andamentos e publicações capturados dos tribunais
CREATE TABLE IF NOT EXISTS public.andamentos_processuais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  processo_vinculo_id UUID NOT NULL REFERENCES public.processos_vinculos(id) ON DELETE CASCADE,
  origem TEXT NOT NULL,
  codigo_evento TEXT,
  descricao TEXT NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL,
  dados_brutos JSONB,
  lido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fila de jobs para processamento assíncrono das integrações
CREATE TABLE IF NOT EXISTS public.integracao_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  tipo TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'PENDENTE' NOT NULL,
  tentativas INT DEFAULT 0 NOT NULL,
  ultimo_erro TEXT,
  agendado_para TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DADOS INICIAIS - Tribunais principais
INSERT INTO public.tribunais (sigla, nome, sistema) VALUES
('TJSP', 'Tribunal de Justiça de São Paulo', 'PJe'),
('TJRJ', 'Tribunal de Justiça do Rio de Janeiro', 'PJe'),
('TJMG', 'Tribunal de Justiça de Minas Gerais', 'PJe'),
('TRF1', 'Tribunal Regional Federal da 1ª Região', 'PJe'),
('TRF2', 'Tribunal Regional Federal da 2ª Região', 'PJe'),
('TRF3', 'Tribunal Regional Federal da 3ª Região', 'PJe'),
('TRF4', 'Tribunal Regional Federal da 4ª Região', 'e-Proc'),
('TRF5', 'Tribunal Regional Federal da 5ª Região', 'PJe'),
('STJ', 'Superior Tribunal de Justiça', 'PJe'),
('STF', 'Supremo Tribunal Federal', 'PJe')
ON CONFLICT (sigla) DO NOTHING;

-- 4. APLICAR RLS

ALTER TABLE public.credenciais_tribunal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.andamentos_processuais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integracao_jobs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para credenciais_tribunal
CREATE POLICY "Users can manage their own credenciais_tribunal" ON public.credenciais_tribunal
  FOR ALL
  USING (user_id = auth.uid() OR has_role('admin'))
  WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Políticas RLS para processos_vinculos
CREATE POLICY "Users can manage their own processos_vinculos" ON public.processos_vinculos
  FOR ALL
  USING (user_id = auth.uid() OR has_role('admin'))
  WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Políticas RLS para andamentos_processuais
CREATE POLICY "Users can view their own andamentos_processuais" ON public.andamentos_processuais
  FOR ALL
  USING (user_id = auth.uid() OR has_role('admin'))
  WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Políticas RLS para integracao_jobs
CREATE POLICY "Users can manage their own integracao_jobs" ON public.integracao_jobs
  FOR ALL
  USING (user_id = auth.uid() OR has_role('admin'))
  WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- 5. TRIGGERS PARA TIMESTAMPS
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_credenciais_tribunal_updated_at
  BEFORE UPDATE ON public.credenciais_tribunal
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_integracao_jobs_updated_at
  BEFORE UPDATE ON public.integracao_jobs
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_tribunais_updated_at
  BEFORE UPDATE ON public.tribunais
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();