-- Corrigir função set_contatos_v2_tenant_fields para não usar current_empresa_uuid/current_filial_uuid
CREATE OR REPLACE FUNCTION public.set_contatos_v2_tenant_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant uuid;
  v_empresa uuid;
  v_filial uuid;
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  BEGIN
    v_tenant := NULLIF(current_setting('app.tenant_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_tenant := NULL;
  END;

  BEGIN
    v_filial := NULLIF(current_setting('app.filial_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_filial := NULL;
  END;

  IF v_tenant IS NULL THEN
    SELECT empresa_id, filial_id
      INTO v_empresa, v_filial
    FROM public.profiles
    WHERE user_id = NEW.user_id;
  ELSE
    v_empresa := v_tenant;
  END IF;

  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := COALESCE(v_tenant, v_empresa, NEW.user_id);
  END IF;

  IF NEW.empresa_id IS NULL THEN
    NEW.empresa_id := COALESCE(v_empresa, NEW.tenant_id);
  END IF;

  IF NEW.filial_id IS NULL THEN
    NEW.filial_id := v_filial;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;