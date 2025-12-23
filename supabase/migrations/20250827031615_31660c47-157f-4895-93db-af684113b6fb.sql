-- Remover trigger que está causando loop na criação de etiquetas
DROP TRIGGER IF EXISTS trigger_create_default_tags ON public.profiles;

-- Remover função que estava sendo chamada pelo trigger
DROP FUNCTION IF EXISTS public.create_default_tags_for_new_user();