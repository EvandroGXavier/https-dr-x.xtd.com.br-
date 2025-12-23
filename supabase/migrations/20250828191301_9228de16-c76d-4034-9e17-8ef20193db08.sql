-- Criar apenas a tabela processo_anexos primeiro
CREATE TABLE IF NOT EXISTS public.processo_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  contato_id uuid REFERENCES public.contatos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  arquivo_url text NOT NULL,
  origem origem_anexo NOT NULL DEFAULT 'processo',
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela processo_anexos
ALTER TABLE public.processo_anexos ENABLE ROW LEVEL SECURITY;

-- Verificar e criar políticas RLS para processo_anexos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_anexos' 
        AND policyname = 'Users can view their own processo_anexos'
    ) THEN
        CREATE POLICY "Users can view their own processo_anexos" ON public.processo_anexos
          FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_anexos' 
        AND policyname = 'Users can create their own processo_anexos'
    ) THEN
        CREATE POLICY "Users can create their own processo_anexos" ON public.processo_anexos
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_anexos' 
        AND policyname = 'Users can update their own processo_anexos'
    ) THEN
        CREATE POLICY "Users can update their own processo_anexos" ON public.processo_anexos
          FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_anexos' 
        AND policyname = 'Users can delete their own processo_anexos'
    ) THEN
        CREATE POLICY "Users can delete their own processo_anexos" ON public.processo_anexos
          FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));
    END IF;
END $$;