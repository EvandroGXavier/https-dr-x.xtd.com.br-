-- Criar tabela de contas de e-mail
CREATE TABLE public.email_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  smtp_host TEXT NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  smtp_user TEXT NOT NULL,
  smtp_pass TEXT NOT NULL, -- será criptografado via função
  tls_ssl BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar ENUM para status de email
CREATE TYPE email_status AS ENUM ('pendente', 'enviado', 'erro');

-- Criar tabela de triggers/gatilhos de e-mail  
CREATE TABLE public.email_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID,
  filial_id UUID,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  modelo_id UUID NOT NULL,
  conta_id UUID NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de logs de e-mail
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_id UUID,
  contato_id UUID,
  user_id UUID NOT NULL,
  conta_id UUID NOT NULL,
  destinatario_email TEXT NOT NULL,
  assunto TEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'pendente',
  mensagem_erro TEXT,
  enviado_em TIMESTAMP WITH TIME ZONE,
  tentativa INTEGER NOT NULL DEFAULT 1,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.email_contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para email_contas
CREATE POLICY "Users can view their own email_contas" ON public.email_contas
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own email_contas" ON public.email_contas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email_contas" ON public.email_contas
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own email_contas" ON public.email_contas
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Políticas RLS para email_triggers
CREATE POLICY "Users can view their own email_triggers" ON public.email_triggers
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own email_triggers" ON public.email_triggers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email_triggers" ON public.email_triggers
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own email_triggers" ON public.email_triggers
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Políticas RLS para email_logs
CREATE POLICY "Users can view their own email_logs" ON public.email_logs
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own email_logs" ON public.email_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email_logs" ON public.email_logs
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

-- Triggers para atualizar updated_at
CREATE TRIGGER update_email_contas_updated_at
  BEFORE UPDATE ON public.email_contas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_triggers_updated_at
  BEFORE UPDATE ON public.email_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criptografar senhas SMTP
CREATE OR REPLACE FUNCTION public.encrypt_smtp_password()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.smtp_pass IS NOT NULL AND NEW.smtp_pass != OLD.smtp_pass THEN
    NEW.smtp_pass = public.encrypt_sensitive_data(NEW.smtp_pass, 'smtp_pass');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criptografar senha antes de inserir/atualizar
CREATE TRIGGER encrypt_smtp_password_trigger
  BEFORE INSERT OR UPDATE ON public.email_contas
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_smtp_password();

-- Função para descriptografar senhas SMTP (apenas para uso interno)
CREATE OR REPLACE FUNCTION public.get_smtp_credentials(conta_id_param UUID)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  email TEXT,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_user TEXT,
  smtp_pass_decrypted TEXT,
  tls_ssl BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar permissões
  IF NOT (has_role('admin') OR has_role('moderator')) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem acessar credenciais SMTP';
  END IF;

  RETURN QUERY
  SELECT 
    ec.id,
    ec.nome,
    ec.email,
    ec.smtp_host,
    ec.smtp_port,
    ec.smtp_user,
    public.decrypt_sensitive_data(ec.smtp_pass, 'smtp_pass') as smtp_pass_decrypted,
    ec.tls_ssl
  FROM public.email_contas ec
  WHERE ec.id = conta_id_param 
    AND ec.ativo = true
    AND (ec.user_id = auth.uid() OR has_role('admin'));
END;
$$;