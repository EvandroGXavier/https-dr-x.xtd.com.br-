-- ============================================================================
-- MIGRAÇÃO: Padronização de tenant_id, empresa_id e filial_id nas tabelas de contatos
-- ============================================================================

-- 1. Adicionar tenant_id em contato_vinculos (nullable primeiro, preencher depois)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contato_vinculos' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.contato_vinculos ADD COLUMN tenant_id uuid;
    
    -- Preencher com user_id existente
    UPDATE public.contato_vinculos SET tenant_id = user_id WHERE tenant_id IS NULL;
    
    -- Tornar NOT NULL após preencher
    ALTER TABLE public.contato_vinculos ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- 2. Adicionar tenant_id em contato_enderecos
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contato_enderecos' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.contato_enderecos ADD COLUMN tenant_id uuid;
    
    -- Preencher com tenant_id do contato pai
    UPDATE public.contato_enderecos ce
    SET tenant_id = c.tenant_id
    FROM contatos_v2 c
    WHERE ce.contato_id = c.id AND ce.tenant_id IS NULL;
    
    -- Tornar NOT NULL após preencher
    ALTER TABLE public.contato_enderecos ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- 3. Adicionar tenant_id em contato_pf
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contato_pf' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.contato_pf ADD COLUMN tenant_id uuid;
    
    -- Preencher com tenant_id do contato pai
    UPDATE public.contato_pf cp
    SET tenant_id = c.tenant_id
    FROM contatos_v2 c
    WHERE cp.contato_id = c.id AND cp.tenant_id IS NULL;
    
    -- Tornar NOT NULL após preencher
    ALTER TABLE public.contato_pf ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- 4. Adicionar tenant_id em contato_financeiro_config
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'contato_financeiro_config' AND column_name = 'tenant_id') THEN
    ALTER TABLE public.contato_financeiro_config ADD COLUMN tenant_id uuid;
    
    -- Preencher com tenant_id do contato pai
    UPDATE public.contato_financeiro_config cfc
    SET tenant_id = c.tenant_id
    FROM contatos_v2 c
    WHERE cfc.contato_id = c.id AND cfc.tenant_id IS NULL;
    
    -- Tornar NOT NULL após preencher
    ALTER TABLE public.contato_financeiro_config ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- 5. Corrigir tipos de empresa_id e filial_id em contato_pf (de integer para uuid)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contato_pf' 
      AND column_name = 'empresa_id' 
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.contato_pf ADD COLUMN empresa_id_uuid uuid;
    UPDATE public.contato_pf SET empresa_id_uuid = NULL;
    ALTER TABLE public.contato_pf DROP COLUMN empresa_id;
    ALTER TABLE public.contato_pf RENAME COLUMN empresa_id_uuid TO empresa_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contato_pf' 
      AND column_name = 'filial_id' 
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE public.contato_pf ADD COLUMN filial_id_uuid uuid;
    UPDATE public.contato_pf SET filial_id_uuid = NULL;
    ALTER TABLE public.contato_pf DROP COLUMN filial_id;
    ALTER TABLE public.contato_pf RENAME COLUMN filial_id_uuid TO filial_id;
  END IF;
END $$;

-- 6. Atualizar RLS policies para usar tenant_id

-- contato_vinculos
DROP POLICY IF EXISTS "Users can delete contato_vinculos for their own contacts" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can insert contato_vinculos for their own contacts" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can update contato_vinculos for their own contacts" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can view their own contato_vinculos" ON public.contato_vinculos;

CREATE POLICY "tenant_access_vinculos"
  ON public.contato_vinculos
  FOR ALL
  USING (tenant_id = auth.uid() OR has_role('admin'))
  WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

-- contato_enderecos
DROP POLICY IF EXISTS "Users can delete contato_enderecos for their own contacts" ON public.contato_enderecos;
DROP POLICY IF EXISTS "Users can insert contato_enderecos for their own contacts" ON public.contato_enderecos;
DROP POLICY IF EXISTS "Users can update contato_enderecos for their own contacts" ON public.contato_enderecos;
DROP POLICY IF EXISTS "Users can view contato_enderecos for their own contacts" ON public.contato_enderecos;

CREATE POLICY "tenant_access_enderecos"
  ON public.contato_enderecos
  FOR ALL
  USING (tenant_id = auth.uid() OR has_role('admin'))
  WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

-- contato_pf
DROP POLICY IF EXISTS "Users can insert contato_pf for their own contacts" ON public.contato_pf;
DROP POLICY IF EXISTS "Users can update contato_pf for their own contacts" ON public.contato_pf;
DROP POLICY IF EXISTS "Users can view their own contato_pf" ON public.contato_pf;
DROP POLICY IF EXISTS "pf_tenant_access" ON public.contato_pf;

CREATE POLICY "tenant_access_pf"
  ON public.contato_pf
  FOR ALL
  USING (tenant_id = auth.uid() OR has_role('admin'))
  WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

-- contato_financeiro_config
DROP POLICY IF EXISTS "Users can create financial config for their own contacts" ON public.contato_financeiro_config;
DROP POLICY IF EXISTS "Users can delete financial config for their own contacts" ON public.contato_financeiro_config;
DROP POLICY IF EXISTS "Users can update financial config for their own contacts" ON public.contato_financeiro_config;
DROP POLICY IF EXISTS "Users can view financial config for their own contacts" ON public.contato_financeiro_config;

CREATE POLICY "tenant_access_financeiro_config"
  ON public.contato_financeiro_config
  FOR ALL
  USING (tenant_id = auth.uid() OR has_role('admin'))
  WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

-- 7. Criar trigger para auto-preencher tenant_id
CREATE OR REPLACE FUNCTION public.set_tenant_id_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Aplicar triggers
DROP TRIGGER IF EXISTS set_tenant_id_vinculos ON public.contato_vinculos;
CREATE TRIGGER set_tenant_id_vinculos
  BEFORE INSERT ON public.contato_vinculos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_user();

DROP TRIGGER IF EXISTS set_tenant_id_enderecos ON public.contato_enderecos;
CREATE TRIGGER set_tenant_id_enderecos
  BEFORE INSERT ON public.contato_enderecos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_user();

DROP TRIGGER IF EXISTS set_tenant_id_pf ON public.contato_pf;
CREATE TRIGGER set_tenant_id_pf
  BEFORE INSERT ON public.contato_pf
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_user();

DROP TRIGGER IF EXISTS set_tenant_id_financeiro ON public.contato_financeiro_config;
CREATE TRIGGER set_tenant_id_financeiro
  BEFORE INSERT ON public.contato_financeiro_config
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tenant_id_from_user();

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_contato_vinculos_tenant ON public.contato_vinculos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contato_enderecos_tenant ON public.contato_enderecos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contato_pf_tenant ON public.contato_pf(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contato_financeiro_config_tenant ON public.contato_financeiro_config(tenant_id);