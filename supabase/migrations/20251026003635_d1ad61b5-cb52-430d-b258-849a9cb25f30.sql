-- Adicionar constraint UNIQUE na tabela usuario_filial_perfis
-- para permitir ON CONFLICT em (user_id, empresa_id, filial_id)

-- Primeiro, verificar se já existe algum constraint similar
ALTER TABLE public.usuario_filial_perfis
ADD CONSTRAINT usuario_filial_perfis_user_empresa_filial_unique 
UNIQUE (user_id, empresa_id, filial_id);

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuario_filial_perfis_lookup 
ON public.usuario_filial_perfis(user_id, empresa_id, filial_id) 
WHERE ativo = true;