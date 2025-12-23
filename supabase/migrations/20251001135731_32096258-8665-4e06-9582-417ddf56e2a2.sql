-- Fase 2: Adiciona colunas para análise de IA na tabela processos
ALTER TABLE public.processos
ADD COLUMN IF NOT EXISTS resumo_ia TEXT NULL,
ADD COLUMN IF NOT EXISTS timeline_ia JSONB NULL,
ADD COLUMN IF NOT EXISTS pontos_atencao_ia JSONB NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.processos.resumo_ia IS 'Resumo do caso gerado por IA.';
COMMENT ON COLUMN public.processos.timeline_ia IS 'Array de eventos [{ "data": "YYYY-MM-DD", "descricao": "..." }] gerado por IA.';
COMMENT ON COLUMN public.processos.pontos_atencao_ia IS 'Array de pontos de atenção [{ "tipo": "PRAZO" | "VALOR" | "DOCUMENTO", "descricao": "...", "metadados": {...} }] gerado por IA.';