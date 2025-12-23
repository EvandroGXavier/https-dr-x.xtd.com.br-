-- Tabela para armazenar configurações por tenant
CREATE TABLE public.configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    chave TEXT NOT NULL,
    valor TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT configuracoes_tenant_id_chave_key UNIQUE (tenant_id, chave)
);

-- Comentários
COMMENT ON TABLE public.configuracoes IS 'Armazena configurações chave-valor específicas para cada tenant.';
COMMENT ON COLUMN public.configuracoes.chave IS 'A chave única da configuração (ex: contatos.cep_api_url).';
COMMENT ON COLUMN public.configuracoes.valor IS 'O valor da configuração.';

-- Habilitar RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Política de leitura por tenant - usando auth.uid() como tenant_id
CREATE POLICY "read_by_tenant" ON public.configuracoes
FOR SELECT USING (tenant_id = auth.uid());

-- Política de escrita (INSERT, UPDATE, DELETE) por tenant
CREATE POLICY "write_by_tenant" ON public.configuracoes
FOR ALL USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());

-- Trigger para auto-atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_configuracoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_configuracoes_updated_at
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION update_configuracoes_updated_at();