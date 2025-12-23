-- Criar tabelas para o módulo WhatsApp com Baileys

-- 1) whatsapp_accounts
CREATE TABLE public.whatsapp_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  nome TEXT NOT NULL,
  numero_display TEXT,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'qr_pending', 'online', 'error')),
  last_connected_at TIMESTAMP WITH TIME ZONE,
  retention_days INTEGER DEFAULT 365,
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL -- Para RLS
);

-- 2) whatsapp_sessions (estado Baileys cifrado)
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL UNIQUE REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  state_encrypted BYTEA,
  version TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3) whatsapp_contacts_link
CREATE TABLE public.whatsapp_contacts_link (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  wa_id TEXT NOT NULL,
  wa_number_e164 TEXT,
  contato_id UUID REFERENCES public.contatos(id),
  display_name TEXT,
  labels TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL -- Para RLS
);

-- 4) whatsapp_messages
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES public.whatsapp_contacts_link(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'document', 'audio', 'video', 'sticker', 'location', 'unknown')),
  body TEXT,
  media_url TEXT,
  media_mime TEXT,
  quoted_id UUID REFERENCES public.whatsapp_messages(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'read', 'failed')),
  error TEXT,
  wa_msg_id TEXT,
  ts_device TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL -- Para RLS
);

-- 5) whatsapp_outbox (fila de envio)
CREATE TABLE public.whatsapp_outbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  link_id UUID NOT NULL REFERENCES public.whatsapp_contacts_link(id) ON DELETE CASCADE,
  payload_json JSONB NOT NULL,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  last_error TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL -- Para RLS
);

-- 6) whatsapp_events_audit
CREATE TABLE public.whatsapp_events_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL -- Para RLS
);

-- Criar índices para performance
CREATE INDEX idx_whatsapp_accounts_empresa_filial ON public.whatsapp_accounts(empresa_id, filial_id, status);
CREATE INDEX idx_whatsapp_accounts_created_at ON public.whatsapp_accounts(created_at DESC);
CREATE INDEX idx_whatsapp_contacts_link_unique ON public.whatsapp_contacts_link(empresa_id, filial_id, account_id, wa_id);
CREATE INDEX idx_whatsapp_messages_account_link ON public.whatsapp_messages(empresa_id, filial_id, account_id, link_id, created_at);
CREATE INDEX idx_whatsapp_messages_wa_msg_id ON public.whatsapp_messages(wa_msg_id);
CREATE INDEX idx_whatsapp_outbox_next_attempt ON public.whatsapp_outbox(next_attempt_at, status);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_contacts_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_events_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para whatsapp_accounts
CREATE POLICY "Users can view their whatsapp_accounts" ON public.whatsapp_accounts
  FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Admins can create whatsapp_accounts" ON public.whatsapp_accounts
  FOR INSERT WITH CHECK (has_role('admin') AND auth.uid() = user_id);

CREATE POLICY "Admins can update whatsapp_accounts" ON public.whatsapp_accounts
  FOR UPDATE USING (has_role('admin') AND (user_id = auth.uid() OR has_role('admin')));

CREATE POLICY "Admins can delete whatsapp_accounts" ON public.whatsapp_accounts
  FOR DELETE USING (has_role('admin'));

-- Políticas RLS para whatsapp_sessions (mais restritivas - não expor state_encrypted)
CREATE POLICY "Only system can access whatsapp_sessions" ON public.whatsapp_sessions
  FOR ALL USING (false); -- Apenas functions internas podem acessar

-- Políticas RLS para whatsapp_contacts_link
CREATE POLICY "Users can view their whatsapp_contacts_link" ON public.whatsapp_contacts_link
  FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can create whatsapp_contacts_link" ON public.whatsapp_contacts_link
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update whatsapp_contacts_link" ON public.whatsapp_contacts_link
  FOR UPDATE USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can delete whatsapp_contacts_link" ON public.whatsapp_contacts_link
  FOR DELETE USING (user_id = auth.uid() OR has_role('admin'));

-- Políticas RLS para whatsapp_messages
CREATE POLICY "Users can view their whatsapp_messages" ON public.whatsapp_messages
  FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can create whatsapp_messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update whatsapp_messages" ON public.whatsapp_messages
  FOR UPDATE USING (user_id = auth.uid() OR has_role('admin'));

-- Políticas RLS para whatsapp_outbox
CREATE POLICY "Users can view their whatsapp_outbox" ON public.whatsapp_outbox
  FOR SELECT USING (user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "Users can create whatsapp_outbox" ON public.whatsapp_outbox
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update whatsapp_outbox" ON public.whatsapp_outbox
  FOR UPDATE USING (user_id = auth.uid() OR has_role('admin'));

-- Políticas RLS para whatsapp_events_audit
CREATE POLICY "Admins can view whatsapp_events_audit" ON public.whatsapp_events_audit
  FOR SELECT USING (has_role('admin'));

CREATE POLICY "System can create whatsapp_events_audit" ON public.whatsapp_events_audit
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_whatsapp_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_accounts_updated_at
  BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

CREATE TRIGGER update_whatsapp_sessions_updated_at
  BEFORE UPDATE ON public.whatsapp_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_link_updated_at
  BEFORE UPDATE ON public.whatsapp_contacts_link
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

CREATE TRIGGER update_whatsapp_outbox_updated_at
  BEFORE UPDATE ON public.whatsapp_outbox
  FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_updated_at_column();

-- Criar bucket para mídia do WhatsApp (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('wa-media', 'wa-media', false);

-- Políticas para o bucket wa-media
CREATE POLICY "Users can upload to wa-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'wa-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their wa-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'wa-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their wa-media" ON storage.objects
  FOR DELETE USING (bucket_id = 'wa-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function para criptografar session state
CREATE OR REPLACE FUNCTION public.encrypt_whatsapp_session_state(state_data text, account_id_param uuid)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text;
BEGIN
  -- Use account-specific encryption key
  encryption_key := 'wa_session_' || account_id_param::text || '_secure_2025';
  
  IF state_data IS NULL OR state_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN encrypt(state_data::bytea, encryption_key::bytea, 'aes');
END;
$function$;

-- Function para descriptografar session state
CREATE OR REPLACE FUNCTION public.decrypt_whatsapp_session_state(encrypted_state bytea, account_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  encryption_key text;
BEGIN
  -- Use account-specific encryption key
  encryption_key := 'wa_session_' || account_id_param::text || '_secure_2025';
  
  IF encrypted_state IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN convert_from(
    decrypt(encrypted_state, encryption_key::bytea, 'aes'),
    'UTF8'
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL if decryption fails
    RETURN NULL;
END;
$function$;