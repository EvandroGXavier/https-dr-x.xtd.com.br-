-- Fix contato_vinculos referencing old public.contatos
-- 1) Update trigger function to use contatos_v2
CREATE OR REPLACE FUNCTION public.set_contato_vinculo_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Definir user_id baseado no contato que está criando o vínculo (contatos_v2)
  NEW.user_id := (
    SELECT c.user_id
    FROM public.contatos_v2 c
    WHERE c.id = NEW.contato_id
  );
  RETURN NEW;
END;
$$;

-- 2) Recreate trigger to ensure latest function is used
DROP TRIGGER IF EXISTS trigger_set_contato_vinculo_user_id ON public.contato_vinculos;
CREATE TRIGGER trigger_set_contato_vinculo_user_id
  BEFORE INSERT ON public.contato_vinculos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contato_vinculo_user_id();

-- 3) Backfill/align existing records' user_id from contatos_v2
UPDATE public.contato_vinculos cv
SET user_id = c.user_id
FROM public.contatos_v2 c
WHERE cv.contato_id = c.id
  AND (cv.user_id IS NULL OR cv.user_id <> c.user_id);

-- 4) Drop any possibly existing policies (various names from past migrations)
DROP POLICY IF EXISTS "Users can view contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can create contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can update contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can delete contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_select_policy" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_insert_policy" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_update_policy" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_delete_policy" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can view their own contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "Users can manage their own contato_vinculos" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_select" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_insert" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_update" ON public.contato_vinculos;
DROP POLICY IF EXISTS "contato_vinculos_delete" ON public.contato_vinculos;

-- 5) Recreate simple user_id-based policies (no IF NOT EXISTS)
CREATE POLICY contato_vinculos_select ON public.contato_vinculos
  FOR SELECT USING (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY contato_vinculos_insert ON public.contato_vinculos
  FOR INSERT WITH CHECK (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY contato_vinculos_update ON public.contato_vinculos
  FOR UPDATE USING (user_id = auth.uid() OR has_role('admin'::app_role));

CREATE POLICY contato_vinculos_delete ON public.contato_vinculos
  FOR DELETE USING (user_id = auth.uid() OR has_role('admin'::app_role));