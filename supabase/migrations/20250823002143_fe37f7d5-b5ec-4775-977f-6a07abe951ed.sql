-- Criar enum para status das agendas
CREATE TYPE public.agenda_status AS ENUM ('analise', 'a_fazer', 'fazendo', 'feito');

-- Criar tabela de agendas
CREATE TABLE public.agendas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim TIMESTAMP WITH TIME ZONE,
  status agenda_status NOT NULL DEFAULT 'analise',
  prioridade TEXT DEFAULT 'media',
  contato_responsavel_id UUID NOT NULL,
  contato_solicitante_id UUID NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agendas ENABLE ROW LEVEL SECURITY;

-- Create policies for agenda access
CREATE POLICY "Users can view their own agendas" 
ON public.agendas 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own agendas" 
ON public.agendas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agendas" 
ON public.agendas 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own agendas" 
ON public.agendas 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_agendas_updated_at
BEFORE UPDATE ON public.agendas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get agendas with contact details
CREATE OR REPLACE FUNCTION public.get_agendas_with_contacts(
  limit_count INTEGER DEFAULT 100,
  offset_count INTEGER DEFAULT 0,
  status_filter agenda_status DEFAULT NULL,
  responsavel_filter UUID DEFAULT NULL,
  solicitante_filter UUID DEFAULT NULL
) 
RETURNS TABLE (
  id UUID,
  user_id UUID,
  titulo TEXT,
  descricao TEXT,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  status agenda_status,
  prioridade TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  responsavel_nome TEXT,
  responsavel_email TEXT,
  solicitante_nome TEXT,
  solicitante_email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.user_id,
    a.titulo,
    a.descricao,
    a.data_inicio,
    a.data_fim,
    a.status,
    a.prioridade,
    a.observacoes,
    a.created_at,
    a.updated_at,
    cr.nome as responsavel_nome,
    cr.email as responsavel_email,
    cs.nome as solicitante_nome,
    cs.email as solicitante_email
  FROM public.agendas a
  LEFT JOIN public.contatos cr ON a.contato_responsavel_id = cr.id
  LEFT JOIN public.contatos cs ON a.contato_solicitante_id = cs.id
  WHERE (a.user_id = auth.uid() OR has_role('admin'))
    AND (status_filter IS NULL OR a.status = status_filter)
    AND (responsavel_filter IS NULL OR a.contato_responsavel_id = responsavel_filter)
    AND (solicitante_filter IS NULL OR a.contato_solicitante_id = solicitante_filter)
  ORDER BY a.data_inicio DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;