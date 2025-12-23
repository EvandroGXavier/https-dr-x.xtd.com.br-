-- Create enum types for legal process management
CREATE TYPE processo_status AS ENUM ('ativo', 'suspenso', 'arquivado', 'finalizado');
CREATE TYPE processo_tipo AS ENUM ('civel', 'criminal', 'trabalhista', 'tributario', 'previdenciario', 'administrativo', 'outros');
CREATE TYPE processo_instancia AS ENUM ('primeira', 'segunda', 'superior', 'supremo');
CREATE TYPE qualificacao_parte AS ENUM ('autor', 'reu', 'testemunha', 'juizo', 'advogado', 'ministerio_publico', 'terceiro_interessado', 'perito', 'outros');
CREATE TYPE movimentacao_tipo AS ENUM ('decisao', 'despacho', 'audiencia', 'juntada', 'peticao', 'sentenca', 'recurso', 'outros');
CREATE TYPE contrato_status AS ENUM ('rascunho', 'enviado', 'aprovado', 'assinado', 'cancelado');
CREATE TYPE contrato_tipo AS ENUM ('honorarios', 'acordo_judicial', 'compra_venda', 'outros');

-- Main processes table
CREATE TABLE public.processos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    empresa_id UUID,
    filial_id UUID,
    numero_processo TEXT NOT NULL,
    cliente_principal_id UUID NOT NULL,
    advogado_responsavel_id UUID NOT NULL,
    tribunal TEXT NOT NULL,
    comarca TEXT,
    vara TEXT,
    tipo processo_tipo NOT NULL DEFAULT 'civel',
    instancia processo_instancia NOT NULL DEFAULT 'primeira',
    status processo_status NOT NULL DEFAULT 'ativo',
    valor_causa NUMERIC(15,2),
    assunto_principal TEXT NOT NULL,
    observacoes TEXT,
    data_distribuicao DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process parties (multiple parties per process)
CREATE TABLE public.processo_partes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    processo_id UUID NOT NULL,
    contato_id UUID NOT NULL,
    qualificacao qualificacao_parte NOT NULL,
    principal BOOLEAN DEFAULT false,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process movements/actions
CREATE TABLE public.processo_movimentacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    processo_id UUID NOT NULL,
    id_tribunal TEXT, -- Native tribunal ID when available
    data_movimentacao TIMESTAMPTZ NOT NULL,
    tipo movimentacao_tipo NOT NULL,
    titulo TEXT NOT NULL,
    descricao TEXT,
    documento_url TEXT,
    documento_nome TEXT,
    hash_deduplicacao TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process contracts
CREATE TABLE public.processo_contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    processo_id UUID NOT NULL,
    cliente_contrato_id UUID NOT NULL,
    tipo contrato_tipo NOT NULL DEFAULT 'honorarios',
    status contrato_status NOT NULL DEFAULT 'rascunho',
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor_total NUMERIC(15,2),
    documento_gerado_url TEXT,
    documento_nome TEXT,
    data_envio TIMESTAMPTZ,
    data_aprovacao TIMESTAMPTZ,
    data_assinatura TIMESTAMPTZ,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contract financial items
