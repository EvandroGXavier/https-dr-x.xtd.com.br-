-- Criar tabelas para sistema de honorários no processo
CREATE TYPE public.honorario_tipo AS ENUM ('inicial', 'mensal', 'exito', 'outros');
CREATE TYPE public.honorario_status AS ENUM ('rascunho', 'aprovado', 'assinado', 'cancelado');
CREATE TYPE public.honorario_parcela_status AS ENUM ('pendente', 'vencida', 'paga', 'cancelada');
CREATE TYPE public.honorario_evento_tipo AS ENUM ('criado', 'modelo_aplicado', 'valor_alterado', 'aprovado', 'assinado', 'titulo_gerado', 'exito_recebido');

-- Tabela principal de honorários do processo
CREATE TABLE public.processo_honorarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  processo_id UUID NOT NULL,
  objeto TEXT NOT NULL,
  status honorario_status NOT NULL DEFAULT 'rascunho',
  valor_total_definido NUMERIC(15,2) DEFAULT 0,
  valor_total_cobrado NUMERIC(15,2) DEFAULT 0,
  justificativa_diferenca TEXT,
  cha_gerado BOOLEAN DEFAULT FALSE,
  cha_documento_id UUID,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  data_assinatura TIMESTAMP WITH TIME ZONE,
  assinatura_nome TEXT,
  assinatura_email TEXT,
  assinatura_ip INET,
  assinatura_metodo TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens de honorários por tipo
