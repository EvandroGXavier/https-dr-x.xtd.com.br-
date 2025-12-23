-- =========================
-- Produtos Module - Schema Update
-- =========================

-- 3.1 Tipos / Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'produto_status') THEN
    CREATE TYPE public.produto_status AS ENUM ('rascunho','ativo','inativo','arquivado');
  END IF;
END$$;

-- 3.2 Update existing produtos table
DO $$
BEGIN
  -- Add missing columns to produtos table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'status') THEN
    ALTER TABLE public.produtos ADD COLUMN status public.produto_status NOT NULL DEFAULT 'rascunho';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'aprovado_em') THEN
    ALTER TABLE public.produtos ADD COLUMN aprovado_em TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'apelido') THEN
    ALTER TABLE public.produtos ADD COLUMN apelido TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'sku') THEN
    ALTER TABLE public.produtos ADD COLUMN sku TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'ncm') THEN
    ALTER TABLE public.produtos ADD COLUMN ncm TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'nome') THEN
    ALTER TABLE public.produtos ADD COLUMN nome TEXT NOT NULL DEFAULT '';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'unidade_id') THEN
    ALTER TABLE public.produtos ADD COLUMN unidade_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'marca_id') THEN
    ALTER TABLE public.produtos ADD COLUMN marca_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'categoria_id') THEN
    ALTER TABLE public.produtos ADD COLUMN categoria_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'preco_base') THEN
    ALTER TABLE public.produtos ADD COLUMN preco_base NUMERIC(14,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'custo_reposicao') THEN
    ALTER TABLE public.produtos ADD COLUMN custo_reposicao NUMERIC(14,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'estoque_minimo') THEN
    ALTER TABLE public.produtos ADD COLUMN estoque_minimo NUMERIC(14,3);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'peso_kg') THEN
    ALTER TABLE public.produtos ADD COLUMN peso_kg NUMERIC(12,3);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'dimensoes') THEN
    ALTER TABLE public.produtos ADD COLUMN dimensoes JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'atributos') THEN
    ALTER TABLE public.produtos ADD COLUMN atributos JSONB;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'foto_capa_url') THEN
    ALTER TABLE public.produtos ADD COLUMN foto_capa_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'descricao') THEN
    ALTER TABLE public.produtos ADD COLUMN descricao TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'criado_por') THEN
    ALTER TABLE public.produtos ADD COLUMN criado_por UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'atualizado_por') THEN
    ALTER TABLE public.produtos ADD COLUMN atualizado_por UUID;
  END IF;
END$$;

