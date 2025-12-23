-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "contatos_v2_simple_access" ON public.contatos_v2;
DROP POLICY IF EXISTS "contatos_v2_tenant_access" ON public.contatos_v2;

-- Política otimizada única
CREATE POLICY "contatos_v2_user_access_optimized"
ON public.contatos_v2
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Garantir que os índices existem para performance
CREATE INDEX IF NOT EXISTS idx_contatos_v2_user_id_fast ON public.contatos_v2(user_id) WHERE ativo = true;

-- Log da otimização
COMMENT ON POLICY "contatos_v2_user_access_optimized" ON public.contatos_v2 IS 'Optimized RLS policy for contatos_v2 to fix timeout issues';