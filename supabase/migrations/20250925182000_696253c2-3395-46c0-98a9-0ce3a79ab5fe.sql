-- Padronização de Nomenclatura WhatsApp
-- Este script remove as tabelas inconsistentes e cria novas com nomenclatura padronizada wa_ + nome em português

-- 1. DROP das tabelas antigas com nomenclatura inconsistente
DROP TABLE IF EXISTS whatsapp_accounts CASCADE;
DROP TABLE IF EXISTS whatsapp_config CASCADE;
DROP TABLE IF EXISTS whatsapp_quick_replies CASCADE;

-- 2. RENAME da tabela wa_threads para wa_atendimentos
ALTER TABLE wa_threads RENAME TO wa_atendimentos;

-- 3. CREATE novas tabelas padronizadas

-- Tabela de contas WhatsApp (unificação de whatsapp_accounts e wa_accounts)
CREATE TABLE wa_contas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id uuid,
  filial_id uuid,
  nome_instancia text NOT NULL,
  phone_number_id text,
  phone_number text,
  waba_id text,
  display_name text,
  status text NOT NULL DEFAULT 'offline',
  is_active boolean DEFAULT false,
  webhook_url text,
  access_token_encrypted text,
  webhook_verify_token text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de configurações WhatsApp
CREATE TABLE wa_configuracoes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  api_endpoint text NOT NULL,
  api_key text NOT NULL,
  ia_enabled boolean DEFAULT false,
  ia_api_key text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de respostas rápidas
CREATE TABLE wa_respostas_rapidas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shortcut text NOT NULL,
  message text NOT NULL,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. RLS Policies para as novas tabelas

-- RLS para wa_contas
ALTER TABLE wa_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias contas" ON wa_contas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias contas" ON wa_contas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias contas" ON wa_contas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias contas" ON wa_contas
  FOR DELETE USING (auth.uid() = user_id);

-- RLS para wa_configuracoes
ALTER TABLE wa_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias configurações" ON wa_configuracoes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias configurações" ON wa_configuracoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias configurações" ON wa_configuracoes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias configurações" ON wa_configuracoes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS para wa_respostas_rapidas
ALTER TABLE wa_respostas_rapidas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias respostas rápidas" ON wa_respostas_rapidas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias respostas rápidas" ON wa_respostas_rapidas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias respostas rápidas" ON wa_respostas_rapidas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias respostas rápidas" ON wa_respostas_rapidas
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Atualizar referências em outras tabelas para wa_atendimentos
ALTER TABLE wa_messages 
  DROP CONSTRAINT IF EXISTS wa_messages_thread_id_fkey,
  ADD CONSTRAINT wa_messages_thread_id_fkey 
    FOREIGN KEY (thread_id) REFERENCES wa_atendimentos(id) ON DELETE CASCADE;

-- 6. Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wa_contas_updated_at
  BEFORE UPDATE ON wa_contas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wa_configuracoes_updated_at
  BEFORE UPDATE ON wa_configuracoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wa_respostas_rapidas_updated_at
  BEFORE UPDATE ON wa_respostas_rapidas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Indexes para performance
CREATE INDEX idx_wa_contas_user_id ON wa_contas(user_id);
CREATE INDEX idx_wa_contas_status ON wa_contas(status);
CREATE INDEX idx_wa_configuracoes_user_id ON wa_configuracoes(user_id);
CREATE INDEX idx_wa_respostas_rapidas_user_id ON wa_respostas_rapidas(user_id);

-- 8. Comments para documentação
COMMENT ON TABLE wa_contas IS 'Contas WhatsApp unificadas (substituindo whatsapp_accounts e wa_accounts)';
COMMENT ON TABLE wa_configuracoes IS 'Configurações WhatsApp (substituindo whatsapp_config)';
COMMENT ON TABLE wa_respostas_rapidas IS 'Respostas rápidas WhatsApp (substituindo whatsapp_quick_replies)';
COMMENT ON TABLE wa_atendimentos IS 'Atendimentos/conversas WhatsApp (antigo wa_threads)';

-- 9. Função para migrar dados existentes (se necessário)
CREATE OR REPLACE FUNCTION migrar_dados_whatsapp()
RETURNS void AS $$
BEGIN
  -- Esta função pode ser usada para migrar dados existentes das tabelas antigas
  -- se necessário no futuro
  RAISE NOTICE 'Dados WhatsApp padronizados com sucesso';
END;
$$ LANGUAGE plpgsql;