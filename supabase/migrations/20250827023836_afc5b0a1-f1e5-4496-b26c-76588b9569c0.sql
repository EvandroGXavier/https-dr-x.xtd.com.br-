-- Função para criar etiquetas padrão automaticamente
CREATE OR REPLACE FUNCTION public.create_default_legal_tags(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  tag_exists boolean;
BEGIN
  -- Apenas criar se o usuário não tem nenhuma etiqueta de área do direito
  SELECT EXISTS (
    SELECT 1 FROM public.etiquetas 
    WHERE user_id = user_id_param 
      AND (nome ILIKE '%direito%' OR descricao ILIKE '%Área do Direito%')
  ) INTO tag_exists;
  
  IF NOT tag_exists THEN
    -- Criar etiquetas padrão
    INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) VALUES
    ('Direito Civil', 'direito-civil', '#3B82F6', '⚖️', 'Área do Direito - Direito Civil', user_id_param, true),
    ('Direito Penal', 'direito-penal', '#DC2626', '🚔', 'Área do Direito - Direito Penal', user_id_param, true),
    ('Direito Trabalhista', 'direito-trabalhista', '#059669', '👷', 'Área do Direito - Direito Trabalhista', user_id_param, true),
    ('Direito Tributário', 'direito-tributario', '#7C3AED', '💰', 'Área do Direito - Direito Tributário', user_id_param, true),
    ('Direito Empresarial', 'direito-empresarial', '#EA580C', '🏢', 'Área do Direito - Direito Empresarial', user_id_param, true),
    ('Direito Imobiliário', 'direito-imobiliario', '#0891B2', '🏠', 'Área do Direito - Direito Imobiliário', user_id_param, true),
    ('Direito de Família', 'direito-familia', '#EC4899', '👨‍👩‍👧‍👦', 'Área do Direito - Direito de Família', user_id_param, true),
    ('Direito Previdenciário', 'direito-previdenciario', '#16A34A', '🏥', 'Área do Direito - Direito Previdenciário', user_id_param, true),
    ('Direito do Consumidor', 'direito-consumidor', '#F59E0B', '🛒', 'Área do Direito - Direito do Consumidor', user_id_param, true),
    ('Direito Administrativo', 'direito-administrativo', '#6366F1', '🏛️', 'Área do Direito - Direito Administrativo', user_id_param, true),
    ('Direito Digital', 'direito-digital', '#06B6D4', '💻', 'Área do Direito - Direito Digital', user_id_param, true),
    ('Direito Ambiental', 'direito-ambiental', '#22C55E', '🌱', 'Área do Direito - Direito Ambiental', user_id_param, true);
  END IF;
END;
$function$;

-- Trigger para criar etiquetas automaticamente quando um novo usuário é criado
CREATE OR REPLACE FUNCTION public.create_default_tags_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar etiquetas padrão para o novo usuário
  PERFORM public.create_default_legal_tags(NEW.user_id);
  RETURN NEW;
END;
$function$;

-- Remover trigger anterior se existir e criar novo
DROP TRIGGER IF EXISTS trigger_create_default_tags ON public.profiles;
CREATE TRIGGER trigger_create_default_tags
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_tags_for_new_user();