-- Verificar e corrigir as políticas RLS da tabela contato_vinculos
-- Primeiro, vamos ver se há algum problema com a política atual

-- Vamos também adicionar debug para entender melhor o problema
DO $$
BEGIN
  -- Verificar se a tabela tem as colunas necessárias
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contato_vinculos' 
    AND column_name = 'user_id'
  ) THEN
    -- Adicionar coluna user_id se não existir
    ALTER TABLE public.contato_vinculos ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Preencher user_id baseado no contato_id
    UPDATE public.contato_vinculos 
    SET user_id = (
      SELECT c.user_id 
      FROM public.contatos c 
      WHERE c.id = contato_vinculos.contato_id
    )
    WHERE user_id IS NULL;
    
    -- Tornar a coluna NOT NULL
    ALTER TABLE public.contato_vinculos ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;

-- Criar trigger para automaticamente definir user_id
CREATE OR REPLACE FUNCTION public.set_contato_vinculo_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Definir user_id baseado no contato que está criando o vínculo
  NEW.user_id = (
    SELECT user_id 
    FROM public.contatos 
    WHERE id = NEW.contato_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_set_contato_vinculo_user_id ON public.contato_vinculos;
CREATE TRIGGER trigger_set_contato_vinculo_user_id
  BEFORE INSERT ON public.contato_vinculos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contato_vinculo_user_id();

-- Recriar as políticas RLS mais específicas
DROP POLICY IF EXISTS "Users can manage their own contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can view their own contato_vinculos" ON public.contato_vinculos;

-- Política para SELECT
CREATE POLICY "Users can view contato_vinculos" ON public.contato_vinculos
  FOR SELECT USING (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );

-- Política para INSERT
CREATE POLICY "Users can create contato_vinculos" ON public.contato_vinculos
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );

-- Política para UPDATE
CREATE POLICY "Users can update contato_vinculos" ON public.contato_vinculos
  FOR UPDATE USING (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );

-- Política para DELETE
CREATE POLICY "Users can delete contato_vinculos" ON public.contato_vinculos
  FOR DELETE USING (
    user_id = auth.uid() OR has_role('admin'::app_role)
  );