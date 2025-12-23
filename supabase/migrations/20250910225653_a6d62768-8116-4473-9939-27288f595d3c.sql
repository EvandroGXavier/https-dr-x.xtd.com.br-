-- Corrigir vínculos para usar 'contatos' como tipo padrão e ajustar campos obrigatórios

-- 1. Padronizar tipos de vínculos para 'contatos'
UPDATE public.etiqueta_vinculos 
SET referencia_tipo = 'contatos' 
WHERE referencia_tipo IN ('contato', 'contatos_v2');

UPDATE public.documento_vinculos 
SET vinculo_tipo = 'contatos' 
WHERE vinculo_tipo IN ('contato', 'contatos_v2');

-- 2. Garantir que contato_meios_contato tenha campos obrigatórios corretos
-- Verificar e ajustar constraint de empresa_id e filial_id para permitir NULL
ALTER TABLE public.contato_meios_contato 
ALTER COLUMN empresa_id DROP NOT NULL;

ALTER TABLE public.contato_meios_contato 
ALTER COLUMN filial_id DROP NOT NULL;

-- 3. Criar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_contato_meios_contato_contato_id 
ON public.contato_meios_contato(contato_id);

CREATE INDEX IF NOT EXISTS idx_contato_meios_contato_tipo 
ON public.contato_meios_contato(tipo);

CREATE INDEX IF NOT EXISTS idx_contato_meios_contato_principal 
ON public.contato_meios_contato(principal);

-- 4. Log da migração de padronização
INSERT INTO public.security_audit_log (
  event_type, 
  event_description, 
  metadata
) VALUES (
  'migration_contatos_v2_fixes',
  'Corrigidos vínculos e campos obrigatórios para contatos V2',
  jsonb_build_object(
    'padronized_etiqueta_vinculos', true,
    'padronized_documento_vinculos', true,
    'fixed_contato_meios_contato_constraints', true,
    'created_indexes', true
  )
);