-- Garantir FK entre transacoes_financeiras.contato_id -> contatos_v2.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'transacoes_financeiras'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'contato_id'
  ) THEN
    ALTER TABLE public.transacoes_financeiras
    ADD CONSTRAINT transacoes_financeiras_contato_id_fkey
    FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;