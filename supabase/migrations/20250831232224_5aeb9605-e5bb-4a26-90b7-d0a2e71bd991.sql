-- Criar a tabela whatsapp_accounts se não existir
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_by UUID NOT NULL,
  nome TEXT NOT NULL,
  instance_name TEXT UNIQUE,
  phone TEXT,
  numero_display TEXT,
  status TEXT NOT NULL DEFAULT 'DISCONNECTED',
  empresa_id UUID,
  filial_id UUID,
  retention_days INTEGER DEFAULT 30,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can create their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users can update their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = created_by);

CREATE POLICY "Users can delete their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = created_by);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();