-- Criar tabela de junção para contatos e etiquetas (estava faltando)
CREATE TABLE IF NOT EXISTS public.contato_etiquetas (
    contato_id UUID NOT NULL REFERENCES public.contatos_v2(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (contato_id, etiqueta_id)
);

-- Comentários para documentação
COMMENT ON TABLE public.contato_etiquetas IS 'Tabela de junção entre contatos e etiquetas';
COMMENT ON COLUMN public.contato_etiquetas.contato_id IS 'ID do contato';
COMMENT ON COLUMN public.contato_etiquetas.etiqueta_id IS 'ID da etiqueta';
COMMENT ON COLUMN public.contato_etiquetas.tenant_id IS 'ID da empresa/tenant';

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_contato_etiquetas_contato ON public.contato_etiquetas(contato_id);
CREATE INDEX IF NOT EXISTS idx_contato_etiquetas_etiqueta ON public.contato_etiquetas(etiqueta_id);
CREATE INDEX IF NOT EXISTS idx_contato_etiquetas_tenant ON public.contato_etiquetas(tenant_id);

-- Habilitar RLS
ALTER TABLE public.contato_etiquetas ENABLE ROW LEVEL SECURITY;

-- Política RLS: usuários podem ver apenas etiquetas de seus contatos
CREATE POLICY "Users can view their contact tags"
ON public.contato_etiquetas
FOR SELECT
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Política RLS: usuários podem inserir etiquetas em seus contatos
CREATE POLICY "Users can insert their contact tags"
ON public.contato_etiquetas
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Política RLS: usuários podem deletar etiquetas de seus contatos
CREATE POLICY "Users can delete their contact tags"
ON public.contato_etiquetas
FOR DELETE
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);