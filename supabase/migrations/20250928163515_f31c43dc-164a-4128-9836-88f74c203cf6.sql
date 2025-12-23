-- Tabela de junção para relacionar transações financeiras e etiquetas
CREATE TABLE public.transacoes_financeiras_etiquetas (
    transacao_id UUID NOT NULL REFERENCES public.transacoes_financeiras(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (transacao_id, etiqueta_id)
);

-- Adicionar comentários para clareza
COMMENT ON TABLE public.transacoes_financeiras_etiquetas IS 'Vincula etiquetas às transações financeiras para classificação e filtragem.';
COMMENT ON COLUMN public.transacoes_financeiras_etiquetas.transacao_id IS 'Chave estrangeira para a transação financeira.';
COMMENT ON COLUMN public.transacoes_financeiras_etiquetas.etiqueta_id IS 'Chave estrangeira para a etiqueta.';
COMMENT ON COLUMN public.transacoes_financeiras_etiquetas.tenant_id IS 'ID do tenant para isolamento de dados (RLS).';

-- Habilitar Row Level Security
ALTER TABLE public.transacoes_financeiras_etiquetas ENABLE ROW LEVEL SECURITY;

-- Política de Acesso por Tenant
CREATE POLICY "access_by_tenant" ON public.transacoes_financeiras_etiquetas
FOR ALL USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());