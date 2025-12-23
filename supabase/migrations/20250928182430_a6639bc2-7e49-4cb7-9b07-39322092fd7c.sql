-- Tabela de junção para relacionar eventos da agenda e etiquetas
CREATE TABLE IF NOT EXISTS public.agenda_etiquetas (
    agenda_id UUID NOT NULL REFERENCES public.agendas(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (agenda_id, etiqueta_id)
);

-- Adicionar comentários para clareza
COMMENT ON TABLE public.agenda_etiquetas IS 'Vincula etiquetas aos eventos da agenda, permitindo classificação e filtragem.';
COMMENT ON COLUMN public.agenda_etiquetas.agenda_id IS 'Chave estrangeira para o evento da agenda.';
COMMENT ON COLUMN public.agenda_etiquetas.etiqueta_id IS 'Chave estrangeira para a etiqueta.';
COMMENT ON COLUMN public.agenda_etiquetas.tenant_id IS 'ID do tenant para isolamento de dados (RLS).';

-- Habilitar Row Level Security
ALTER TABLE public.agenda_etiquetas ENABLE ROW LEVEL SECURITY;

-- Política de Acesso por Tenant
CREATE POLICY "access_by_tenant" ON public.agenda_etiquetas
FOR ALL USING (tenant_id = auth.uid())
WITH CHECK (tenant_id = auth.uid());