-- 3.3 Tabelas de Apoio
CREATE TABLE IF NOT EXISTS public.produtos_unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  sigla TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_unidades_tenant ON public.produtos_unidades(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_unidades_tenant_sigla ON public.produtos_unidades(tenant_id, sigla);

CREATE TABLE IF NOT EXISTS public.produtos_marcas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome TEXT NOT NULL,
  site TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_marcas_tenant ON public.produtos_marcas(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_marcas_tenant_nome ON public.produtos_marcas(tenant_id, nome);

CREATE TABLE IF NOT EXISTS public.produtos_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  nome TEXT NOT NULL,
  pai_id UUID NULL REFERENCES public.produtos_categorias(id) ON DELETE SET NULL,
  path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_categorias_tenant ON public.produtos_categorias(tenant_id);

-- 3.4 Add foreign keys to produtos (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_unidade_id_fkey') THEN
    ALTER TABLE public.produtos ADD CONSTRAINT produtos_unidade_id_fkey 
      FOREIGN KEY (unidade_id) REFERENCES public.produtos_unidades(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_marca_id_fkey') THEN
    ALTER TABLE public.produtos ADD CONSTRAINT produtos_marca_id_fkey 
      FOREIGN KEY (marca_id) REFERENCES public.produtos_marcas(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'produtos_categoria_id_fkey') THEN
    ALTER TABLE public.produtos ADD CONSTRAINT produtos_categoria_id_fkey 
      FOREIGN KEY (categoria_id) REFERENCES public.produtos_categorias(id);
  END IF;
END$$;

-- 3.5 Add unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_produtos_tenant_sku ON public.produtos(tenant_id, sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_produtos_tenant_barcode ON public.produtos(tenant_id, codigo_barras) WHERE codigo_barras IS NOT NULL;

-- 3.6 Imagens do produto
CREATE TABLE IF NOT EXISTS public.produtos_imagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  posicao INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_produtos_imagens_tenant_prod ON public.produtos_imagens(tenant_id, produto_id);

-- 3.7 View de busca
CREATE OR REPLACE VIEW public.v_produtos_busca AS
SELECT
  p.id, p.tenant_id, p.nome, p.apelido, p.sku, p.codigo_barras, p.ncm,
  p.status, p.preco_base, p.marca_id, p.categoria_id, p.unidade_id,
  p.foto_capa_url, p.created_at, p.updated_at,
  COALESCE(p.nome,'') || ' ' || COALESCE(p.apelido,'') || ' ' || COALESCE(p.sku,'') || ' ' || COALESCE(p.codigo_barras,'') AS termo
FROM public.produtos p;

-- 3.8 RLS Policies
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_marcas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos_imagens ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS produtos_select_by_tenant ON public.produtos;
CREATE POLICY produtos_select_by_tenant ON public.produtos
  FOR SELECT USING (tenant_id = auth.uid() OR has_role('admin'::app_role));

DROP POLICY IF EXISTS produtos_mod_by_tenant_admin ON public.produtos;
CREATE POLICY produtos_mod_by_tenant_admin ON public.produtos
  FOR ALL USING (tenant_id = auth.uid() OR has_role('admin'::app_role))
  WITH CHECK (tenant_id = auth.uid());

-- Unidades
DROP POLICY IF EXISTS produtos_unidades_select_by_tenant ON public.produtos_unidades;
CREATE POLICY produtos_unidades_select_by_tenant ON public.produtos_unidades
  FOR SELECT USING (tenant_id = auth.uid() OR has_role('admin'::app_role));

DROP POLICY IF EXISTS produtos_unidades_mod_by_tenant_admin ON public.produtos_unidades;
CREATE POLICY produtos_unidades_mod_by_tenant_admin ON public.produtos_unidades
  FOR ALL USING (tenant_id = auth.uid() OR has_role('admin'::app_role))
  WITH CHECK (tenant_id = auth.uid());

-- Marcas
DROP POLICY IF EXISTS produtos_marcas_select_by_tenant ON public.produtos_marcas;
CREATE POLICY produtos_marcas_select_by_tenant ON public.produtos_marcas
  FOR SELECT USING (tenant_id = auth.uid() OR has_role('admin'::app_role));

DROP POLICY IF EXISTS produtos_marcas_mod_by_tenant_admin ON public.produtos_marcas;
CREATE POLICY produtos_marcas_mod_by_tenant_admin ON public.produtos_marcas
  FOR ALL USING (tenant_id = auth.uid() OR has_role('admin'::app_role))
  WITH CHECK (tenant_id = auth.uid());

-- Categorias
DROP POLICY IF EXISTS produtos_categorias_select_by_tenant ON public.produtos_categorias;
CREATE POLICY produtos_categorias_select_by_tenant ON public.produtos_categorias
  FOR SELECT USING (tenant_id = auth.uid() OR has_role('admin'::app_role));

DROP POLICY IF EXISTS produtos_categorias_mod_by_tenant_admin ON public.produtos_categorias;
CREATE POLICY produtos_categorias_mod_by_tenant_admin ON public.produtos_categorias
  FOR ALL USING (tenant_id = auth.uid() OR has_role('admin'::app_role))
  WITH CHECK (tenant_id = auth.uid());

-- Imagens
DROP POLICY IF EXISTS produtos_imagens_select_by_tenant ON public.produtos_imagens;
CREATE POLICY produtos_imagens_select_by_tenant ON public.produtos_imagens
  FOR SELECT USING (tenant_id = auth.uid() OR has_role('admin'::app_role));

DROP POLICY IF EXISTS produtos_imagens_mod_by_tenant_admin ON public.produtos_imagens;
CREATE POLICY produtos_imagens_mod_by_tenant_admin ON public.produtos_imagens
  FOR ALL USING (tenant_id = auth.uid() OR has_role('admin'::app_role))
  WITH CHECK (tenant_id = auth.uid());

-- 3.9 Audit trigger
CREATE OR REPLACE FUNCTION public.trg_audit_produtos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM log_security_event('produto_deleted', 'Produto excluído: ' || OLD.nome, 
      jsonb_build_object('produto_id', OLD.id, 'nome', OLD.nome));
    RETURN OLD;
  ELSE
    PERFORM log_security_event('produto_' || lower(TG_OP), 'Produto ' || TG_OP || ': ' || NEW.nome,
      jsonb_build_object('produto_id', NEW.id, 'nome', NEW.nome, 'sku', NEW.sku));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_produtos ON public.produtos;
CREATE TRIGGER trg_audit_produtos
AFTER INSERT OR UPDATE OR DELETE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.trg_audit_produtos();