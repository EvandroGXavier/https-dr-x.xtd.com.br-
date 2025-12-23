-- Create processo_partes table
CREATE TABLE public.processo_partes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  processo_id UUID NOT NULL,
  contato_id UUID NOT NULL,
  qualificacao qualificacao_parte NOT NULL,
  principal BOOLEAN NOT NULL DEFAULT false,
  observacoes TEXT,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.processo_partes 
ADD CONSTRAINT fk_processo_partes_processo 
FOREIGN KEY (processo_id) REFERENCES public.processos(id) ON DELETE CASCADE;

ALTER TABLE public.processo_partes 
ADD CONSTRAINT fk_processo_partes_contato 
FOREIGN KEY (contato_id) REFERENCES public.contatos(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.processo_partes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own processo_partes" 
ON public.processo_partes 
FOR SELECT 
USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can create their own processo_partes" 
ON public.processo_partes 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own processo_partes" 
ON public.processo_partes 
FOR UPDATE 
USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_partes" 
ON public.processo_partes 
FOR DELETE 
USING (user_id = auth.uid() OR has_role('admin'));

-- Create update trigger
CREATE TRIGGER update_processo_partes_updated_at
BEFORE UPDATE ON public.processo_partes
FOR EACH ROW
EXECUTE FUNCTION public.update_anexos_updated_at();