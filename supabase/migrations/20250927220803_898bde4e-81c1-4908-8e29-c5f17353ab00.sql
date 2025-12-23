-- Criação da tabela de vínculo entre processos e etiquetas
CREATE TABLE public.processo_etiquetas (
    processo_id UUID NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES public.etiquetas(id) ON DELETE CASCADE,
    user_id UUID NOT NULL DEFAULT auth.uid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (processo_id, etiqueta_id)
);

-- Adicionar comentários para clareza
COMMENT ON TABLE public.processo_etiquetas IS 'Vincula etiquetas aos processos, permitindo organização e filtragem.';
COMMENT ON COLUMN public.processo_etiquetas.processo_id IS 'Chave estrangeira para o processo.';
COMMENT ON COLUMN public.processo_etiquetas.etiqueta_id IS 'Chave estrangeira para a etiqueta.';
COMMENT ON COLUMN public.processo_etiquetas.user_id IS 'ID do usuário para isolamento de dados (RLS).';

-- Habilitar Row Level Security
ALTER TABLE public.processo_etiquetas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para acesso por usuário
CREATE POLICY "Users can view their own processo_etiquetas" 
ON public.processo_etiquetas 
FOR SELECT 
USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can create their own processo_etiquetas" 
ON public.processo_etiquetas 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own processo_etiquetas" 
ON public.processo_etiquetas 
FOR DELETE 
USING (user_id = auth.uid() OR has_role('admin'));

-- Índices para performance
CREATE INDEX idx_processo_etiquetas_processo_id ON public.processo_etiquetas(processo_id);
CREATE INDEX idx_processo_etiquetas_etiqueta_id ON public.processo_etiquetas(etiqueta_id);
CREATE INDEX idx_processo_etiquetas_user_id ON public.processo_etiquetas(user_id);