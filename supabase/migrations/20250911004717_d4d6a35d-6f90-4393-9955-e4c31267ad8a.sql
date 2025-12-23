-- Corrigir estrutura da tabela agendas para usar tenant_id ao invés de user_id
-- e atualizar RLS para sistema multi-tenant

-- 1. Verificar se existem dados na tabela
DO $$
BEGIN
  -- Adicionar tenant_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agendas' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.agendas ADD COLUMN tenant_id uuid;
    
    -- Migrar dados existentes: tenant_id = user_id
    UPDATE public.agendas SET tenant_id = user_id WHERE tenant_id IS NULL;
    
    -- Tornar obrigatório
    ALTER TABLE public.agendas ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

-- 2. Atualizar status para usar CHECK constraint ao invés de enum
ALTER TABLE public.agendas DROP CONSTRAINT IF EXISTS agendas_status_check;
ALTER TABLE public.agendas ADD CONSTRAINT agendas_status_check 
  CHECK (status IN ('ANALISE', 'A_FAZER', 'FAZENDO', 'FEITO'));

-- 3. Remover RLS antigo
DROP POLICY IF EXISTS "Admins can delete agendas" ON public.agendas;
DROP POLICY IF EXISTS "Tenant users can view agendas" ON public.agendas;
DROP POLICY IF EXISTS "Write role users can create agendas" ON public.agendas;
DROP POLICY IF EXISTS "Write role users can update agendas" ON public.agendas;

-- 4. Criar RLS por tenant_id
CREATE POLICY "agendas_read_by_tenant" 
  ON public.agendas FOR SELECT 
  USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);

CREATE POLICY "agendas_write_by_tenant" 
  ON public.agendas FOR ALL 
  USING (tenant_id = (current_setting('app.tenant_id', true))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.tenant_id', true))::uuid);

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_agendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_agendas_updated_at ON public.agendas;
CREATE TRIGGER update_agendas_updated_at
  BEFORE UPDATE ON public.agendas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agendas_updated_at();

-- 6. Trigger para validar tenant_id
CREATE OR REPLACE FUNCTION public.validate_agendas_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que tenant_id seja sempre definido
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_agendas_tenant_id ON public.agendas;
CREATE TRIGGER validate_agendas_tenant_id
  BEFORE INSERT OR UPDATE ON public.agendas
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_agendas_tenant_id();