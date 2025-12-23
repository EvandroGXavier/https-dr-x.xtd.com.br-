-- Aplicar trigger nas tabelas principais (apenas onde não existe)
DO $$
DECLARE
  table_name text;
  trigger_exists boolean;
BEGIN
  FOR table_name IN 
    SELECT unnest(ARRAY['contatos', 'agendas', 'documentos', 'contas_financeiras', 'transacoes_financeiras', 'biblioteca_modelos', 'email_contas'])
  LOOP
    -- Verificar se o trigger já existe
    SELECT EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE event_object_table = table_name 
      AND trigger_name = 'set_tenant_on_insert_trigger'
    ) INTO trigger_exists;
    
    -- Criar trigger apenas se não existir
    IF NOT trigger_exists THEN
      EXECUTE format('
        CREATE TRIGGER set_tenant_on_insert_trigger
        BEFORE INSERT ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.set_tenant_on_insert();
      ', table_name);
    END IF;
  END LOOP;
END $$;