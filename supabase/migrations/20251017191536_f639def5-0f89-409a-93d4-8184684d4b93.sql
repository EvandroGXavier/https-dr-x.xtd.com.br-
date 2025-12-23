-- ========================================
-- 🔒 WHATSAPP EVOLUTION - SEGURANÇA RLS MULTI-TENANT
-- ========================================

-- 1️⃣ Atualizar políticas RLS para todas as tabelas wa_* com suporte a service_role

-- wa_contas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias contas" ON public.wa_contas;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias contas" ON public.wa_contas;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias contas" ON public.wa_contas;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias contas" ON public.wa_contas;

CREATE POLICY "wa_contas_select_rls"
  ON public.wa_contas
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "wa_contas_insert_rls"
  ON public.wa_contas
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "wa_contas_update_rls"
  ON public.wa_contas
  FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "wa_contas_delete_rls"
  ON public.wa_contas
  FOR DELETE USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- wa_configuracoes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias configurações" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias configurações" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias configurações" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias configurações" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Users can view their own wa_configuracoes" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Users can insert their own wa_configuracoes" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Users can update their own wa_configuracoes" ON public.wa_configuracoes;
DROP POLICY IF EXISTS "Users can delete their own wa_configuracoes" ON public.wa_configuracoes;

CREATE POLICY "wa_configuracoes_select_rls"
  ON public.wa_configuracoes
  FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "wa_configuracoes_insert_rls"
  ON public.wa_configuracoes
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "wa_configuracoes_update_rls"
  ON public.wa_configuracoes
  FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role');

CREATE POLICY "wa_configuracoes_delete_rls"
  ON public.wa_configuracoes
  FOR DELETE USING (user_id = auth.uid() OR auth.role() = 'service_role');

-- wa_contacts (se existir a coluna user_id, senão usamos account_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_contacts' 
    AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can create their own wa_contacts" ON public.wa_contacts;
    DROP POLICY IF EXISTS "Users can view their own wa_contacts" ON public.wa_contacts;
    DROP POLICY IF EXISTS "Users can update their own wa_contacts" ON public.wa_contacts;
    DROP POLICY IF EXISTS "Users can delete their own wa_contacts" ON public.wa_contacts;
    DROP POLICY IF EXISTS "Users can manage their own wa_contacts" ON public.wa_contacts;

    CREATE POLICY "wa_contacts_select_rls"
      ON public.wa_contacts
      FOR SELECT USING (user_id = auth.uid() OR auth.role() = 'service_role');

    CREATE POLICY "wa_contacts_insert_rls"
      ON public.wa_contacts
      FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

    CREATE POLICY "wa_contacts_update_rls"
      ON public.wa_contacts
      FOR UPDATE USING (user_id = auth.uid() OR auth.role() = 'service_role');

    CREATE POLICY "wa_contacts_delete_rls"
      ON public.wa_contacts
      FOR DELETE USING (user_id = auth.uid() OR auth.role() = 'service_role');
  END IF;
END $$;

-- wa_mensagens (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_mensagens'
  ) THEN
    EXECUTE 'ALTER TABLE public.wa_mensagens ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "wa_mensagens_select_rls" ON public.wa_mensagens';
    EXECUTE 'DROP POLICY IF EXISTS "wa_mensagens_insert_rls" ON public.wa_mensagens';
    EXECUTE 'DROP POLICY IF EXISTS "wa_mensagens_update_rls" ON public.wa_mensagens';
    EXECUTE 'DROP POLICY IF EXISTS "wa_mensagens_delete_rls" ON public.wa_mensagens';
    
    EXECUTE 'CREATE POLICY "wa_mensagens_select_rls" ON public.wa_mensagens FOR SELECT USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_mensagens_insert_rls" ON public.wa_mensagens FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_mensagens_update_rls" ON public.wa_mensagens FOR UPDATE USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_mensagens_delete_rls" ON public.wa_mensagens FOR DELETE USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
  END IF;
END $$;

-- wa_outbox (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_outbox'
  ) THEN
    EXECUTE 'ALTER TABLE public.wa_outbox ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "wa_outbox_select_rls" ON public.wa_outbox';
    EXECUTE 'DROP POLICY IF EXISTS "wa_outbox_insert_rls" ON public.wa_outbox';
    EXECUTE 'DROP POLICY IF EXISTS "wa_outbox_update_rls" ON public.wa_outbox';
    EXECUTE 'DROP POLICY IF EXISTS "wa_outbox_delete_rls" ON public.wa_outbox';
    
    EXECUTE 'CREATE POLICY "wa_outbox_select_rls" ON public.wa_outbox FOR SELECT USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_outbox_insert_rls" ON public.wa_outbox FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_outbox_update_rls" ON public.wa_outbox FOR UPDATE USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_outbox_delete_rls" ON public.wa_outbox FOR DELETE USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
  END IF;
END $$;

-- wa_atendimentos (se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wa_atendimentos'
  ) THEN
    EXECUTE 'ALTER TABLE public.wa_atendimentos ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "wa_atendimentos_select_rls" ON public.wa_atendimentos';
    EXECUTE 'DROP POLICY IF EXISTS "wa_atendimentos_insert_rls" ON public.wa_atendimentos';
    EXECUTE 'DROP POLICY IF EXISTS "wa_atendimentos_update_rls" ON public.wa_atendimentos';
    EXECUTE 'DROP POLICY IF EXISTS "wa_atendimentos_delete_rls" ON public.wa_atendimentos';
    
    EXECUTE 'CREATE POLICY "wa_atendimentos_select_rls" ON public.wa_atendimentos FOR SELECT USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_atendimentos_insert_rls" ON public.wa_atendimentos FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_atendimentos_update_rls" ON public.wa_atendimentos FOR UPDATE USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
    EXECUTE 'CREATE POLICY "wa_atendimentos_delete_rls" ON public.wa_atendimentos FOR DELETE USING (user_id = auth.uid() OR auth.role() = ''service_role'')';
  END IF;
END $$;

-- 2️⃣ Criar função de auditoria para WhatsApp
CREATE OR REPLACE FUNCTION public.log_wa_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.auditorias (
    actor,
    action,
    target,
    module,
    criado_em,
    tenant_id,
    payload
  ) VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    COALESCE(NEW.id, OLD.id)::text,
    'whatsapp',
    now(),
    COALESCE(NEW.user_id, OLD.user_id, auth.uid()),
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', now()
    )
  );
  RETURN COALESCE(NEW, OLD);
EXCEPTION WHEN OTHERS THEN
  -- Não bloqueia operação se auditoria falhar
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3️⃣ Aplicar triggers de auditoria
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('wa_mensagens', 'wa_outbox', 'wa_atendimentos', 'wa_contas')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_wa_auditoria()', tbl, tbl);
  END LOOP;
END $$;

-- 4️⃣ Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_wa_contas_user_status ON public.wa_contas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_wa_configuracoes_user_active ON public.wa_configuracoes(user_id, is_active);

-- Log de sucesso
DO $$
BEGIN
  PERFORM log_security_event(
    'whatsapp_security_migration',
    'WhatsApp Evolution security policies updated',
    jsonb_build_object(
      'timestamp', now(),
      'policies_updated', true,
      'audit_enabled', true
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignora se log_security_event não existir
  NULL;
END $$;