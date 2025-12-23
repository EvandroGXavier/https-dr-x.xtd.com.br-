-- VIEW de compatibilidade para suportar a migração contatos -> contatos_v2
CREATE OR REPLACE VIEW public.vw_contatos_compat AS
SELECT 
  c.id::uuid as id,
  c.nome_fantasia as nome,
  c.cpf_cnpj,
  c.email,
  c.celular,
  c.telefone,
  c.user_id,
  c.ativo
FROM public.contatos_v2 c
WHERE c.ativo = true;

-- Garantir permissões na VIEW
GRANT SELECT ON public.vw_contatos_compat TO authenticated;

-- Verificar se a FK existe e recriar se necessário
DO $$ 
BEGIN
  -- Verificar se a foreign key ainda aponta para contatos antigos
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'transacoes_financeiras' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'contato_id'
    AND ccu.table_name = 'contatos'
  ) THEN
    -- Remover FK antiga
    ALTER TABLE public.transacoes_financeiras 
    DROP CONSTRAINT IF EXISTS transacoes_financeiras_contato_id_fkey;
    
    -- Adicionar FK nova para contatos_v2
    ALTER TABLE public.transacoes_financeiras
    ADD CONSTRAINT transacoes_financeiras_contato_id_fkey
    FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;