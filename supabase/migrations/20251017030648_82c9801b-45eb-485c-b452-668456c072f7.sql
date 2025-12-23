-- =========================
-- Produtos: Referências multi-fornecedor + Estoque
-- =========================

-- 2.1 Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'produto_status') THEN
    CREATE TYPE public.produto_status AS ENUM ('rascunho','ativo','inativo','arquivado');
  END IF;
END$$;

-- 2.2 Ajustes na tabela produtos
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS status public.produto_status NOT NULL DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS atributos JSONB,
  ADD COLUMN IF NOT EXISTS foto_capa_url TEXT;

-- Índices úteis
CREATE UNIQUE INDEX IF NOT EXISTS ux_produtos_tenant_sku
  ON public.produtos(tenant_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_produtos_tenant_barcode
  ON public.produtos(tenant_id, codigo_barras) WHERE codigo_barras IS NOT NULL;

-- 2.3 Nova Tabela: produtos_referencia (produto <-> contato)
CREATE TABLE IF NOT EXISTS public.produtos_referencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  contato_id UUID NOT NULL,
  codigo_externo TEXT,
  descricao_externa TEXT,
  unidade_externa TEXT,
  fator_conversao NUMERIC(12,6) DEFAULT 1,
  ncm_externo TEXT,
  marca_externa TEXT,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_ref_tenant_contato_codigo
  ON public.produtos_referencia(tenant_id, contato_id, codigo_externo);
CREATE INDEX IF NOT EXISTS idx_ref_produto ON public.produtos_referencia(produto_id);
CREATE INDEX IF NOT EXISTS idx_ref_contato ON public.produtos_referencia(contato_id);

-- 2.4 View de Estoque (saldo = entradas - saídas)
CREATE OR REPLACE VIEW public.v_produtos_estoque AS
SELECT
  p.id AS produto_id,
  p.tenant_id,
  COALESCE((SELECT SUM(ci.quantidade) FROM public.compras_itens ci WHERE ci.produto_id = p.id), 0) AS total_comprado,
  COALESCE((SELECT SUM(vi.quantidade) FROM public.vendas_itens vi WHERE vi.produto_id = p.id), 0) AS total_vendido,
  (COALESCE((SELECT SUM(ci.quantidade) FROM public.compras_itens ci WHERE ci.produto_id = p.id), 0) -
   COALESCE((SELECT SUM(vi.quantidade) FROM public.vendas_itens vi WHERE vi.produto_id = p.id), 0)) AS estoque_atual
FROM public.produtos p;

-- 2.5 RLS
ALTER TABLE public.produtos_referencia ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='produtos_referencia' AND policyname='produtos_referencia_select_by_tenant') THEN
    CREATE POLICY produtos_referencia_select_by_tenant ON public.produtos_referencia
    FOR SELECT USING (tenant_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='produtos_referencia' AND policyname='produtos_referencia_mod_by_tenant_admin') THEN
    CREATE POLICY produtos_referencia_mod_by_tenant_admin ON public.produtos_referencia
    FOR ALL USING (tenant_id = auth.uid() AND has_role('admin'::app_role))
    WITH CHECK (tenant_id = auth.uid());
  END IF;
END$$;