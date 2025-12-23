-- Fix the slug generation function to not use unaccent
CREATE OR REPLACE FUNCTION public.generate_etiqueta_slug()
RETURNS TRIGGER AS $$
BEGIN
  NEW.slug = lower(
    regexp_replace(
      NEW.nome,
      '[^a-zA-Z0-9]',
      '',
      'g'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;