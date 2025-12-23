-- =========================================================
-- BIBLIOTECA JURÍDICA V2 — SCHEMA, RLS, AUDITORIA, BUSCA
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS public.biblioteca_modelos_v2 (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL,
  titulo               text NOT NULL,
  descricao            text,
  conteudo_html        text,
  criado_por           uuid,
  atualizado_por       uuid,
  data_criacao         timestamptz NOT NULL DEFAULT now(),
  data_atualizacao     timestamptz NOT NULL DEFAULT now(),
  data_exclusao_logica timestamptz
);

COMMENT ON TABLE public.biblioteca_modelos_v2 IS 'Biblioteca Jurídica V2 - modelos/peças/contratos com editor avançado, IA e etiquetas.';

CREATE INDEX IF NOT EXISTS idx_biblioteca_v2_tenant ON public.biblioteca_modelos_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_biblioteca_v2_titulo ON public.biblioteca_modelos_v2 USING gin (titulo gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_biblioteca_v2_desc ON public.biblioteca_modelos_v2 USING gin (descricao gin_trgm_ops);

ALTER TABLE public.biblioteca_modelos_v2 ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.fn_biblioteca_v2_update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('portuguese',
    coalesce(NEW.titulo,'') || ' ' ||
    regexp_replace(coalesce(NEW.descricao,''), '<[^>]+>', ' ', 'g') || ' ' ||
    regexp_replace(coalesce(NEW.conteudo_html,''), '<[^>]+>', ' ', 'g')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_biblioteca_v2_search_vector ON public.biblioteca_modelos_v2;
CREATE TRIGGER trg_biblioteca_v2_search_vector
BEFORE INSERT OR UPDATE ON public.biblioteca_modelos_v2
FOR EACH ROW EXECUTE FUNCTION public.fn_biblioteca_v2_update_search_vector();

CREATE INDEX IF NOT EXISTS idx_biblioteca_v2_search ON public.biblioteca_modelos_v2 USING gin (search_vector);

ALTER TABLE public.biblioteca_modelos_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_biblioteca_v2_select ON public.biblioteca_modelos_v2;
CREATE POLICY p_biblioteca_v2_select ON public.biblioteca_modelos_v2
FOR SELECT USING (tenant_id = auth.uid() AND data_exclusao_logica IS NULL);

DROP POLICY IF EXISTS p_biblioteca_v2_insert ON public.biblioteca_modelos_v2;
CREATE POLICY p_biblioteca_v2_insert ON public.biblioteca_modelos_v2
FOR INSERT WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS p_biblioteca_v2_update ON public.biblioteca_modelos_v2;
CREATE POLICY p_biblioteca_v2_update ON public.biblioteca_modelos_v2
FOR UPDATE USING (tenant_id = auth.uid() AND data_exclusao_logica IS NULL)
WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS p_biblioteca_v2_delete ON public.biblioteca_modelos_v2;
CREATE POLICY p_biblioteca_v2_delete ON public.biblioteca_modelos_v2
FOR DELETE USING (tenant_id = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_audit_biblioteca_v2()
RETURNS trigger AS $$
DECLARE
  v_action text;
  v_record jsonb;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_record := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_record := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_record := to_jsonb(OLD);
  END IF;

  INSERT INTO public.security_audit_log (user_id, event_type, event_description, metadata)
  VALUES (
    auth.uid(), 
    'biblioteca_v2_' || v_action, 
    'Biblioteca V2: ' || v_action || ' - ' || coalesce(NEW.titulo, OLD.titulo),
    jsonb_build_object(
      'modelo_id', coalesce(NEW.id, OLD.id),
      'tenant_id', coalesce(NEW.tenant_id, OLD.tenant_id),
      'details', v_record
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_biblioteca_v2 ON public.biblioteca_modelos_v2;
CREATE TRIGGER trg_audit_biblioteca_v2
AFTER INSERT OR UPDATE OR DELETE ON public.biblioteca_modelos_v2
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_biblioteca_v2();

CREATE OR REPLACE VIEW public.vw_biblioteca_grid AS
SELECT
  m.id,
  m.titulo,
  m.descricao,
  m.data_criacao,
  m.data_atualizacao,
  m.criado_por,
  m.atualizado_por,
  m.tenant_id,
  COALESCE(string_agg(DISTINCT e.nome, ', ' ORDER BY e.nome), '') AS etiquetas
FROM public.biblioteca_modelos_v2 m
LEFT JOIN public.etiqueta_vinculos ev
  ON m.id::text = ev.referencia_id::text AND ev.referencia_tipo = 'biblioteca'
LEFT JOIN public.etiquetas e
  ON e.id::text = ev.etiqueta_id::text
WHERE m.data_exclusao_logica IS NULL
GROUP BY m.id, m.titulo, m.descricao, m.data_criacao, m.data_atualizacao, m.criado_por, m.atualizado_por, m.tenant_id;

COMMENT ON VIEW public.vw_biblioteca_grid IS 'Grid otimizada da Biblioteca V2 com etiquetas agregadas.';

CREATE OR REPLACE FUNCTION public.sp_biblioteca_set_etiquetas(p_modelo_id uuid, p_nomes text[])
RETURNS void AS $$
DECLARE
  v_tenant uuid := auth.uid();
  v_nome text;
  v_etiqueta_id uuid;
BEGIN
  DELETE FROM public.etiqueta_vinculos
   WHERE referencia_tipo = 'biblioteca' AND referencia_id = p_modelo_id::text;

  FOREACH v_nome IN ARRAY p_nomes LOOP
    v_nome := trim(v_nome);
    IF v_nome IS NULL OR v_nome = '' THEN CONTINUE; END IF;

    SELECT id INTO v_etiqueta_id
      FROM public.etiquetas
     WHERE user_id = v_tenant AND lower(nome) = lower(v_nome)
     LIMIT 1;

    IF v_etiqueta_id IS NULL THEN
      INSERT INTO public.etiquetas (id, user_id, nome, slug, criado_em, ativa)
      VALUES (gen_random_uuid(), v_tenant, v_nome, lower(regexp_replace(v_nome, '[^a-zA-Z0-9]+', '-', 'g')), now(), true)
      RETURNING id INTO v_etiqueta_id;
    END IF;

    INSERT INTO public.etiqueta_vinculos (id, user_id, etiqueta_id, referencia_tipo, referencia_id, created_at)
    VALUES (gen_random_uuid(), v_tenant, v_etiqueta_id, 'biblioteca', p_modelo_id::text, now());
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF to_regclass('public.biblioteca_modelos') IS NOT NULL THEN
    DROP TABLE public.biblioteca_modelos CASCADE;
  END IF;

  IF to_regclass('public.biblioteca_grupos') IS NOT NULL THEN
    DROP TABLE public.biblioteca_grupos CASCADE;
  END IF;
END$$;