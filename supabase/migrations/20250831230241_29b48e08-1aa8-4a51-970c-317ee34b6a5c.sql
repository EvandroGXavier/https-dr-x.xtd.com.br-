-- Criar tabela para instâncias WhatsApp (Evolution API)
CREATE TABLE public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  instance_name text NOT NULL,
  status text NOT NULL DEFAULT 'DISCONNECTED',
  phone text,
  qr_code text,
  qr_expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, instance_name)
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR DELETE 
USING (user_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_whatsapp_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_accounts_updated_at
BEFORE UPDATE ON public.whatsapp_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_whatsapp_accounts_updated_at();