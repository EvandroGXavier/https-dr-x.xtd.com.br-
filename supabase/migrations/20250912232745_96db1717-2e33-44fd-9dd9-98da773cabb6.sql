-- Remove políticas conflitantes antigas que podem estar causando lentidão
DROP POLICY IF EXISTS "contatos_v2_read_by_tenant" ON public.contatos_v2;
DROP POLICY IF EXISTS "contatos_v2_write_by_tenant" ON public.contatos_v2;

-- Simplificar ainda mais as políticas RLS
ALTER TABLE public.contatos_v2 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos_v2 ENABLE ROW LEVEL SECURITY;

-- Política única e simples
CREATE POLICY "contatos_v2_simple_access"
ON public.contatos_v2
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Verificar e criar índices necessários para performance
CREATE INDEX IF NOT EXISTS idx_contatos_v2_user_id_active ON public.contatos_v2(user_id) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_contatos_v2_updated_at ON public.contatos_v2(updated_at DESC);

-- Simplificar a trigger function para evitar lentidão
CREATE OR REPLACE FUNCTION public.set_contatos_v2_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas definir user_id se for NULL
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar trigger com função simplificada
DROP TRIGGER IF EXISTS contatos_v2_set_tenant_id ON public.contatos_v2;
CREATE TRIGGER contatos_v2_set_user_id
  BEFORE INSERT ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contatos_v2_user_id();