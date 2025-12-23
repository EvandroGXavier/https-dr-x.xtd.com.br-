-- ============================================
-- CORREÇÃO DO MÓDULO PROCESSOS (VERSÃO CORRIGIDA)
-- ============================================

-- 1. Trigger de preenchimento automático e validação
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

  -- Validação: exige cliente_principal_id
  IF NEW.cliente_principal_id IS NULL THEN
    RAISE EXCEPTION 'Informe o Contato (cliente principal) antes de salvar o processo.'
      USING HINT = 'Selecione um contato válido para o campo "Cliente principal".';
  END IF;

  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS btg_processos_fill_and_validate ON public.processos;

-- Cria novo trigger
CREATE TRIGGER btg_processos_fill_and_validate
BEFORE INSERT ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.trg_processos_fill_and_validate();

-- 2. Políticas RLS corrigidas
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas
DROP POLICY IF EXISTS processos_select ON public.processos;
DROP POLICY IF EXISTS processos_write ON public.processos;
DROP POLICY IF EXISTS processos_insert ON public.processos;
DROP POLICY IF EXISTS processos_update ON public.processos;
DROP POLICY IF EXISTS processos_delete ON public.processos;
DROP POLICY IF EXISTS "Users can view their own processos" ON public.processos;
DROP POLICY IF EXISTS "Users can create their own processos" ON public.processos;
DROP POLICY IF EXISTS "Users can update their own processos" ON public.processos;
DROP POLICY IF EXISTS "Users can delete their own processos" ON public.processos;

-- Cria política de SELECT
CREATE POLICY processos_select ON public.processos
FOR SELECT
USING (user_id = auth.uid() OR has_role('admin'));

-- Cria política de INSERT
CREATE POLICY processos_insert ON public.processos
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Cria política de UPDATE
CREATE POLICY processos_update ON public.processos
FOR UPDATE
USING (user_id = auth.uid() OR has_role('admin'))
WITH CHECK (user_id = auth.uid() OR has_role('admin'));

-- Cria política de DELETE
CREATE POLICY processos_delete ON public.processos
FOR DELETE
USING (user_id = auth.uid() OR has_role('admin'));

-- 3. Auditoria de criação de processos
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
    format('Processo criado: %s', NEW.assunto_principal),
    jsonb_build_object(
      'processo_id', NEW.id,
      'assunto_principal', NEW.assunto_principal,
      'status', NEW.status,
      'cliente_principal_id', NEW.cliente_principal_id,
      'empresa_id', NEW.empresa_id,
      'filial_id', NEW.filial_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_processo_creation ON public.processos;

CREATE TRIGGER trg_audit_processo_creation
AFTER INSERT ON public.processos
FOR EACH ROW
EXECUTE FUNCTION public.audit_processo_creation();