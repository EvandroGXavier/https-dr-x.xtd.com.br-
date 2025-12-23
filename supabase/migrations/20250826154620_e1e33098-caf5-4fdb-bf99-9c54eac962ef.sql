-- WhatsApp Cloud API Integration Tables

-- WhatsApp accounts (one per filial)
CREATE TABLE public.wa_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID,
  filial_id UUID,
  phone_number_id TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  verified_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  webhook_verified_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(phone_number_id)
);

-- WhatsApp tokens and credentials
CREATE TABLE public.wa_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.wa_accounts(id) ON DELETE CASCADE,
  app_id TEXT NOT NULL,
  app_secret TEXT NOT NULL, -- encrypted
  access_token TEXT NOT NULL, -- encrypted
  verify_token TEXT NOT NULL,
  webhook_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook configuration and security
CREATE TABLE public.wa_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_id UUID NOT NULL REFERENCES public.wa_accounts(id) ON DELETE CASCADE,
  callback_url TEXT NOT NULL,
  verify_token TEXT NOT NULL,
  webhook_fields TEXT[] DEFAULT ARRAY['messages', 'message_deliveries', 'message_reads', 'message_reactions'],
  signature_validation BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp contacts mapping
CREATE TABLE public.wa_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID,
  filial_id UUID,
  account_id UUID NOT NULL REFERENCES public.wa_accounts(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  wa_phone_e164 TEXT NOT NULL,
  wa_phone_formatted TEXT,
  profile_name TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  opt_in_status TEXT DEFAULT 'unknown',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(account_id, wa_phone_e164)
);

-- Conversation threads
CREATE TABLE public.wa_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID,
  filial_id UUID,
  account_id UUID NOT NULL REFERENCES public.wa_accounts(id) ON DELETE CASCADE,
  wa_contact_id UUID NOT NULL REFERENCES public.wa_contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'OPEN',
  assigned_to UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_customer_message_at TIMESTAMP WITH TIME ZONE,
  window_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages
CREATE TABLE public.wa_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  empresa_id UUID,
  filial_id UUID,
  thread_id UUID NOT NULL REFERENCES public.wa_threads(id) ON DELETE CASCADE,
  wa_message_id TEXT,
  direction TEXT NOT NULL, -- INBOUND, OUTBOUND
  message_type TEXT NOT NULL, -- TEXT, IMAGE, DOCUMENT, TEMPLATE, AUDIO, VIDEO
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, SENT, DELIVERED, READ, FAILED
  content JSONB NOT NULL,
  template_name TEXT,
  template_language TEXT,
  error_code TEXT,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook events log
CREATE TABLE public.wa_events_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.wa_accounts(id) ON DELETE SET NULL,
  webhook_signature TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Message outbox for reliable delivery
CREATE TABLE public.wa_outbox (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_id UUID NOT NULL REFERENCES public.wa_messages(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.wa_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED', -- QUEUED, PROCESSING, SENT, FAILED
  payload JSONB NOT NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 5,
  not_before TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_wa_contacts_phone ON public.wa_contacts(wa_phone_e164);
CREATE INDEX idx_wa_contacts_account ON public.wa_contacts(account_id);
CREATE INDEX idx_wa_messages_wa_id ON public.wa_messages(wa_message_id);
CREATE INDEX idx_wa_messages_thread ON public.wa_messages(thread_id, timestamp DESC);
CREATE INDEX idx_wa_threads_last_message ON public.wa_threads(last_message_at DESC);
CREATE INDEX idx_wa_outbox_status ON public.wa_outbox(status, not_before) WHERE status IN ('QUEUED', 'FAILED');
CREATE INDEX idx_wa_events_log_created ON public.wa_events_log(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.wa_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_events_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_outbox ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wa_accounts
CREATE POLICY "Users can create their own wa_accounts" 
ON public.wa_accounts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_accounts" 
ON public.wa_accounts FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own wa_accounts" 
ON public.wa_accounts FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own wa_accounts" 
ON public.wa_accounts FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for wa_tokens
CREATE POLICY "Users can create their own wa_tokens" 
ON public.wa_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_tokens" 
ON public.wa_tokens FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own wa_tokens" 
ON public.wa_tokens FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own wa_tokens" 
ON public.wa_tokens FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for wa_webhooks
CREATE POLICY "Users can create their own wa_webhooks" 
ON public.wa_webhooks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_webhooks" 
ON public.wa_webhooks FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own wa_webhooks" 
ON public.wa_webhooks FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own wa_webhooks" 
ON public.wa_webhooks FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for wa_contacts
CREATE POLICY "Users can create their own wa_contacts" 
ON public.wa_contacts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_contacts" 
ON public.wa_contacts FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own wa_contacts" 
ON public.wa_contacts FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own wa_contacts" 
ON public.wa_contacts FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for wa_threads
CREATE POLICY "Users can create their own wa_threads" 
ON public.wa_threads FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_threads" 
ON public.wa_threads FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own wa_threads" 
ON public.wa_threads FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own wa_threads" 
ON public.wa_threads FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for wa_messages
CREATE POLICY "Users can create their own wa_messages" 
ON public.wa_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_messages" 
ON public.wa_messages FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can update their own wa_messages" 
ON public.wa_messages FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own wa_messages" 
ON public.wa_messages FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));

-- RLS Policies for wa_events_log (admin only)
CREATE POLICY "Only admins can view wa_events_log" 
ON public.wa_events_log FOR SELECT 
USING (has_role('admin'));

CREATE POLICY "System can insert wa_events_log" 
ON public.wa_events_log FOR INSERT 
WITH CHECK (true);

-- RLS Policies for wa_outbox
CREATE POLICY "Users can create their own wa_outbox" 
ON public.wa_outbox FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own wa_outbox" 
ON public.wa_outbox FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "System can update wa_outbox" 
ON public.wa_outbox FOR UPDATE 
USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_wa_accounts_updated_at
  BEFORE UPDATE ON public.wa_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wa_tokens_updated_at
  BEFORE UPDATE ON public.wa_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wa_webhooks_updated_at
  BEFORE UPDATE ON public.wa_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wa_contacts_updated_at
  BEFORE UPDATE ON public.wa_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wa_threads_updated_at
  BEFORE UPDATE ON public.wa_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();