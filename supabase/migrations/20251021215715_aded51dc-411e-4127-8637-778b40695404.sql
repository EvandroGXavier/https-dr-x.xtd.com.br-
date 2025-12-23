-- Adicionar novos campos SIP na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sip_caller_id TEXT,
ADD COLUMN IF NOT EXISTS sip_registrar TEXT,
ADD COLUMN IF NOT EXISTS sip_ws_url TEXT;