-- Criar tabela processo_partes
CREATE TABLE IF NOT EXISTS public.processo_partes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  papel papel_parte NOT NULL DEFAULT 'cliente',
  observacao text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  
  -- Evitar duplicatas de mesmo contato com mesmo papel no mesmo processo
  UNIQUE(processo_id, contato_id, papel)
);

-- Habilitar RLS na tabela processo_partes
ALTER TABLE public.processo_partes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para processo_partes
CREATE POLICY "Users can view their own processo_partes" ON public.processo_partes
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own processo_partes" ON public.processo_partes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processo_partes" ON public.processo_partes
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_partes" ON public.processo_partes
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Criar tabela processo_anexos
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

-- Criar políticas RLS para processo_anexos
CREATE POLICY "Users can view their own processo_anexos" ON public.processo_anexos
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own processo_anexos" ON public.processo_anexos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processo_anexos" ON public.processo_anexos
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_anexos" ON public.processo_anexos
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));