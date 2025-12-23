-- Remover políticas antigas e criar novas corretas
DROP POLICY IF EXISTS "Users can view contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can create contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can update contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can delete contato_vinculos" ON public.contato_vinculos;

-- Verificar se a coluna user_id existe, se não, criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'contato_vinculos' 
    AND column_name = 'user_id'
  ) THEN
    -- Adicionar coluna user_id
    ALTER TABLE public.contato_vinculos ADD COLUMN user_id UUID;
    
    -- Preencher user_id baseado no contato_id
    UPDATE public.contato_vinculos 
    SET user_id = (
      SELECT c.user_id 
      FROM public.contatos c 
      WHERE c.id = contato_vinculos.contato_id
    )
    WHERE user_id IS NULL;
    
    -- Adicionar constraint NOT NULL
    ALTER TABLE public.contato_vinculos ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;

-- Criar políticas RLS simples e claras
CREATE POLICY "contato_vinculos_select_policy" ON public.contato_vinculos
  FOR SELECT USING (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );

CREATE POLICY "contato_vinculos_insert_policy" ON public.contato_vinculos
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );

CREATE POLICY "contato_vinculos_update_policy" ON public.contato_vinculos
  FOR UPDATE USING (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );

CREATE POLICY "contato_vinculos_delete_policy" ON public.contato_vinculos
  FOR DELETE USING (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );