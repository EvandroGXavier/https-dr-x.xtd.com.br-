-- MÓDULO DE ATENDIMENTO WHATSAPP
-- Criação das tabelas necessárias para o módulo de WhatsApp

-- TABELA 1: Configurações da API por Tenant
CREATE TABLE public.whatsapp_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT auth.uid(),
    api_endpoint TEXT NOT NULL,
    api_key TEXT NOT NULL, -- Será criptografado
    instance_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    ia_enabled BOOLEAN DEFAULT false,
    ia_api_key TEXT, -- Será criptografado
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL DEFAULT auth.uid()
);

-- Políticas RLS para whatsapp_config
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin access whatsapp_config by tenant" ON public.whatsapp_config
    FOR ALL 
    USING (user_id = auth.uid() AND has_role('admin'))
    WITH CHECK (user_id = auth.uid() AND has_role('admin'));

-- TABELA 2: Conversas de Atendimento
CREATE TABLE public.whatsapp_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT auth.uid(),
    contato_id uuid NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aguardando', -- aguardando, em_atendimento, resolvido
    assigned_to_user_id uuid,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL DEFAULT auth.uid()
);

-- Políticas RLS para whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access conversations by tenant" ON public.whatsapp_conversations
    FOR ALL 
    USING (user_id = auth.uid() OR has_role('admin'))
    WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- TABELA 3: Mensagens do Histórico
CREATE TABLE public.whatsapp_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    tenant_id uuid NOT NULL DEFAULT auth.uid(),
    message_direction TEXT NOT NULL, -- 'incoming' ou 'outgoing'
    message_type TEXT NOT NULL DEFAULT 'text', -- text, image, audio, video, document, etc.
    message_body TEXT,
    media_url TEXT,
    media_mime_type TEXT,
    transcription TEXT, -- Para áudios transcritos
    status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, read, failed
    sent_by_user_id uuid,
    evolution_message_id TEXT, -- ID da mensagem na API Evolution
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL DEFAULT auth.uid()
);

-- Políticas RLS para whatsapp_messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access messages by tenant" ON public.whatsapp_messages
    FOR ALL 
    USING (user_id = auth.uid() OR has_role('admin'))
    WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- TABELA 4: Respostas Rápidas
CREATE TABLE public.whatsapp_quick_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT auth.uid(),
    shortcut TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL DEFAULT auth.uid()
);

ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access quick replies by tenant" ON public.whatsapp_quick_replies
    FOR ALL 
    USING (user_id = auth.uid() OR has_role('admin'))
    WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Índices para performance
CREATE INDEX idx_whatsapp_conversations_tenant_status ON public.whatsapp_conversations(tenant_id, status);
CREATE INDEX idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id, created_at);
CREATE INDEX idx_whatsapp_messages_tenant ON public.whatsapp_messages(tenant_id, created_at);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_whatsapp_config_updated_at
    BEFORE UPDATE ON public.whatsapp_config
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_conversations_updated_at
    BEFORE UPDATE ON public.whatsapp_conversations
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER update_whatsapp_messages_updated_at
    BEFORE UPDATE ON public.whatsapp_messages
    FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();