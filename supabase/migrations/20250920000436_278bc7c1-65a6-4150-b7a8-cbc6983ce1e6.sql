-- MÓDULO DE ATENDIMENTO WHATSAPP - Atualização do schema existente
-- Adicionando tabelas necessárias que não existem

-- TABELA 1: Configurações da API por Tenant (nova)
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
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

-- TABELA 2: Conversas de Atendimento (nova)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT auth.uid(),
    contato_id uuid,
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    status TEXT NOT NULL DEFAULT 'aguardando', -- aguardando, em_atendimento, resolvido
    assigned_to_user_id uuid,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL DEFAULT auth.uid()
);

-- TABELA 3: Respostas Rápidas (nova)
CREATE TABLE IF NOT EXISTS public.whatsapp_quick_replies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL DEFAULT auth.uid(),
    shortcut TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id uuid NOT NULL DEFAULT auth.uid()
);

-- Verificar se precisa adicionar colunas na tabela whatsapp_messages existente
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'conversation_id') THEN
        ALTER TABLE public.whatsapp_messages ADD COLUMN conversation_id uuid;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'message_direction') THEN
        ALTER TABLE public.whatsapp_messages ADD COLUMN message_direction TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'message_type') THEN
        ALTER TABLE public.whatsapp_messages ADD COLUMN message_type TEXT DEFAULT 'text';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'transcription') THEN
        ALTER TABLE public.whatsapp_messages ADD COLUMN transcription TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.whatsapp_messages ADD COLUMN tenant_id uuid;
        UPDATE public.whatsapp_messages SET tenant_id = user_id WHERE tenant_id IS NULL;
        ALTER TABLE public.whatsapp_messages ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
END $$;

-- Políticas RLS para as novas tabelas
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_config
DROP POLICY IF EXISTS "Admin access whatsapp_config by tenant" ON public.whatsapp_config;
CREATE POLICY "Admin access whatsapp_config by tenant" ON public.whatsapp_config
    FOR ALL 
    USING (user_id = auth.uid() AND has_role('admin'))
    WITH CHECK (user_id = auth.uid() AND has_role('admin'));

-- Políticas para whatsapp_conversations
DROP POLICY IF EXISTS "Users access conversations by tenant" ON public.whatsapp_conversations;
CREATE POLICY "Users access conversations by tenant" ON public.whatsapp_conversations
    FOR ALL 
    USING (user_id = auth.uid() OR has_role('admin'))
    WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Políticas para whatsapp_quick_replies
DROP POLICY IF EXISTS "Users access quick replies by tenant" ON public.whatsapp_quick_replies;
CREATE POLICY "Users access quick replies by tenant" ON public.whatsapp_quick_replies
    FOR ALL 
    USING (user_id = auth.uid() OR has_role('admin'))
    WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_tenant_status ON public.whatsapp_conversations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id, created_at);

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