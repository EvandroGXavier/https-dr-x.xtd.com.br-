-- Corrigir foreign key constraints da tabela contato_vinculos
-- Remover constraints antigas que apontam para tabela 'contatos'
ALTER TABLE public.contato_vinculos 
DROP CONSTRAINT IF EXISTS contato_vinculos_contato_id_fkey;

ALTER TABLE public.contato_vinculos 
DROP CONSTRAINT IF EXISTS contato_vinculos_vinculado_id_fkey;

-- Adicionar foreign key constraints corretas apontando para 'contatos_v2'
ALTER TABLE public.contato_vinculos 
ADD CONSTRAINT contato_vinculos_contato_id_fkey 
FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON DELETE CASCADE;

ALTER TABLE public.contato_vinculos 
ADD CONSTRAINT contato_vinculos_vinculado_id_fkey 
FOREIGN KEY (vinculado_id) REFERENCES public.contatos_v2(id) ON DELETE CASCADE;