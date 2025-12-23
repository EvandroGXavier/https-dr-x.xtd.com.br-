-- Aprimora a tabela central de documentos para suportar a nova arquitetura
ALTER TABLE public.documentos
ADD COLUMN IF NOT EXISTS local_fisico TEXT NULL,
ADD COLUMN IF NOT EXISTS observacoes TEXT NULL,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo',
ADD COLUMN IF NOT EXISTS path_local TEXT NULL,
ADD COLUMN IF NOT EXISTS armazenamento_externo JSONB NULL,
ADD COLUMN IF NOT EXISTS status_analise_ia TEXT NULL DEFAULT 'pendente',
ADD COLUMN IF NOT EXISTS classificacao_ia TEXT NULL,
ADD COLUMN IF NOT EXISTS entidades_extraidas_ia JSONB NULL,
ADD COLUMN IF NOT EXISTS resumo_conteudo_ia TEXT NULL;

-- Adiciona comentários para documentação
COMMENT ON COLUMN public.documentos.local_fisico IS 'Localização física do documento original (ex: Arquivo 2025, Gaveta 3).';
COMMENT ON COLUMN public.documentos.observacoes IS 'Observações e anotações gerais sobre o documento.';
COMMENT ON COLUMN public.documentos.status IS 'Status do documento (ex: ativo, arquivado).';
COMMENT ON COLUMN public.documentos.path_local IS 'Caminho para o arquivo em um drive de rede local (ex: Z:\...).';
COMMENT ON COLUMN public.documentos.armazenamento_externo IS 'JSONB para armazenar links de serviços de nuvem (ex: { "google_drive": "http://..." }).';
COMMENT ON COLUMN public.documentos.status_analise_ia IS 'Status da análise pela IA (ex: pendente, concluido, falha).';
COMMENT ON COLUMN public.documentos.classificacao_ia IS 'Classificação do tipo de documento pela IA (ex: cnh, peticao_inicial).';
COMMENT ON COLUMN public.documentos.entidades_extraidas_ia IS 'Dados estruturados extraídos pela IA.';
COMMENT ON COLUMN public.documentos.resumo_conteudo_ia IS 'Resumo do conteúdo do documento gerado pela IA.';

-- Cria a tabela de ligação para o sistema universal de etiquetas
CREATE TABLE IF NOT EXISTS public.documento_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (documento_id, etiqueta_id)
);

COMMENT ON TABLE public.documento_etiquetas IS 'Tabela de ligação para associar múltiplas etiquetas a um documento.';

-- Habilita RLS para a nova tabela de etiquetas
ALTER TABLE public.documento_etiquetas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para documento_etiquetas
CREATE POLICY "Users can view their own documento_etiquetas"
  ON public.documento_etiquetas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.id = documento_etiquetas.documento_id
      AND (d.user_id = auth.uid() OR has_role('admin'))
    )
  );

CREATE POLICY "Users can create documento_etiquetas for their documents"
  ON public.documento_etiquetas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.id = documento_etiquetas.documento_id
      AND (d.user_id = auth.uid() OR has_role('admin'))
    )
  );

CREATE POLICY "Users can delete their own documento_etiquetas"
  ON public.documento_etiquetas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.documentos d
      WHERE d.id = documento_etiquetas.documento_id
      AND (d.user_id = auth.uid() OR has_role('admin'))
    )
  );