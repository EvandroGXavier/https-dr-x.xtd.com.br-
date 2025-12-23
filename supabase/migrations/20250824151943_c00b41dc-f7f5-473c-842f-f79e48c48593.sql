-- Adicionar colunas empresa_id e filial_id nas tabelas especificadas
ALTER TABLE public.contatos 
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS filial_id UUID;

ALTER TABLE public.documentos 
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS filial_id UUID;

ALTER TABLE public.agendas 
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS filial_id UUID,
ADD COLUMN IF NOT EXISTS processo_id UUID;

ALTER TABLE public.contas_financeiras 
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS filial_id UUID;

ALTER TABLE public.transacoes_financeiras 
ADD COLUMN IF NOT EXISTS empresa_id UUID,
ADD COLUMN IF NOT EXISTS filial_id UUID,
ADD COLUMN IF NOT EXISTS origem_tipo TEXT,
ADD COLUMN IF NOT EXISTS origem_id UUID;

-- Criar índices compostos para performance
CREATE INDEX IF NOT EXISTS idx_contatos_empresa_filial_created 
ON public.contatos (empresa_id, filial_id, created_at);

CREATE INDEX IF NOT EXISTS idx_documentos_empresa_filial_created 
ON public.documentos (empresa_id, filial_id, created_at);

CREATE INDEX IF NOT EXISTS idx_agendas_empresa_filial_created 
ON public.agendas (empresa_id, filial_id, created_at);

CREATE INDEX IF NOT EXISTS idx_agendas_processo 
ON public.agendas (processo_id) WHERE processo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contas_financeiras_empresa_filial 
ON public.contas_financeiras (empresa_id, filial_id);

CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_empresa_filial 
ON public.transacoes_financeiras (empresa_id, filial_id, created_at);

CREATE INDEX IF NOT EXISTS idx_transacoes_financeiras_origem 
ON public.transacoes_financeiras (origem_tipo, origem_id) WHERE origem_tipo IS NOT NULL;

-- Função para gerar transações financeiras a partir de contratos
CREATE OR REPLACE FUNCTION public.gerar_transacoes_de_contrato(contrato_id_param UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  contrato_rec RECORD;
  item_rec RECORD;
  transacao_id UUID;
  total_gerado INTEGER := 0;
  resultado jsonb;
BEGIN
  -- Buscar dados do contrato
  SELECT pc.*, p.empresa_id, p.filial_id, p.numero_processo 
  INTO contrato_rec
  FROM public.processo_contratos pc
  JOIN public.processos p ON pc.processo_id = p.id
  WHERE pc.id = contrato_id_param 
    AND (pc.user_id = auth.uid() OR has_role('admin'));
  
  IF contrato_rec IS NULL THEN
    RAISE EXCEPTION 'Contrato não encontrado ou sem permissão';
  END IF;
  
  -- Verificar se o contrato está em status válido para gerar transações
  IF contrato_rec.status NOT IN ('aprovado', 'assinado') THEN
    RAISE EXCEPTION 'Contrato deve estar aprovado ou assinado para gerar transações';
  END IF;
  
  -- Verificar se já existem transações para este contrato
  IF EXISTS (
    SELECT 1 FROM public.transacoes_financeiras 
    WHERE origem_tipo = 'contrato' AND origem_id = contrato_id_param
  ) THEN
    RAISE EXCEPTION 'Transações já foram geradas para este contrato';
  END IF;
  
  -- Gerar transações para cada item do contrato
  FOR item_rec IN 
    SELECT * FROM public.processo_contrato_itens 
    WHERE contrato_id = contrato_id_param
    ORDER BY data_vencimento
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
      contato_id,
      origem_tipo,
      origem_id,
      observacoes
    ) VALUES (
      contrato_rec.user_id,
      contrato_rec.empresa_id,
      contrato_rec.filial_id,
      CASE WHEN item_rec.tipo = 'receita' THEN 'receber' ELSE 'pagar' END,
      'HONORARIOS',
      format('Contrato %s - %s - Parcela %s/%s', 
        contrato_rec.titulo, 
        item_rec.descricao,
        item_rec.parcela_numero,
        item_rec.total_parcelas
      ),
      format('CONT-%s-%s', contrato_rec.id::text, item_rec.parcela_numero),
      CURRENT_DATE,
      item_rec.data_vencimento,
      item_rec.data_vencimento,
      item_rec.valor,
      'aberta',
      'BOLETO',
      contrato_rec.cliente_contrato_id,
      'contrato',
      contrato_id_param,
      format('Gerado automaticamente do contrato %s - Processo %s', 
        contrato_rec.titulo, 
        contrato_rec.numero_processo
      )
    ) RETURNING id INTO transacao_id;
    
    total_gerado := total_gerado + 1;
  END LOOP;
  
  -- Log da operação
  PERFORM public.log_security_event(
    'contract_financial_generation',
    format('Geradas %s transações financeiras do contrato %s', total_gerado, contrato_rec.titulo),
    jsonb_build_object(
      'contrato_id', contrato_id_param,
      'total_transacoes', total_gerado,
      'processo_numero', contrato_rec.numero_processo
    )
  );
  
  resultado := jsonb_build_object(
    'success', true,
    'total_gerado', total_gerado,
    'contrato_titulo', contrato_rec.titulo
  );
  
  RETURN resultado;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM public.log_security_event(
      'contract_financial_generation_error',
      format('Erro ao gerar transações do contrato %s: %s', contrato_id_param, SQLERRM),
      jsonb_build_object(
        'contrato_id', contrato_id_param,
        'error', SQLERRM
      )
    );
    RAISE;
END;
$$;