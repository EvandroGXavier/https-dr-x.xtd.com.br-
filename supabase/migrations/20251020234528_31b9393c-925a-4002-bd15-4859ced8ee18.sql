-- Criar função helper get_my_tenant_id() se não existir
CREATE OR REPLACE FUNCTION public.get_my_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_empresa_uuid 
  FROM public.profiles
  WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_my_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_tenant_id() TO authenticated;
COMMENT ON FUNCTION public.get_my_tenant_id() IS 'Retorna o UUID da empresa atual (tenant) do utilizador logado para RLS.';

-- Agora aplicar as políticas RLS
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos FORCE ROW LEVEL SECURITY;

-- Dropar políticas antigas se existirem
DROP POLICY IF EXISTS "Utilizadores podem ler processos do seu tenant" ON public.processos;
DROP POLICY IF EXISTS "Utilizadores podem criar processos no seu tenant" ON public.processos;
DROP POLICY IF EXISTS "Utilizadores podem atualizar processos do seu tenant" ON public.processos;
DROP POLICY IF EXISTS "Utilizadores podem excluir processos do seu tenant" ON public.processos;

-- Criar políticas V2
CREATE POLICY "Utilizadores podem ler processos do seu tenant" ON public.processos
FOR SELECT TO authenticated USING (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Utilizadores podem criar processos no seu tenant" ON public.processos
FOR INSERT TO authenticated WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Utilizadores podem atualizar processos do seu tenant" ON public.processos
FOR UPDATE TO authenticated 
USING (tenant_id = public.get_my_tenant_id()) 
WITH CHECK (tenant_id = public.get_my_tenant_id());

CREATE POLICY "Utilizadores podem excluir processos do seu tenant" ON public.processos
FOR DELETE TO authenticated USING (tenant_id = public.get_my_tenant_id());