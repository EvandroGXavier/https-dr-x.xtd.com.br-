-- Drop triggers problemáticos que referenciam campos inexistentes
DROP TRIGGER IF EXISTS btg_processos_fill_and_validate ON public.processos;
DROP TRIGGER IF EXISTS trg_audit_processo_creation ON public.processos;

-- Recriar função de preenchimento automático (sem validação de cliente_principal_id)
CREATE OR REPLACE FUNCTION public.trg_processos_fill_and_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id uuid;
  v_filial_id uuid;
BEGIN
  -- Preenche user_id automaticamente se nulo
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  -- Busca empresa_id e filial_id do perfil do usuário (se estiverem vazios)
  IF NEW.empresa_id IS NULL OR NEW.filial_id IS NULL THEN
    SELECT empresa_id, filial_id INTO v_empresa_id, v_filial_id
    FROM public.profiles
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF NEW.empresa_id IS NULL THEN
      NEW.empresa_id := v_empresa_id;
    END IF;
    
    IF NEW.filial_id IS NULL THEN
      NEW.filial_id := v_filial_id;
    END IF;
  END IF;

  -- Preenche tenant_id se vazio (usa empresa_id como tenant)
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := NEW.empresa_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Recriar função de auditoria (com campos corretos)
CREATE OR REPLACE FUNCTION public.audit_processo_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_description,
    metadata
  ) VALUES (
    auth.uid(),
    'processo_created',
    format('Processo criado: %s', NEW.titulo),
    jsonb_build_object(
      'processo_id', NEW.id,
      'titulo', NEW.titulo,
      'status', NEW.status,
      'tenant_id', NEW.tenant_id,
      'empresa_id', NEW.empresa_id,
      'filial_id', NEW.filial_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar triggers
CREATE TRIGGER btg_processos_fill_and_validate
BEFORE INSERT ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.trg_processos_fill_and_validate();

CREATE TRIGGER trg_audit_processo_creation
AFTER INSERT ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.audit_processo_creation();