CREATE TABLE public.processo_honorarios_item (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  honorario_id UUID NOT NULL,
  tipo honorario_tipo NOT NULL,
  descricao TEXT NOT NULL,
  valor_definido NUMERIC(15,2),
  valor_cobrado NUMERIC(15,2),
  percentual_exito NUMERIC(5,2),
  referencia_oab TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parcelas dos honorários
CREATE TABLE public.processo_honorarios_parcela (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  honorario_item_id UUID NOT NULL,
  numero_parcela INTEGER NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status honorario_parcela_status NOT NULL DEFAULT 'pendente',
  transacao_financeira_id UUID,
  recorrente BOOLEAN DEFAULT FALSE,
  dia_vencimento INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documentos vinculados aos honorários
CREATE TABLE public.processo_honorarios_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  honorario_id UUID NOT NULL,
  documento_id UUID NOT NULL,
  tipo_documento TEXT NOT NULL,
  gerado_automaticamente BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Eventos/timeline dos honorários
CREATE TABLE public.processo_honorarios_eventos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  honorario_id UUID NOT NULL,
  tipo honorario_evento_tipo NOT NULL,
  descricao TEXT NOT NULL,
  dados_antes JSONB,
  dados_depois JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Extensão da biblioteca para perfis de honorários
CREATE TABLE public.biblioteca_modelos_honorarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modelo_id UUID NOT NULL,
  area_direito TEXT,
  nome_perfil TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens padrão do perfil de honorários
CREATE TABLE public.biblioteca_modelos_honorarios_item (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  perfil_honorario_id UUID NOT NULL,
  tipo honorario_tipo NOT NULL,
  descricao TEXT NOT NULL,
  valor_sugerido NUMERIC(15,2),
  percentual_exito NUMERIC(5,2),
  referencia_oab TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Parcelas padrão do perfil
CREATE TABLE public.biblioteca_modelos_honorarios_parcela (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  honorario_item_id UUID NOT NULL,
  numero_parcela INTEGER NOT NULL,
  percentual_valor NUMERIC(5,2) NOT NULL,
  dias_vencimento INTEGER NOT NULL,
  recorrente BOOLEAN DEFAULT FALSE,
  dia_vencimento INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.processo_honorarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_honorarios_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_honorarios_parcela ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_honorarios_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processo_honorarios_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca_modelos_honorarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca_modelos_honorarios_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biblioteca_modelos_honorarios_parcela ENABLE ROW LEVEL SECURITY;

-- RLS Policies para processo_honorarios
CREATE POLICY "Users can create their own processo_honorarios" 
ON public.processo_honorarios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_honorarios" 
ON public.processo_honorarios FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_honorarios" 
ON public.processo_honorarios FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_honorarios" 
ON public.processo_honorarios FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para processo_honorarios_item
CREATE POLICY "Users can create their own processo_honorarios_item" 
ON public.processo_honorarios_item FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_honorarios_item" 
ON public.processo_honorarios_item FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_honorarios_item" 
ON public.processo_honorarios_item FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_honorarios_item" 
ON public.processo_honorarios_item FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para processo_honorarios_parcela
CREATE POLICY "Users can create their own processo_honorarios_parcela" 
ON public.processo_honorarios_parcela FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_honorarios_parcela" 
ON public.processo_honorarios_parcela FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_honorarios_parcela" 
ON public.processo_honorarios_parcela FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_honorarios_parcela" 
ON public.processo_honorarios_parcela FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para processo_honorarios_documentos
CREATE POLICY "Users can create their own processo_honorarios_documentos" 
ON public.processo_honorarios_documentos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_honorarios_documentos" 
ON public.processo_honorarios_documentos FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own processo_honorarios_documentos" 
ON public.processo_honorarios_documentos FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_honorarios_documentos" 
ON public.processo_honorarios_documentos FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para processo_honorarios_eventos
CREATE POLICY "Users can create their own processo_honorarios_eventos" 
ON public.processo_honorarios_eventos FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own processo_honorarios_eventos" 
ON public.processo_honorarios_eventos FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para biblioteca_modelos_honorarios
CREATE POLICY "Users can create their own biblioteca_modelos_honorarios" 
ON public.biblioteca_modelos_honorarios FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own biblioteca_modelos_honorarios" 
ON public.biblioteca_modelos_honorarios FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own biblioteca_modelos_honorarios" 
ON public.biblioteca_modelos_honorarios FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own biblioteca_modelos_honorarios" 
ON public.biblioteca_modelos_honorarios FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para biblioteca_modelos_honorarios_item
CREATE POLICY "Users can create their own biblioteca_modelos_honorarios_item" 
ON public.biblioteca_modelos_honorarios_item FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own biblioteca_modelos_honorarios_item" 
ON public.biblioteca_modelos_honorarios_item FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own biblioteca_modelos_honorarios_item" 
ON public.biblioteca_modelos_honorarios_item FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own biblioteca_modelos_honorarios_item" 
ON public.biblioteca_modelos_honorarios_item FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies para biblioteca_modelos_honorarios_parcela
CREATE POLICY "Users can create their own biblioteca_modelos_honorarios_parcela" 
ON public.biblioteca_modelos_honorarios_parcela FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own biblioteca_modelos_honorarios_parcela" 
ON public.biblioteca_modelos_honorarios_parcela FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own biblioteca_modelos_honorarios_parcela" 
ON public.biblioteca_modelos_honorarios_parcela FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own biblioteca_modelos_honorarios_parcela" 
ON public.biblioteca_modelos_honorarios_parcela FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Índices para performance
CREATE INDEX idx_processo_honorarios_processo_id ON public.processo_honorarios(processo_id);
CREATE INDEX idx_processo_honorarios_status ON public.processo_honorarios(status);
CREATE INDEX idx_processo_honorarios_item_honorario_id ON public.processo_honorarios_item(honorario_id);
CREATE INDEX idx_processo_honorarios_parcela_item_id ON public.processo_honorarios_parcela(honorario_item_id);
CREATE INDEX idx_processo_honorarios_parcela_vencimento ON public.processo_honorarios_parcela(data_vencimento);
CREATE INDEX idx_processo_honorarios_eventos_honorario_id ON public.processo_honorarios_eventos(honorario_id);
CREATE INDEX idx_biblioteca_modelos_honorarios_modelo_id ON public.biblioteca_modelos_honorarios(modelo_id);

-- Triggers para updated_at
CREATE TRIGGER update_processo_honorarios_updated_at
BEFORE UPDATE ON public.processo_honorarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_biblioteca_modelos_honorarios_updated_at
BEFORE UPDATE ON public.biblioteca_modelos_honorarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para gerar títulos financeiros de honorários
CREATE OR REPLACE FUNCTION public.gerar_titulos_honorarios(honorario_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  honorario_rec RECORD;
  parcela_rec RECORD;
  total_gerado INTEGER := 0;
  resultado JSONB;
BEGIN
  -- Buscar dados do honorário
  SELECT h.*, p.numero_processo, p.empresa_id, p.filial_id
  INTO honorario_rec
  FROM public.processo_honorarios h
  JOIN public.processos p ON h.processo_id = p.id
  WHERE h.id = honorario_id_param 
    AND (h.user_id = auth.uid() OR has_role('admin'));
  
  IF honorario_rec IS NULL THEN
    RAISE EXCEPTION 'Honorário não encontrado ou sem permissão';
  END IF;
  
  -- Verificar se já foram gerados títulos
  IF EXISTS (
    SELECT 1 FROM public.transacoes_financeiras 
    WHERE origem_tipo = 'honorario' AND origem_id = honorario_id_param
  ) THEN
    RAISE EXCEPTION 'Títulos já foram gerados para este honorário';
  END IF;
  
  -- Gerar títulos para cada parcela
  FOR parcela_rec IN 
    SELECT p.*, i.tipo, i.descricao
    FROM public.processo_honorarios_parcela p
    JOIN public.processo_honorarios_item i ON p.honorario_item_id = i.id
    WHERE i.honorario_id = honorario_id_param
    ORDER BY p.data_vencimento
  LOOP
    INSERT INTO public.transacoes_financeiras (
      user_id,
      empresa_id,
      filial_id,
      tipo,
      categoria,
      historico,
      numero_documento,
      data_emissao,
      data_vencimento,
      data_competencia,
      valor_documento,
      situacao,
      forma_pagamento,
      origem_tipo,
      origem_id,
      observacoes
    ) VALUES (
      honorario_rec.user_id,
      honorario_rec.empresa_id,
      honorario_rec.filial_id,
      'receber',
      'HONORARIOS',
      format('Honorários %s - %s - Parcela %s - Processo %s', 
        parcela_rec.tipo, 
        parcela_rec.descricao,
        parcela_rec.numero_parcela,
        honorario_rec.numero_processo
      ),
      format('HON-%s-%s', honorario_rec.id::text, parcela_rec.numero_parcela),
      CURRENT_DATE,
      parcela_rec.data_vencimento,
      parcela_rec.data_vencimento,
      parcela_rec.valor,
      'aberta',
      'BOLETO',
      'honorario',
      honorario_id_param,
      format('Gerado automaticamente do honorário - Processo %s', 
        honorario_rec.numero_processo
      )
    );
    
    total_gerado := total_gerado + 1;
  END LOOP;
  
  -- Registrar evento
  INSERT INTO public.processo_honorarios_eventos (
    user_id, honorario_id, tipo, descricao, metadata
  ) VALUES (
    auth.uid(), honorario_id_param, 'titulo_gerado',
    format('Gerados %s títulos financeiros', total_gerado),
    jsonb_build_object('total_titulos', total_gerado)
  );
  
  resultado := jsonb_build_object(
    'success', true,
    'total_gerado', total_gerado
  );
  
  RETURN resultado;
END;
$function$;