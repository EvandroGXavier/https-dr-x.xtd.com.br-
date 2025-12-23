-- Corrigir função para evitar duplicatas de etiquetas
CREATE OR REPLACE FUNCTION public.create_default_legal_tags(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  legal_areas text[] := ARRAY[
    'Direito Civil', 'Direito Penal', 'Direito Trabalhista', 'Direito Tributário',
    'Direito Empresarial', 'Direito Imobiliário', 'Direito de Família', 
    'Direito Previdenciário', 'Direito do Consumidor', 'Direito Administrativo',
    'Direito Digital', 'Direito Ambiental'
  ];
  area_name text;
  tag_exists boolean;
BEGIN
  -- Verificar e criar cada etiqueta individualmente
  FOREACH area_name IN ARRAY legal_areas
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM public.etiquetas 
      WHERE user_id = user_id_param AND nome = area_name
    ) INTO tag_exists;
    
    IF NOT tag_exists THEN
      INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
      VALUES (
        area_name,
        lower(replace(replace(area_name, ' ', '-'), 'ã', 'a')),
        CASE area_name
          WHEN 'Direito Civil' THEN '#3B82F6'
          WHEN 'Direito Penal' THEN '#DC2626'
          WHEN 'Direito Trabalhista' THEN '#059669'
          WHEN 'Direito Tributário' THEN '#7C3AED'
          WHEN 'Direito Empresarial' THEN '#EA580C'
          WHEN 'Direito Imobiliário' THEN '#0891B2'
          WHEN 'Direito de Família' THEN '#EC4899'
          WHEN 'Direito Previdenciário' THEN '#16A34A'
          WHEN 'Direito do Consumidor' THEN '#F59E0B'
          WHEN 'Direito Administrativo' THEN '#6366F1'
          WHEN 'Direito Digital' THEN '#06B6D4'
          WHEN 'Direito Ambiental' THEN '#22C55E'
          ELSE '#6B7280'
        END,
        CASE area_name
          WHEN 'Direito Civil' THEN '⚖️'
          WHEN 'Direito Penal' THEN '🚔'
          WHEN 'Direito Trabalhista' THEN '👷'
          WHEN 'Direito Tributário' THEN '💰'
          WHEN 'Direito Empresarial' THEN '🏢'
          WHEN 'Direito Imobiliário' THEN '🏠'
          WHEN 'Direito de Família' THEN '👨‍👩‍👧‍👦'
          WHEN 'Direito Previdenciário' THEN '🏥'
          WHEN 'Direito do Consumidor' THEN '🛒'
          WHEN 'Direito Administrativo' THEN '🏛️'
          WHEN 'Direito Digital' THEN '💻'
          WHEN 'Direito Ambiental' THEN '🌱'
          ELSE '📁'
        END,
        'Área do Direito - ' || area_name,
        user_id_param,
        true
      );
    END IF;
  END LOOP;
END;
$function$;