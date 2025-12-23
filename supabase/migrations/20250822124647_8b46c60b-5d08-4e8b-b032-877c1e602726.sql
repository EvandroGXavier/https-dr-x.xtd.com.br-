-- Criar tabela de contas financeiras
CREATE TABLE public.contas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'banco', 'carteira', 'poupanca', etc
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  saldo_inicial NUMERIC DEFAULT 0,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de transações financeiras
CREATE TABLE public.transacoes_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contato_id UUID REFERENCES public.contatos(id),
  conta_financeira_id UUID REFERENCES public.contas_financeiras(id),
  tipo TEXT NOT NULL, -- 'receber' ou 'pagar'
  valor_documento NUMERIC NOT NULL,
  valor_recebido NUMERIC,
  data_emissao DATE NOT NULL,
  data_vencimento DATE NOT NULL,
  data_liquidacao DATE,
  data_vencimento_original DATE,
  data_competencia DATE,
  situacao TEXT NOT NULL DEFAULT 'aberta', -- 'aberta', 'recebida', 'paga', 'vencida', 'cancelada'
  numero_documento TEXT NOT NULL,
  numero_banco TEXT,
  categoria TEXT NOT NULL,
  historico TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- RLS Policies para contas_financeiras
CREATE POLICY "Users can view their own contas_financeiras" 
ON public.contas_financeiras 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own contas_financeiras" 
ON public.contas_financeiras 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contas_financeiras" 
ON public.contas_financeiras 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own contas_financeiras" 
ON public.contas_financeiras 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para transacoes_financeiras
CREATE POLICY "Users can view their own transacoes_financeiras" 
ON public.transacoes_financeiras 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own transacoes_financeiras" 
ON public.transacoes_financeiras 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transacoes_financeiras" 
ON public.transacoes_financeiras 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own transacoes_financeiras" 
ON public.transacoes_financeiras 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Triggers para updated_at
CREATE TRIGGER update_contas_financeiras_updated_at
BEFORE UPDATE ON public.contas_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transacoes_financeiras_updated_at
BEFORE UPDATE ON public.transacoes_financeiras
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para obter saldo da conta
CREATE OR REPLACE FUNCTION public.get_saldo_conta(conta_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  saldo_inicial NUMERIC;
  saldo_movimentacoes NUMERIC;
BEGIN
  -- Buscar saldo inicial
  SELECT cf.saldo_inicial INTO saldo_inicial
  FROM public.contas_financeiras cf
  WHERE cf.id = conta_id AND (cf.user_id = auth.uid() OR has_role('admin'));
  
  IF saldo_inicial IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Somar movimentações
  SELECT COALESCE(
    SUM(CASE 
      WHEN tipo = 'receber' AND situacao IN ('recebida') THEN valor_recebido
      WHEN tipo = 'pagar' AND situacao IN ('paga') THEN -valor_recebido
      ELSE 0
    END), 0
  ) INTO saldo_movimentacoes
  FROM public.transacoes_financeiras
  WHERE conta_financeira_id = conta_id AND (user_id = auth.uid() OR has_role('admin'));
  
  RETURN saldo_inicial + saldo_movimentacoes;
END;
$$;