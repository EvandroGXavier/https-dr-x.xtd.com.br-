-- 🧩 1. Função de validação de CNPJ duplicado
CREATE OR REPLACE FUNCTION public.validar_cnpj_empresa()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.saas_empresas
    WHERE cnpj = NEW.cnpj 
    AND empresa_id != NEW.empresa_id
    AND ativa = true
  ) THEN
    RAISE EXCEPTION 'Já existe uma empresa ativa cadastrada com este CNPJ (%).', NEW.cnpj;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🧩 2. Função de auditoria padrão
CREATE OR REPLACE FUNCTION public.audit_saas_empresas()
RETURNS trigger AS $$
DECLARE
  v_action text;
  v_details jsonb;
BEGIN
  v_action := TG_OP;
  
  IF TG_OP = 'DELETE' THEN
    v_details := to_jsonb(OLD);
  ELSE
    v_details := to_jsonb(NEW);
  END IF;

  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  )
  VALUES (
    auth.uid(),
    v_action || '_EMPRESA',
    'Operação ' || v_action || ' em saas_empresas: ' || COALESCE(NEW.nome, OLD.nome),
    jsonb_build_object(
      'empresa_id', COALESCE(NEW.empresa_id, OLD.empresa_id),
      'cnpj', COALESCE(NEW.cnpj, OLD.cnpj),
      'operation', TG_OP,
      'details', v_details
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🧩 3. Aplicar triggers
DROP TRIGGER IF EXISTS trg_validar_cnpj_empresa ON public.saas_empresas;
CREATE TRIGGER trg_validar_cnpj_empresa
BEFORE INSERT OR UPDATE OF cnpj ON public.saas_empresas
FOR EACH ROW
EXECUTE FUNCTION public.validar_cnpj_empresa();

DROP TRIGGER IF EXISTS trg_audit_saas_empresas ON public.saas_empresas;
CREATE TRIGGER trg_audit_saas_empresas
AFTER INSERT OR UPDATE OR DELETE ON public.saas_empresas
FOR EACH ROW
EXECUTE FUNCTION public.audit_saas_empresas();

-- 🧩 4. RLS + policies seguras
ALTER TABLE public.saas_empresas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS saas_empresas_rw_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_select_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_insert_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_update_policy ON public.saas_empresas;
DROP POLICY IF EXISTS saas_empresas_delete_policy ON public.saas_empresas;

-- Create comprehensive RLS policy using existing is_superadmin function
CREATE POLICY saas_empresas_select_policy
ON public.saas_empresas
FOR SELECT
TO authenticated
USING (
  -- Superadmin pode ver tudo usando a função RPC existente
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
  -- Ou usuário pertence à empresa
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY saas_empresas_insert_policy
ON public.saas_empresas
FOR INSERT
TO authenticated
WITH CHECK (
  -- Somente superadmin pode criar empresas
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY saas_empresas_update_policy
ON public.saas_empresas
FOR UPDATE
TO authenticated
USING (
  -- Superadmin pode modificar tudo
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
  -- Ou usuário pertence à empresa
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  -- Superadmin pode modificar tudo
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
  -- Ou usuário pertence à empresa
  OR empresa_id = (SELECT empresa_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY saas_empresas_delete_policy
ON public.saas_empresas
FOR DELETE
TO authenticated
USING (
  -- Somente superadmin pode excluir (exclusão lógica é via UPDATE)
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);