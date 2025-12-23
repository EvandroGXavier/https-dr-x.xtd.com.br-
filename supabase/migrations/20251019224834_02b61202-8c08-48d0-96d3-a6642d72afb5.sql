-- ============================================
-- AUDITORIA DE CONTATOS VIA ATALHO GLOBAL
-- ============================================

-- 1. Trigger para auditar criação de contatos_v2 via atalho global
CREATE OR REPLACE FUNCTION public.audit_contato_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar auditoria de criação de contato
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    auth.uid(),
    'contact_created',
    format('Contato criado: %s', NEW.nome_fantasia),
    jsonb_build_object(
      'contato_id', NEW.id,
      'nome', NEW.nome_fantasia,
      'cpf_cnpj', NEW.cpf_cnpj,
      'origem', 'hotkey_global',
      'tenant_id', NEW.tenant_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para auditoria automática
DROP TRIGGER IF EXISTS trg_audit_contato_creation ON public.contatos_v2;

CREATE TRIGGER trg_audit_contato_creation
AFTER INSERT ON public.contatos_v2
FOR EACH ROW
EXECUTE FUNCTION public.audit_contato_creation();

-- 3. Função para auditar criação de meios de contato
CREATE OR REPLACE FUNCTION public.audit_meio_contato_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar auditoria de meio de contato
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    auth.uid(),
    'contact_info_added',
    format('Meio de contato adicionado: %s - %s', NEW.tipo, NEW.valor),
    jsonb_build_object(
      'meio_contato_id', NEW.id,
      'contato_id', NEW.contato_id,
      'tipo', NEW.tipo,
      'valor', NEW.valor,
      'principal', NEW.principal
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar trigger para meios de contato
DROP TRIGGER IF EXISTS trg_audit_meio_contato_creation ON public.contato_meios_contato;

CREATE TRIGGER trg_audit_meio_contato_creation
AFTER INSERT ON public.contato_meios_contato
FOR EACH ROW
EXECUTE FUNCTION public.audit_meio_contato_creation();