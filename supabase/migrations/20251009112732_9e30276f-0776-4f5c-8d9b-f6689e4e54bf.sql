-- Adicionar campos necessários em contato_pj se não existirem
ALTER TABLE public.contato_pj
ADD COLUMN IF NOT EXISTS tenant_id uuid,
ADD COLUMN IF NOT EXISTS porte text,
ADD COLUMN IF NOT EXISTS regime_tributario text,
ADD COLUMN IF NOT EXISTS situacao_cadastral text,
ADD COLUMN IF NOT EXISTS origem_dados text DEFAULT 'manual';

-- Adicionar campo origem_dados em contato_enderecos
ALTER TABLE public.contato_enderecos
ADD COLUMN IF NOT EXISTS origem_dados text DEFAULT 'manual';

-- Criar índice único para evitar duplicação de CNPJ no mesmo tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_contato_pj_cnpj_tenant
ON public.contato_pj (tenant_id, cnpj)
WHERE cnpj IS NOT NULL AND tenant_id IS NOT NULL;

-- Atualizar tenant_id dos registros existentes que não têm
UPDATE public.contato_pj
SET tenant_id = (
  SELECT user_id 
  FROM public.contatos_v2 
  WHERE contatos_v2.id = contato_pj.contato_id
  LIMIT 1
)
WHERE tenant_id IS NULL;

-- Criar política RLS adicional para tenant_id
DROP POLICY IF EXISTS "pj_tenant_access" ON public.contato_pj;
CREATE POLICY "pj_tenant_access"
ON public.contato_pj
FOR ALL
USING (
  tenant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c
    WHERE c.id = contato_pj.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'))
  )
)
WITH CHECK (
  tenant_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.contatos_v2 c
    WHERE c.id = contato_pj.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'))
  )
);

-- Função para consultar e gravar CNPJ automaticamente
CREATE OR REPLACE FUNCTION public.consultar_e_gravar_cnpj(
  p_cnpj text,
  p_contato_id uuid,
  p_tenant_id uuid,
  p_empresa_id uuid,
  p_filial_id uuid,
  p_forcar_atualizacao boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pj_existente record;
  v_dados_api jsonb;
  v_resultado jsonb;
BEGIN
  -- Verificar se já existe registro
  IF NOT p_forcar_atualizacao THEN
    SELECT * INTO v_pj_existente
    FROM public.contato_pj
    WHERE tenant_id = p_tenant_id
      AND cnpj = p_cnpj
    LIMIT 1;
    
    IF FOUND THEN
      RETURN jsonb_build_object(
        'status', 'cached',
        'message', 'CNPJ já cadastrado',
        'data', row_to_json(v_pj_existente)
      );
    END IF;
  END IF;
  
  -- Aqui você deve chamar a edge function consultar-cnpj
  -- Por enquanto, retornamos placeholder para que a lógica seja feita no frontend
  RETURN jsonb_build_object(
    'status', 'need_api_call',
    'message', 'Necessário consultar API externa'
  );
END;
$$;

-- Registrar auditoria de consultas CNPJ
CREATE TABLE IF NOT EXISTS public.cnpj_consultas_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  cnpj text NOT NULL,
  acao text NOT NULL, -- 'consulta' ou 'atualizacao'
  origem_dados text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cnpj_consultas_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_cnpj_tenant_access"
ON public.cnpj_consultas_audit
FOR ALL
USING (tenant_id = auth.uid() OR has_role('admin'))
WITH CHECK (tenant_id = auth.uid());

-- Adicionar trigger de auditoria
CREATE OR REPLACE FUNCTION public.audit_cnpj_consulta()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.cnpj_consultas_audit (
    user_id,
    tenant_id,
    cnpj,
    acao,
    origem_dados
  ) VALUES (
    auth.uid(),
    NEW.tenant_id,
    NEW.cnpj,
    CASE WHEN TG_OP = 'INSERT' THEN 'consulta' ELSE 'atualizacao' END,
    NEW.origem_dados
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_cnpj_consulta ON public.contato_pj;
CREATE TRIGGER trg_audit_cnpj_consulta
AFTER INSERT OR UPDATE ON public.contato_pj
FOR EACH ROW
EXECUTE FUNCTION public.audit_cnpj_consulta();