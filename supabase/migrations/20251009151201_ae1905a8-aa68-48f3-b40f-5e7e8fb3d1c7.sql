-- Corrigir foreign keys da tabela contato_vinculos para usar contatos_v2

-- Primeiro, remover a constraint antiga se existir
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contato_vinculos_contato_id_fkey' 
    AND table_name = 'contato_vinculos'
  ) THEN
    ALTER TABLE public.contato_vinculos DROP CONSTRAINT contato_vinculos_contato_id_fkey;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contato_vinculos_vinculado_id_fkey' 
    AND table_name = 'contato_vinculos'
  ) THEN
    ALTER TABLE public.contato_vinculos DROP CONSTRAINT contato_vinculos_vinculado_id_fkey;
  END IF;
END $$;

-- Adicionar as novas foreign keys corretamente para contatos_v2
ALTER TABLE public.contato_vinculos 
  ADD CONSTRAINT contato_vinculos_contato_id_fkey 
  FOREIGN KEY (contato_id) 
  REFERENCES public.contatos_v2(id) 
  ON DELETE CASCADE;

ALTER TABLE public.contato_vinculos 
  ADD CONSTRAINT contato_vinculos_vinculado_id_fkey 
  FOREIGN KEY (vinculado_id) 
  REFERENCES public.contatos_v2(id) 
  ON DELETE CASCADE;

-- Comentário para documentar a mudança
COMMENT ON CONSTRAINT contato_vinculos_contato_id_fkey ON public.contato_vinculos 
IS 'Referência corrigida para contatos_v2 ao invés de contatos (tabela antiga)';