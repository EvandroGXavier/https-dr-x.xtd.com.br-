-- Criar tabela processo_honorarios
CREATE TABLE IF NOT EXISTS public.processo_honorarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL UNIQUE REFERENCES public.processos(id) ON DELETE CASCADE,
  causa_valor numeric(15,2),
  recebido_valor numeric(15,2),
  inicial_valor numeric(15,2),
  inicial_forma_pagamento text,
  inicial_obs text,
  mensal_valor numeric(15,2),
  mensal_forma_pagamento text,
  mensal_obs text,
  exito_percentual numeric(5,2),
  exito_forma_pagamento text,
  exito_obs text,
  sucumbencia_valor numeric(15,2),
  sucumbencia_forma_pagamento text,
  sucumbencia_obs text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela processo_honorarios
ALTER TABLE public.processo_honorarios ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para processo_honorarios (apenas se não existirem)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_honorarios' 
        AND policyname = 'Users can view their own processo_honorarios'
    ) THEN
        CREATE POLICY "Users can view their own processo_honorarios" ON public.processo_honorarios
          FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_honorarios' 
        AND policyname = 'Users can create their own processo_honorarios'
    ) THEN
        CREATE POLICY "Users can create their own processo_honorarios" ON public.processo_honorarios
          FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_honorarios' 
        AND policyname = 'Users can update their own processo_honorarios'
    ) THEN
        CREATE POLICY "Users can update their own processo_honorarios" ON public.processo_honorarios
          FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'processo_honorarios' 
        AND policyname = 'Users can delete their own processo_honorarios'
    ) THEN
        CREATE POLICY "Users can delete their own processo_honorarios" ON public.processo_honorarios
          FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));
    END IF;
END $$;