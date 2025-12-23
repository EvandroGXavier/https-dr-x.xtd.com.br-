-- Corrigir funções para ter search_path seguro
CREATE OR REPLACE FUNCTION public.update_agendas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.validate_agendas_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Garantir que tenant_id seja sempre definido
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;