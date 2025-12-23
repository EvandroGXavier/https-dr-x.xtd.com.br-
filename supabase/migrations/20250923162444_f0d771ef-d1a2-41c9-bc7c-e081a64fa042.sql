-- Remove todas as tabelas do sistema antigo WhatsApp
DROP TABLE IF EXISTS public.whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_contacts_link CASCADE;
DROP TABLE IF EXISTS public.whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS public.whatsapp_events_audit CASCADE;
DROP TABLE IF EXISTS public.whatsapp_outbox CASCADE;

-- Manter apenas as tabelas do sistema novo e necessárias:
-- wa_threads, wa_contacts, wa_messages, wa_accounts, wa_tokens, wa_outbox
-- whatsapp_config (para configurações gerais)
-- whatsapp_quick_replies (para respostas rápidas)
-- whatsapp_accounts (contas dos usuários)

-- Limpar tabela de configuração mantendo apenas campos necessários
DELETE FROM public.whatsapp_config WHERE id IS NOT NULL;

-- Comentário: Sistema antigo WhatsApp removido completamente
-- Apenas o sistema novo (wa_*) será utilizado daqui para frente