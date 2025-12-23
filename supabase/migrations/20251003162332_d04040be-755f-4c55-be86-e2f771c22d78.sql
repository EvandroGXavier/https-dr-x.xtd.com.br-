-- ========= PROJETO DOCS: BUCKET DE STORAGE =========

-- Criar bucket privado 'docs'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'docs',
  'docs',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain']
);

-- ========= POLÍTICAS DE STORAGE PARA O BUCKET 'docs' =========

-- SELECT: Usuários podem visualizar seus próprios arquivos
CREATE POLICY "Authenticated users can view own files in docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'docs' AND auth.uid() = owner);

-- INSERT: Usuários podem fazer upload de arquivos
CREATE POLICY "Authenticated users can upload files to docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'docs' AND auth.uid() = owner);

-- UPDATE: Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Authenticated users can update own files in docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'docs' AND auth.uid() = owner);

-- DELETE: Usuários podem deletar seus próprios arquivos
CREATE POLICY "Authenticated users can delete own files in docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'docs' AND auth.uid() = owner);

-- ========= CRIAÇÃO DAS TABELAS DO BANCO DE DADOS =========

-- 1. TABELA CENTRAL (HUB): `docs`
CREATE TABLE public.docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    titulo TEXT,
    arquivo_nome TEXT,
    arquivo_tipo TEXT,
    arquivo_tamanho BIGINT,
    path_storage TEXT,
    local_fisico TEXT NULL,
    observacoes TEXT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    path_local TEXT NULL,
    armazenamento_externo JSONB NULL,
    status_analise_ia TEXT NULL DEFAULT 'pendente',
    classificacao_ia TEXT NULL,
    entidades_extraidas_ia JSONB NULL,
    resumo_conteudo_ia TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.docs IS 'Tabela central e universal para todos os documentos do sistema (Projeto Docs).';

-- Trigger para atualizar updated_at
CREATE TRIGGER set_docs_updated_at
    BEFORE UPDATE ON public.docs
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- RLS na tabela docs
ALTER TABLE public.docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por tenant na tabela docs" 
ON public.docs 
FOR ALL
TO authenticated
USING (tenant_id = COALESCE((current_setting('app.tenant_id', true))::UUID, auth.uid()));

-- 2. TABELA DE VÍNCULOS (SPOKES): `docs_vinculos`
CREATE TABLE public.docs_vinculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    doc_id UUID NOT NULL REFERENCES public.docs(id) ON DELETE CASCADE,
    vinculo_id UUID NOT NULL,
    vinculo_tipo TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_docs_vinculos_lookup ON public.docs_vinculos(vinculo_id, vinculo_tipo);
CREATE INDEX idx_docs_vinculos_doc ON public.docs_vinculos(doc_id);

COMMENT ON TABLE public.docs_vinculos IS 'Associa um documento da tabela `docs` a qualquer outra entidade no sistema.';

-- RLS na tabela docs_vinculos
ALTER TABLE public.docs_vinculos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por tenant na tabela docs_vinculos" 
ON public.docs_vinculos 
FOR ALL
TO authenticated
USING (tenant_id = COALESCE((current_setting('app.tenant_id', true))::UUID, auth.uid()));

-- 3. TABELA DE ETIQUETAS PARA DOCS: `docs_etiquetas`
CREATE TABLE public.docs_etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    doc_id UUID NOT NULL REFERENCES public.docs(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (doc_id, etiqueta_id)
);

CREATE INDEX idx_docs_etiquetas_doc ON public.docs_etiquetas(doc_id);
CREATE INDEX idx_docs_etiquetas_etiqueta ON public.docs_etiquetas(etiqueta_id);

COMMENT ON TABLE public.docs_etiquetas IS 'Associa múltiplas etiquetas a um documento da tabela `docs`.';

-- RLS na tabela docs_etiquetas
ALTER TABLE public.docs_etiquetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por tenant na tabela docs_etiquetas" 
ON public.docs_etiquetas 
FOR ALL
TO authenticated
USING (tenant_id = COALESCE((current_setting('app.tenant_id', true))::UUID, auth.uid()));