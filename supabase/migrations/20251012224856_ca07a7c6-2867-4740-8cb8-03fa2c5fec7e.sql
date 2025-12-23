-- ============================================================================
-- MÓDULO DE PATRIMÔNIO - MIGRAÇÃO COMPLETA (CORRIGIDA)
-- ============================================================================

-- 1. CRIAR ENUM PARA STATUS DO PATRIMÔNIO
CREATE TYPE status_patrimonio AS ENUM ('ATIVO', 'INATIVO');

-- 2. CRIAR ENUM PARA NATUREZA DO PATRIMÔNIO
CREATE TYPE natureza_patrimonio AS ENUM ('DIREITO', 'OBRIGACAO');

-- 3. ATUALIZAR TABELA DE ETIQUETAS PARA SUPORTAR CATEGORIAS DE PATRIMÔNIO
ALTER TABLE public.etiquetas 
ADD COLUMN IF NOT EXISTS configuracao JSONB DEFAULT NULL;

COMMENT ON COLUMN public.etiquetas.configuracao IS 'Metadados da etiqueta incluindo tipo, ícone e schema do formulário para etiquetas de categoria de patrimônio';

-- 4. CRIAR TABELA DE PATRIMÔNIOS
CREATE TABLE public.contato_patrimonios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id UUID NOT NULL REFERENCES public.contatos_v2(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  
  -- Informações básicas
  descricao TEXT NOT NULL,
  natureza natureza_patrimonio NOT NULL DEFAULT 'DIREITO',
  valor_saldo NUMERIC(15,2),
  
  -- Ciclo de vida
  status status_patrimonio NOT NULL DEFAULT 'ATIVO',
  data_vinculo DATE,
  data_desvinculo DATE,
  
  -- Detalhes específicos (JSON flexível para cada tipo de bem)
  detalhes JSONB DEFAULT '{}'::jsonb,
  
  -- Observações gerais
  observacao TEXT,
  
  -- Metadados do sistema
  user_id UUID NOT NULL,
  empresa_id UUID,
  filial_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (data_desvinculo IS NULL OR data_vinculo IS NULL OR data_desvinculo >= data_vinculo)
);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_contato_patrimonios_contato ON public.contato_patrimonios(contato_id);
CREATE INDEX idx_contato_patrimonios_tenant ON public.contato_patrimonios(tenant_id);
CREATE INDEX idx_contato_patrimonios_status ON public.contato_patrimonios(status);
CREATE INDEX idx_contato_patrimonios_natureza ON public.contato_patrimonios(natureza);
CREATE INDEX idx_contato_patrimonios_detalhes ON public.contato_patrimonios USING GIN(detalhes);

-- 6. HABILITAR RLS
ALTER TABLE public.contato_patrimonios ENABLE ROW LEVEL SECURITY;

-- 7. CRIAR POLÍTICAS RLS
CREATE POLICY "patrimonios_select_by_tenant"
ON public.contato_patrimonios
FOR SELECT
USING (tenant_id = auth.uid() OR has_role('admin'));

CREATE POLICY "patrimonios_insert_by_tenant"
ON public.contato_patrimonios
FOR INSERT
WITH CHECK (tenant_id = auth.uid() AND user_id = auth.uid());

CREATE POLICY "patrimonios_update_by_tenant"
ON public.contato_patrimonios
FOR UPDATE
USING (tenant_id = auth.uid() OR has_role('admin'))
WITH CHECK (tenant_id = auth.uid() OR has_role('admin'));

CREATE POLICY "patrimonios_delete_by_tenant"
ON public.contato_patrimonios
FOR DELETE
USING (tenant_id = auth.uid() OR has_role('admin'));

-- 8. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
CREATE TRIGGER tg_contato_patrimonios_updated_at
  BEFORE UPDATE ON public.contato_patrimonios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- 9. TRIGGER PARA AUDITORIA
CREATE OR REPLACE FUNCTION public.audit_patrimonio_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'patrimonio_deleted',
      format('Patrimônio deletado: %s', OLD.descricao),
      jsonb_build_object(
        'patrimonio_id', OLD.id,
        'contato_id', OLD.contato_id,
        'descricao', OLD.descricao
      )
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      'patrimonio_updated',
      format('Patrimônio atualizado: %s', NEW.descricao),
      jsonb_build_object(
        'patrimonio_id', NEW.id,
        'contato_id', NEW.contato_id,
        'descricao', NEW.descricao,
        'changes', jsonb_build_object(
          'status', CASE WHEN OLD.status != NEW.status THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) ELSE NULL END,
          'valor', CASE WHEN OLD.valor_saldo != NEW.valor_saldo THEN jsonb_build_object('old', OLD.valor_saldo, 'new', NEW.valor_saldo) ELSE NULL END
        )
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      'patrimonio_created',
      format('Patrimônio criado: %s', NEW.descricao),
      jsonb_build_object(
        'patrimonio_id', NEW.id,
        'contato_id', NEW.contato_id,
        'descricao', NEW.descricao,
        'natureza', NEW.natureza
      )
    );
    RETURN NEW;
  END IF;
END;
$$;

CREATE TRIGGER tg_audit_patrimonio
  AFTER INSERT OR UPDATE OR DELETE ON public.contato_patrimonios
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_patrimonio_changes();

-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.contato_patrimonios IS 'Registro de patrimônio (bens, direitos e obrigações) vinculado a contatos';
COMMENT ON COLUMN public.contato_patrimonios.detalhes IS 'Detalhes específicos do bem em formato JSON flexível (placa/renavam para veículos, matrícula/cartório para imóveis, etc)';
COMMENT ON COLUMN public.contato_patrimonios.natureza IS 'Natureza do item: DIREITO (ativo) ou OBRIGACAO (passivo)';
COMMENT ON COLUMN public.contato_patrimonios.status IS 'Status atual: ATIVO ou INATIVO';
COMMENT ON COLUMN public.contato_patrimonios.data_vinculo IS 'Data de aquisição/início do vínculo';
COMMENT ON COLUMN public.contato_patrimonios.data_desvinculo IS 'Data de venda/perda/término do vínculo';