CREATE TABLE public.processo_contrato_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    contrato_id UUID NOT NULL,
    descricao TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'receber' or 'pagar'
    valor NUMERIC(15,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    parcela_numero INTEGER DEFAULT 1,
    total_parcelas INTEGER DEFAULT 1,
    observacoes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process developments (sub-processes, appeals, etc.)
CREATE TABLE public.processo_desdobramentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    processo_principal_id UUID NOT NULL,
    numero_processo TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'recurso', 'execucao', 'acordo', etc.
    tribunal TEXT,
    comarca TEXT,
    vara TEXT,
    status processo_status NOT NULL DEFAULT 'ativo',
    descricao TEXT,
    data_distribuicao DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_partes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_contrato_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_desdobramentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for processos
CREATE POLICY "Users can create their own processos" ON public.processos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processos" ON public.processos
    FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processos" ON public.processos
    FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processos" ON public.processos
    FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for processo_partes
CREATE POLICY "Users can create their own processo_partes" ON public.processo_partes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_partes" ON public.processo_partes
    FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_partes" ON public.processo_partes
    FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_partes" ON public.processo_partes
    FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for processo_movimentacoes
CREATE POLICY "Users can create their own processo_movimentacoes" ON public.processo_movimentacoes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_movimentacoes" ON public.processo_movimentacoes
    FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_movimentacoes" ON public.processo_movimentacoes
    FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_movimentacoes" ON public.processo_movimentacoes
    FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for processo_contratos
CREATE POLICY "Users can create their own processo_contratos" ON public.processo_contratos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_contratos" ON public.processo_contratos
    FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_contratos" ON public.processo_contratos
    FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_contratos" ON public.processo_contratos
    FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for processo_contrato_itens
CREATE POLICY "Users can create their own processo_contrato_itens" ON public.processo_contrato_itens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_contrato_itens" ON public.processo_contrato_itens
    FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_contrato_itens" ON public.processo_contrato_itens
    FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_contrato_itens" ON public.processo_contrato_itens
    FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for processo_desdobramentos
CREATE POLICY "Users can create their own processo_desdobramentos" ON public.processo_desdobramentos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_desdobramentos" ON public.processo_desdobramentos
    FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_desdobramentos" ON public.processo_desdobramentos
    FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_desdobramentos" ON public.processo_desdobramentos
    FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Create indexes for performance
CREATE INDEX idx_processos_user_id ON public.processos(user_id);
CREATE INDEX idx_processos_cliente_principal ON public.processos(cliente_principal_id);
CREATE INDEX idx_processos_status ON public.processos(status);
CREATE INDEX idx_processos_numero ON public.processos(numero_processo);

CREATE INDEX idx_processo_partes_processo_id ON public.processo_partes(processo_id);
CREATE INDEX idx_processo_partes_contato_id ON public.processo_partes(contato_id);

CREATE INDEX idx_processo_movimentacoes_processo_id ON public.processo_movimentacoes(processo_id);
CREATE INDEX idx_processo_movimentacoes_data ON public.processo_movimentacoes(data_movimentacao);
CREATE INDEX idx_processo_movimentacoes_hash ON public.processo_movimentacoes(hash_deduplicacao);

CREATE INDEX idx_processo_contratos_processo_id ON public.processo_contratos(processo_id);
CREATE INDEX idx_processo_contratos_status ON public.processo_contratos(status);

CREATE INDEX idx_processo_contrato_itens_contrato_id ON public.processo_contrato_itens(contrato_id);

CREATE INDEX idx_processo_desdobramentos_principal ON public.processo_desdobramentos(processo_principal_id);

-- Create triggers for updated_at
CREATE TRIGGER update_processos_updated_at
    BEFORE UPDATE ON public.processos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processo_contratos_updated_at
    BEFORE UPDATE ON public.processo_contratos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_processo_desdobramentos_updated_at
    BEFORE UPDATE ON public.processo_desdobramentos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get process with parties
CREATE OR REPLACE FUNCTION public.get_processo_with_parties(processo_id_param UUID)
RETURNS TABLE(
    processo_data JSONB,
    partes JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_jsonb(p.*) as processo_data,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', pp.id,
                    'qualificacao', pp.qualificacao,
                    'principal', pp.principal,
                    'observacoes', pp.observacoes,
                    'contato', to_jsonb(c.*)
                )
            ) FILTER (WHERE pp.id IS NOT NULL),
            '[]'::jsonb
        ) as partes
    FROM public.processos p
    LEFT JOIN public.processo_partes pp ON p.id = pp.processo_id
    LEFT JOIN public.contatos c ON pp.contato_id = c.id
    WHERE p.id = processo_id_param
      AND (p.user_id = auth.uid() OR has_role('admin'))
    GROUP BY p.id;
END;
$$;