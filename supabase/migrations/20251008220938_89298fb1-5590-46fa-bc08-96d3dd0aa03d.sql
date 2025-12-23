-- ============================================================================
-- MIGRAÇÃO: Otimização contatos_v2 - Versão Final Limpa
-- ============================================================================

-- 1. Remover elementos conflitantes
ALTER TABLE public.contatos_v2 DROP CONSTRAINT IF EXISTS chk_cpf_cnpj_formato;
DROP TRIGGER IF EXISTS update_contatos_v2_updated_at ON public.contatos_v2;
DROP TRIGGER IF EXISTS trg_validate_cpf_cnpj ON public.contatos_v2;
DROP TRIGGER IF EXISTS trg_audit_contatos_v2_changes ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_user_access_optimized ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_tenant_access ON public.contatos_v2;
DROP POLICY IF EXISTS contatos_v2_full_access ON public.contatos_v2;

-- 2. Tornar tenant_id obrigatório
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'contatos_v2' 
      AND column_name = 'tenant_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.contatos_v2 ALTER COLUMN tenant_id SET NOT NULL;
  END IF;
END $$;

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

-- 4. Trigger de validação
CREATE TRIGGER trg_validate_cpf_cnpj
  BEFORE INSERT OR UPDATE OF cpf_cnpj ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_cpf_cnpj_format();

-- 5. View consolidada
CREATE OR REPLACE VIEW public.vw_contatos_completo AS
SELECT 
  c.id, c.user_id, c.tenant_id, c.empresa_id, c.filial_id,
  COALESCE(NULLIF(c.nome_fantasia, ''), NULLIF(c.nome, '')) as nome_display,
  c.nome_fantasia, c.nome, c.cpf_cnpj,
  CASE
    WHEN c.cpf_cnpj ~ '^[0-9]{11}$' THEN 'pf'::text
    WHEN c.cpf_cnpj ~ '^[0-9]{14}$' THEN 'pj'::text
    ELSE 'lead'::text
  END as tipo_deduzido,
  c.tipo_pessoa, c.pessoa_tipo, c.email, c.telefone, c.celular,
  c.observacao, c.ativo, c.created_at, c.updated_at
FROM public.contatos_v2 c;

-- 6. Índices de performance
CREATE INDEX IF NOT EXISTS idx_contatos_v2_nome_fantasia_lower 
ON public.contatos_v2 (LOWER(nome_fantasia)) WHERE nome_fantasia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contatos_v2_email_lower 
ON public.contatos_v2 (LOWER(email)) WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contatos_v2_tipo_pessoa 
ON public.contatos_v2 (tipo_pessoa) WHERE tipo_pessoa IS NOT NULL;

-- 7. RLS policy unificada (permite SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY contatos_v2_full_access 
ON public.contatos_v2 FOR ALL TO authenticated
USING (tenant_id = auth.uid() OR user_id = auth.uid() OR has_role('admin'::app_role))
WITH CHECK (tenant_id = auth.uid() OR user_id = auth.uid() OR has_role('admin'::app_role));

-- 8. Auditoria
CREATE TRIGGER trg_audit_contatos_v2_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_contatos_v2_changes();

-- 9. Documentação
COMMENT ON TABLE public.contatos_v2 IS 
'Tabela principal de contatos (PF, PJ e Leads). CRUD completo via RLS. Campos obrigatórios: tenant_id, nome_fantasia.';

COMMENT ON COLUMN public.contatos_v2.cpf_cnpj IS 
'CPF (11 dig) ou CNPJ (14 dig) sem formatação. Único por tenant_id. Validado automaticamente.';

COMMENT ON COLUMN public.contatos_v2.tenant_id IS 
'ID do tenant (NOT NULL). Isolamento multiempresa via RLS.';

COMMENT ON COLUMN public.contatos_v2.tipo_pessoa IS 
'Deduzido automaticamente: "pf", "pj" ou "lead".';

COMMENT ON COLUMN public.contatos_v2.nome_fantasia IS 
'Nome principal (campo preferencial).';

COMMENT ON COLUMN public.contatos_v2.nome IS 'LEGACY - Usar nome_fantasia.';
COMMENT ON COLUMN public.contatos_v2.pessoa_tipo IS 'LEGACY - Usar tipo_pessoa.';