-- Remove duplicate configurations keeping only the latest one
DELETE FROM public.wa_configuracoes 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.wa_configuracoes
  ORDER BY user_id, updated_at DESC NULLS LAST
);

-- Now create the unique index
CREATE UNIQUE INDEX IF NOT EXISTS wa_configuracoes_user_id_key ON public.wa_configuracoes(user_id);

-- Ensure RLS is enabled
ALTER TABLE public.wa_configuracoes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid duplicates (idempotent safe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wa_configuracoes' AND policyname='Users can view their own wa_configuracoes') THEN
    EXECUTE 'DROP POLICY "Users can view their own wa_configuracoes" ON public.wa_configuracoes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wa_configuracoes' AND policyname='Users can insert their own wa_configuracoes') THEN
    EXECUTE 'DROP POLICY "Users can insert their own wa_configuracoes" ON public.wa_configuracoes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wa_configuracoes' AND policyname='Users can update their own wa_configuracoes') THEN
    EXECUTE 'DROP POLICY "Users can update their own wa_configuracoes" ON public.wa_configuracoes';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='wa_configuracoes' AND policyname='Users can delete their own wa_configuracoes') THEN
    EXECUTE 'DROP POLICY "Users can delete their own wa_configuracoes" ON public.wa_configuracoes';
  END IF;
END$$;

CREATE POLICY "Users can view their own wa_configuracoes"
ON public.wa_configuracoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wa_configuracoes"
ON public.wa_configuracoes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wa_configuracoes"
ON public.wa_configuracoes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wa_configuracoes"
ON public.wa_configuracoes
FOR DELETE
USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_wa_configuracoes_updated_at ON public.wa_configuracoes;
CREATE TRIGGER set_wa_configuracoes_updated_at
BEFORE UPDATE ON public.wa_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();