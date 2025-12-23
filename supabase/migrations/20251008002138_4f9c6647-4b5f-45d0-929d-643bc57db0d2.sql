-- Remove duplicatas e corrige tenant/empresa/filial em contatos_v2 (sem violar FK)

-- 1) Deletar duplicatas
DELETE FROM public.contatos_v2 c1
USING public.contatos_v2 c2
WHERE c1.id < c2.id
  AND c1.user_id = c2.user_id
  AND c1.cpf_cnpj = c2.cpf_cnpj
  AND c1.cpf_cnpj IS NOT NULL
  AND c1.cpf_cnpj != '';

-- 2) Function to auto-fill tenant, empresa and filial on contatos_v2
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
    SELECT current_empresa_uuid, current_filial_uuid
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

-- 3) Triggers on contatos_v2
DROP TRIGGER IF EXISTS trg_contatos_v2_set_user_id ON public.contatos_v2;
CREATE TRIGGER trg_contatos_v2_set_user_id
BEFORE INSERT ON public.contatos_v2
FOR EACH ROW
EXECUTE FUNCTION public.set_contatos_v2_user_id();

DROP TRIGGER IF EXISTS trg_contatos_v2_set_tenant_fields_ins ON public.contatos_v2;
CREATE TRIGGER trg_contatos_v2_set_tenant_fields_ins
BEFORE INSERT ON public.contatos_v2
FOR EACH ROW
EXECUTE FUNCTION public.set_contatos_v2_tenant_fields();

DROP TRIGGER IF EXISTS trg_contatos_v2_set_tenant_fields_upd ON public.contatos_v2;
CREATE TRIGGER trg_contatos_v2_set_tenant_fields_upd
BEFORE UPDATE ON public.contatos_v2
FOR EACH ROW
EXECUTE FUNCTION public.set_contatos_v2_tenant_fields();

-- 4) Backfill: apenas contatos com user_id válido
UPDATE public.contatos_v2 c
SET 
  tenant_id = COALESCE(c.tenant_id, c.user_id),
  empresa_id = COALESCE(c.empresa_id, c.user_id),
  updated_at = now()
WHERE c.tenant_id IS NULL OR c.empresa_id IS NULL;

-- 5) Backfill de filial usando profiles
UPDATE public.contatos_v2 c
SET 
  filial_id = COALESCE(c.filial_id, p.current_filial_uuid),
  updated_at = now()
FROM public.profiles p
WHERE c.user_id = p.user_id
  AND c.filial_id IS NULL
  AND p.current_filial_uuid IS NOT NULL;
