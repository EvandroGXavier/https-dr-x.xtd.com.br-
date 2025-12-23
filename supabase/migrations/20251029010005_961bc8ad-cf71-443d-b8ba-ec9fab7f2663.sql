-- Corrigir outras funções e triggers que ainda usam current_empresa_uuid/current_filial_uuid

-- 1. Corrigir função create_configuracao_usuario
CREATE OR REPLACE FUNCTION public.create_configuracao_usuario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.configuracoes (chave, valor, tenant_id, created_at, updated_at) VALUES
    ('theme', 'dark', NEW.empresa_id, NOW(), NOW()),
    ('notifications', 'true', NEW.empresa_id, NOW(), NOW()),
    ('language', 'pt-BR', NEW.empresa_id, NOW(), NOW());
  RETURN NEW;
END;
$$;

-- 2. Corrigir função setup_new_user
CREATE OR REPLACE FUNCTION public.setup_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.configuracoes (chave, valor, tenant_id, created_at, updated_at) VALUES
    ('prazo_padrao_agenda', '30', NEW.empresa_id, NOW(), NOW()),
    ('lembrete_padrao_agenda', '15', NEW.empresa_id, NOW(), NOW()),
    ('unidade_tempo_agenda', 'minutos', NEW.empresa_id, NOW(), NOW());
  RETURN NEW;
END;
$$;

-- 3. Corrigir o backfill que usa current_filial_uuid
UPDATE public.contatos_v2 c
SET 
  filial_id = COALESCE(c.filial_id, p.filial_id),
  updated_at = now()
FROM public.profiles p
WHERE c.user_id = p.user_id
  AND c.filial_id IS NULL
  AND p.filial_id IS NOT NULL;