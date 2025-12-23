-- ============================================================
-- COMPRAS: Melhorias de Segurança, Auditoria e Validações
-- ============================================================

-- 1. Adicionar colunas de controle e segurança em compras (IF NOT EXISTS)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compras' AND column_name='data_registro') THEN
    ALTER TABLE public.compras ADD COLUMN data_registro timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compras' AND column_name='hash_arquivo') THEN
    ALTER TABLE public.compras ADD COLUMN hash_arquivo text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compras' AND column_name='origem_arquivo_tipo') THEN
    ALTER TABLE public.compras ADD COLUMN origem_arquivo_tipo text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='compras' AND column_name='origem_arquivo_url') THEN
    ALTER TABLE public.compras ADD COLUMN origem_arquivo_url text;
  END IF;
END $$;

-- 2. Criar índice único para evitar duplicidade de documentos por tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_compras_hash_arquivo_tenant 
  ON public.compras(tenant_id, hash_arquivo) 
  WHERE hash_arquivo IS NOT NULL;

-- 3. Função de bloqueio de edição após aprovação
CREATE OR REPLACE FUNCTION public.trg_compras_bloqueio_edicao()
RETURNS trigger AS $$
BEGIN
  IF (OLD.status = 'aprovada') THEN
    RAISE EXCEPTION 'Compra aprovada não pode ser alterada ou excluída';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger de bloqueio
DROP TRIGGER IF EXISTS compras_bloqueio_edicao ON public.compras;
CREATE TRIGGER compras_bloqueio_edicao
  BEFORE UPDATE OR DELETE ON public.compras
  FOR EACH ROW EXECUTE FUNCTION public.trg_compras_bloqueio_edicao();

-- 5. Função para aprovar compra e gerar financeiro
CREATE OR REPLACE FUNCTION public.fn_aprovar_compra(p_compra_id uuid)
RETURNS void AS $$
DECLARE
  v_compra record;
  v_parcela record;
