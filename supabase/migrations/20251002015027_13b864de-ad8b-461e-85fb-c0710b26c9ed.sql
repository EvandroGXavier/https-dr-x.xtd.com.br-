-- Adiciona todas as colunas planejadas à tabela central de documentos
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

-- Adiciona comentários para documentação clara
COMMENT ON COLUMN public.documentos.status IS 'Status do documento (ex: ativo, arquivado).';
COMMENT ON COLUMN public.documentos.path_local IS 'Caminho para o arquivo em um drive de rede local (ex: Z:\\...).';
COMMENT ON COLUMN public.documentos.armazenamento_externo IS 'JSONB para armazenar links de serviços de nuvem (ex: { "google_drive": "http://..." }).';
COMMENT ON COLUMN public.documentos.status_analise_ia IS 'Status da análise pela IA (ex: pendente, concluido, falha).';

-- Cria a tabela de ligação para o sistema universal de etiquetas
CREATE TABLE IF NOT EXISTS public.documento_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (documento_id, etiqueta_id)
);
COMMENT ON TABLE public.documento_etiquetas IS 'Tabela de ligação para associar múltiplas etiquetas a um documento.';

-- Habilita e configura RLS para a nova tabela
ALTER TABLE public.documento_etiquetas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their documento_etiquetas" ON public.documento_etiquetas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.documentos 
    WHERE id = documento_id 
    AND (user_id = auth.uid() OR has_role('admin'::app_role))
  )
);