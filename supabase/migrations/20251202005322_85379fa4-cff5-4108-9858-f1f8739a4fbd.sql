-- Correção de Políticas RLS para tabela processos
-- Garantir permissões corretas baseadas em tenant_id

-- 1. Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "Processos - Leitura" ON public.processos;
DROP POLICY IF EXISTS "Processos - Inserção" ON public.processos;
DROP POLICY IF EXISTS "Processos - Atualização" ON public.processos;
DROP POLICY IF EXISTS "Processos - Deleção" ON public.processos;
DROP POLICY IF EXISTS "Processos: Ver por empresa" ON public.processos;
DROP POLICY IF EXISTS "Processos: Criar na empresa" ON public.processos;
DROP POLICY IF EXISTS "Processos: Atualizar na empresa" ON public.processos;
DROP POLICY IF EXISTS "Processos: Deletar na empresa" ON public.processos;

-- 2. Garantir que RLS está ativo
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- 3. Criar Políticas Unificadas baseadas em tenant_id

-- LEITURA: Ver apenas processos do seu escritório
CREATE POLICY "Processos - Leitura V2" 
ON public.processos FOR SELECT 
TO authenticated
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- INSERÇÃO: Criar processos vinculados ao tenant do usuário
CREATE POLICY "Processos - Inserção V2" 
ON public.processos FOR INSERT 
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- ATUALIZAÇÃO: Editar apenas processos do seu escritório
CREATE POLICY "Processos - Atualização V2" 
ON public.processos FOR UPDATE 
TO authenticated
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- DELEÇÃO: Deletar apenas processos do seu escritório
CREATE POLICY "Processos - Deleção V2" 
ON public.processos FOR DELETE 
TO authenticated
USING (
  tenant_id IN (
    SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid()
  )
);