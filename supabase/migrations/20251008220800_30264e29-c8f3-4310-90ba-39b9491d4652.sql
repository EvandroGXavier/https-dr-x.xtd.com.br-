-- ============================================================================
-- MIGRAÇÃO: Otimização contatos_v2 - Parte 2 CORRIGIDA
-- ============================================================================

-- 1. Consolidar triggers
DROP TRIGGER IF EXISTS update_contatos_v2_updated_at ON public.contatos_v2;

-- 2. Tornar tenant_id obrigatório
ALTER TABLE public.contatos_v2 
ALTER COLUMN tenant_id SET NOT NULL;

-- 3. Constraint de formato CPF/CNPJ
ALTER TABLE public.contatos_v2 
ADD CONSTRAINT chk_cpf_cnpj_formato 
CHECK (
  cpf_cnpj IS NULL OR
  cpf_cnpj = '' OR
  cpf_cnpj ~ '^[0-9]{11}$' OR
  cpf_cnpj ~ '^[0-9]{14}$' OR
  cpf_cnpj LIKE '%_DUP_%'
);

-- 4. Trigger de validação de CPF/CNPJ
CREATE OR REPLACE FUNCTION public.validate_cpf_cnpj_format()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  digits_only text;
BEGIN
  IF NEW.cpf_cnpj IS NOT NULL AND NEW.cpf_cnpj != '' THEN
    digits_only := clean_cpf_cnpj(NEW.cpf_cnpj);
    
    IF length(digits_only) NOT IN (0, 11, 14) THEN
      RAISE EXCEPTION 'CPF deve ter 11 dígitos e CNPJ deve ter 14 dígitos. Recebido: % dígitos', 
        length(digits_only)
        USING HINT = 'Verifique o formato do documento';
    END IF;
    
    IF length(digits_only) > 0 AND digits_only ~ '^(\d)\1+$' THEN
      RAISE EXCEPTION 'CPF/CNPJ inválido: não pode conter apenas dígitos repetidos';
    END IF;
    
    NEW.cpf_cnpj := digits_only;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cpf_cnpj ON public.contatos_v2;
CREATE TRIGGER trg_validate_cpf_cnpj
  BEFORE INSERT OR UPDATE OF cpf_cnpj ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_cnpj_format();

-- 5. View consolidada (APENAS com colunas existentes)
CREATE OR REPLACE VIEW public.vw_contatos_completo AS
SELECT 
  c.id,
  c.user_id,
  c.tenant_id,
  c.empresa_id,
  c.filial_id,
  COALESCE(NULLIF(c.nome_fantasia, ''), NULLIF(c.nome, '')) as nome_display,
  c.nome_fantasia,
  c.nome,
  c.cpf_cnpj,
  CASE
    WHEN c.cpf_cnpj ~ '^[0-9]{11}$' THEN 'pf'::text
    WHEN c.cpf_cnpj ~ '^[0-9]{14}$' THEN 'pj'::text
    ELSE 'lead'::text
  END as tipo_deduzido,
  c.tipo_pessoa,
  c.pessoa_tipo,
  c.email,
  c.telefone,
  c.celular,
  c.observacao,
  c.ativo,
  c.created_at,
  c.updated_at
FROM public.contatos_v2 c;

COMMENT ON VIEW public.vw_contatos_completo IS 
'View consolidada de contatos com dedução automática de tipo (pf/pj/lead).';

-- 6. Índices de performance
CREATE INDEX IF NOT EXISTS idx_contatos_v2_nome_fantasia_lower 
ON public.contatos_v2 (LOWER(nome_fantasia))
WHERE nome_fantasia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contatos_v2_email_lower 
ON public.contatos_v2 (LOWER(email))
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contatos_v2_tipo_pessoa 
ON public.contatos_v2 (tipo_pessoa)
WHERE tipo_pessoa IS NOT NULL;

-- 7. Atualizar RLS policy (permitir DELETE)
DROP POLICY IF EXISTS contatos_v2_user_access_optimized ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_tenant_access ON public.contatos_v2;

CREATE POLICY contatos_v2_full_access 
ON public.contatos_v2 
FOR ALL 
TO authenticated
USING (
  tenant_id = auth.uid() OR
  user_id = auth.uid() OR
  has_role('admin'::app_role)
)
WITH CHECK (
  tenant_id = auth.uid() OR
  user_id = auth.uid() OR
  has_role('admin'::app_role)
);

-- 8. Auditoria
CREATE OR REPLACE FUNCTION public.audit_contatos_v2_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'contact_deleted',
      format('Contato excluído: %s', OLD.nome_fantasia),
      jsonb_build_object(
        'contato_id', OLD.id,
        'nome', OLD.nome_fantasia,
        'cpf_cnpj', OLD.cpf_cnpj,
        'tenant_id', OLD.tenant_id
      )
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' AND OLD.cpf_cnpj IS DISTINCT FROM NEW.cpf_cnpj THEN
    PERFORM log_security_event(
      'contact_cpf_cnpj_changed',
      format('CPF/CNPJ alterado: %s', NEW.nome_fantasia),
      jsonb_build_object(
        'contato_id', NEW.id,
        'old_cpf_cnpj', OLD.cpf_cnpj,
        'new_cpf_cnpj', NEW.cpf_cnpj
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_contatos_v2_changes ON public.contatos_v2;
CREATE TRIGGER trg_audit_contatos_v2_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_contatos_v2_changes();

-- 9. Documentação
COMMENT ON TABLE public.contatos_v2 IS 
'Tabela principal de contatos (PF, PJ e Leads). Campos essenciais: tenant_id, nome_fantasia, cpf_cnpj.';

COMMENT ON COLUMN public.contatos_v2.cpf_cnpj IS 
'CPF (11 dígitos) ou CNPJ (14 dígitos) sem formatação. Único por tenant_id.';

COMMENT ON COLUMN public.contatos_v2.tenant_id IS 
'ID do tenant. Obrigatório (NOT NULL). Base para isolamento multiempresa.';

COMMENT ON COLUMN public.contatos_v2.tipo_pessoa IS 
'Deduzido automaticamente: "pf", "pj" ou "lead".';

COMMENT ON COLUMN public.contatos_v2.nome_fantasia IS 
'Nome principal. Campo preferencial para exibição.';

COMMENT ON COLUMN public.contatos_v2.nome IS 
'LEGACY - Preferir nome_fantasia.';

COMMENT ON COLUMN public.contatos_v2.pessoa_tipo IS 
'LEGACY - Redundante com tipo_pessoa.';