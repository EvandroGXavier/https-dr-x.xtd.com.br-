-- Adicionar índices para melhorar performance dos contatos
-- Índice para consultas por user_id na tabela contatos_v2
CREATE INDEX IF NOT EXISTS idx_contatos_v2_user_id ON public.contatos_v2(user_id);

-- Índice para consultas de endereço principal por contato
CREATE INDEX IF NOT EXISTS idx_contato_enderecos_contato_principal ON public.contato_enderecos(contato_id, principal);