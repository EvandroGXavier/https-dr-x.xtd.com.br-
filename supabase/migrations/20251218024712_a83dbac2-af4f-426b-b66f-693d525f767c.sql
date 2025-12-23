-- =====================================================
-- EPROC V2: Expandir tabela processos_tj com campos completos
-- =====================================================

-- Campos do Cabeçalho (dados principais do tribunal)
ALTER TABLE processos_tj
  ADD COLUMN IF NOT EXISTS competencia text,
  ADD COLUMN IF NOT EXISTS data_autuacao timestamptz,
  ADD COLUMN IF NOT EXISTS situacao text,
  ADD COLUMN IF NOT EXISTS orgao_julgador text,
  ADD COLUMN IF NOT EXISTS juiz_responsavel text;

-- Chave do processo e valores
ALTER TABLE processos_tj
  ADD COLUMN IF NOT EXISTS chave_processo text,
  ADD COLUMN IF NOT EXISTS valor_causa numeric(15,2),
  ADD COLUMN IF NOT EXISTS nivel_sigilo integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nivel_sigilo_desc text DEFAULT 'Sem Sigilo';

-- Flags Especiais (EPROC)
ALTER TABLE processos_tj
  ADD COLUMN IF NOT EXISTS justica_gratuita text DEFAULT 'nao',
  ADD COLUMN IF NOT EXISTS admitida_execucao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS antecipacao_tutela text DEFAULT 'nao_requerida',
  ADD COLUMN IF NOT EXISTS crianca_adolescente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS doenca_grave boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS peticao_urgente boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reconvencao boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reu_preso boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS processo_digitalizado boolean DEFAULT true;

-- Campos de Automação (Crawler Futuro)
ALTER TABLE processos_tj
  ADD COLUMN IF NOT EXISTS sistema_judicial text,
  ADD COLUMN IF NOT EXISTS senha_acesso text,
  ADD COLUMN IF NOT EXISTS data_ultima_verificacao timestamptz,
  ADD COLUMN IF NOT EXISTS ultimo_status_tj text;

-- Constraint para sistema_judicial
ALTER TABLE processos_tj
  DROP CONSTRAINT IF EXISTS processos_tj_sistema_judicial_check;
ALTER TABLE processos_tj
  ADD CONSTRAINT processos_tj_sistema_judicial_check 
  CHECK (sistema_judicial IS NULL OR sistema_judicial IN ('pje', 'eproc', 'esaj', 'projudi', 'sajadv', 'outros'));

-- Índices para busca
CREATE INDEX IF NOT EXISTS idx_processos_tj_situacao ON processos_tj(situacao) WHERE situacao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_processos_tj_sistema ON processos_tj(sistema_judicial) WHERE sistema_judicial IS NOT NULL;

-- Comentários de documentação
COMMENT ON COLUMN processos_tj.sistema_judicial IS 'Sistema eletrônico: pje, eproc, esaj, projudi, sajadv, outros';
COMMENT ON COLUMN processos_tj.chave_processo IS 'Chave única de identificação do processo no tribunal';
COMMENT ON COLUMN processos_tj.nivel_sigilo IS 'Nível de sigilo: 0=Público, 1=Segredo, 2=Ultra-Secreto';
COMMENT ON COLUMN processos_tj.justica_gratuita IS 'Status da justiça gratuita: nao, requerida, deferida, indeferida';
COMMENT ON COLUMN processos_tj.antecipacao_tutela IS 'Status da tutela: nao_requerida, requerida, deferida, indeferida';