BEGIN
  -- Buscar compra
  SELECT * INTO v_compra 
  FROM public.compras 
  WHERE id = p_compra_id AND tenant_id = auth.uid();
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Compra não encontrada para este tenant'; 
  END IF;

  -- Verificar se já está aprovada (idempotente)
  IF v_compra.status = 'aprovada' THEN
    RETURN;
  END IF;

  -- Atualizar status
  UPDATE public.compras
     SET status = 'aprovada',
         updated_at = now()
   WHERE id = p_compra_id;

  -- Gerar transações financeiras (contas a pagar) para cada parcela
  FOR v_parcela IN 
    SELECT * FROM public.compras_parcelas 
    WHERE compra_id = p_compra_id 
    ORDER BY numero_parcela
  LOOP
    INSERT INTO public.transacoes_financeiras (
      user_id, tipo, categoria, historico, numero_documento,
      data_emissao, data_vencimento, data_competencia,
      valor_documento, situacao, forma_pagamento,
      contato_id, empresa_id, filial_id,
      origem_tipo, origem_id
    )
    VALUES (
      auth.uid(), 'pagar', 'COMPRAS',
      concat('Compra ', COALESCE(v_compra.numero_nfe, 'S/N'), ' - Parcela ', v_parcela.numero_parcela),
      COALESCE(v_compra.numero_nfe, v_compra.id::text),
      COALESCE(v_compra.data_emissao, CURRENT_DATE),
      v_parcela.data_vencimento,
      COALESCE(v_compra.data_emissao, CURRENT_DATE),
      v_parcela.valor,
      'aberta', 'BOLETO',
      v_compra.fornecedor_id, v_compra.empresa_id, v_compra.filial_id,
      'compra', p_compra_id
    );
  END LOOP;

  -- Log de auditoria
  PERFORM log_security_event(
    'compra_aprovada',
    format('Compra %s aprovada e títulos financeiros gerados', p_compra_id),
    jsonb_build_object(
      'compra_id', p_compra_id,
      'numero_nfe', v_compra.numero_nfe,
      'valor_total', v_compra.valor_total
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VENDAS: Criação completa do módulo
-- ============================================================

-- 1. Tabela vendas
CREATE TABLE IF NOT EXISTS public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  empresa_id uuid,
  filial_id uuid,
  fornecedor_id uuid, -- cliente (reutiliza a nomenclatura do contatos_v2)
  tipo character varying DEFAULT 'venda',
  numero_nfe character varying,
  chave_nfe character varying,
  serie text,
  data_emissao date,
  data_vencimento date,
  data_registro timestamptz NOT NULL DEFAULT (now() AT TIME ZONE 'America/Sao_Paulo'),
  valor_total numeric(14,2) DEFAULT 0,
  status character varying NOT NULL DEFAULT 'pendente',
  origem_arquivo_url text,
  origem_arquivo_tipo text,
  hash_arquivo text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela vendas_itens
CREATE TABLE IF NOT EXISTS public.vendas_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid NOT NULL REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id uuid,
  codigo_produto character varying,
  descricao text NOT NULL,
  ncm character varying,
  cfop character varying,
  unidade character varying,
  quantidade numeric(14,4) NOT NULL DEFAULT 1,
  valor_unitario numeric(14,4) NOT NULL DEFAULT 0,
  valor_total numeric(14,2) NOT NULL DEFAULT 0,
  aliquota_icms numeric,
  aliquota_pis numeric,
  aliquota_cofins numeric,
  valor_ipi numeric,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabela vendas_parcelas
CREATE TABLE IF NOT EXISTS public.vendas_parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id uuid REFERENCES public.vendas(id) ON DELETE CASCADE,
  numero_parcela smallint NOT NULL,
  data_vencimento date NOT NULL,
  valor numeric NOT NULL,
  transacao_id uuid,
  created_at timestamptz DEFAULT now()
);

-- 4. Índices para vendas
CREATE INDEX IF NOT EXISTS idx_vendas_tenant ON public.vendas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendas_status ON public.vendas(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_vendas_hash_arquivo_tenant 
  ON public.vendas(tenant_id, hash_arquivo) 
  WHERE hash_arquivo IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vendas_itens_venda ON public.vendas_itens(venda_id);
CREATE INDEX IF NOT EXISTS idx_vendas_parcelas_venda ON public.vendas_parcelas(venda_id);

-- 5. Habilitar RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_parcelas ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para vendas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendas' AND policyname='vendas_select_by_tenant') THEN
    CREATE POLICY vendas_select_by_tenant ON public.vendas
      FOR SELECT USING (tenant_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendas' AND policyname='vendas_insert_by_tenant') THEN
    CREATE POLICY vendas_insert_by_tenant ON public.vendas
      FOR INSERT WITH CHECK (tenant_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendas' AND policyname='vendas_update_by_tenant') THEN
    CREATE POLICY vendas_update_by_tenant ON public.vendas
      FOR UPDATE USING (tenant_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendas' AND policyname='vendas_delete_by_tenant') THEN
    CREATE POLICY vendas_delete_by_tenant ON public.vendas
      FOR DELETE USING (tenant_id = auth.uid());
  END IF;

  -- Políticas para vendas_itens
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendas_itens' AND policyname='vendas_itens_access') THEN
    CREATE POLICY vendas_itens_access ON public.vendas_itens
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.vendas 
          WHERE vendas.id = vendas_itens.venda_id 
          AND vendas.tenant_id = auth.uid()
        )
      );
  END IF;

  -- Políticas para vendas_parcelas
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendas_parcelas' AND policyname='vendas_parcelas_access') THEN
    CREATE POLICY vendas_parcelas_access ON public.vendas_parcelas
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.vendas 
          WHERE vendas.id = vendas_parcelas.venda_id 
          AND vendas.tenant_id = auth.uid()
        )
      );
  END IF;
END$$;

-- 7. Função de bloqueio para vendas
CREATE OR REPLACE FUNCTION public.trg_vendas_bloqueio_edicao()
RETURNS trigger AS $$
BEGIN
  IF (OLD.status = 'aprovada') THEN
    RAISE EXCEPTION 'Venda aprovada não pode ser alterada ou excluída';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger de bloqueio para vendas
DROP TRIGGER IF EXISTS vendas_bloqueio_edicao ON public.vendas;
CREATE TRIGGER vendas_bloqueio_edicao
  BEFORE UPDATE OR DELETE ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.trg_vendas_bloqueio_edicao();

-- 9. Função para aprovar venda e gerar financeiro
CREATE OR REPLACE FUNCTION public.fn_aprovar_venda(p_venda_id uuid)
RETURNS void AS $$
DECLARE
  v_venda record;
  v_parcela record;
BEGIN
  -- Buscar venda
  SELECT * INTO v_venda 
  FROM public.vendas 
  WHERE id = p_venda_id AND tenant_id = auth.uid();
  
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Venda não encontrada para este tenant'; 
  END IF;

  -- Verificar se já está aprovada (idempotente)
  IF v_venda.status = 'aprovada' THEN
    RETURN;
  END IF;

  -- Atualizar status
  UPDATE public.vendas
     SET status = 'aprovada',
         updated_at = now()
   WHERE id = p_venda_id;

  -- Gerar transações financeiras (contas a receber) para cada parcela
  FOR v_parcela IN 
    SELECT * FROM public.vendas_parcelas 
    WHERE venda_id = p_venda_id 
    ORDER BY numero_parcela
  LOOP
    INSERT INTO public.transacoes_financeiras (
      user_id, tipo, categoria, historico, numero_documento,
      data_emissao, data_vencimento, data_competencia,
      valor_documento, situacao, forma_pagamento,
      contato_id, empresa_id, filial_id,
      origem_tipo, origem_id
    )
    VALUES (
      auth.uid(), 'receber', 'VENDAS',
      concat('Venda ', COALESCE(v_venda.numero_nfe, 'S/N'), ' - Parcela ', v_parcela.numero_parcela),
      COALESCE(v_venda.numero_nfe, v_venda.id::text),
      COALESCE(v_venda.data_emissao, CURRENT_DATE),
      v_parcela.data_vencimento,
      COALESCE(v_venda.data_emissao, CURRENT_DATE),
      v_parcela.valor,
      'aberta', 'BOLETO',
      v_venda.fornecedor_id, v_venda.empresa_id, v_venda.filial_id,
      'venda', p_venda_id
    );
  END LOOP;

  -- Log de auditoria
  PERFORM log_security_event(
    'venda_aprovada',
    format('Venda %s aprovada e títulos financeiros gerados', p_venda_id),
    jsonb_build_object(
      'venda_id', p_venda_id,
      'numero_nfe', v_venda.numero_nfe,
      'valor_total', v_venda.valor_total
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;