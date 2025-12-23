-- Migração de compatibilidade para contatos v2
-- 1. Criar VIEW de compatibilidade para chamadas legadas
CREATE OR REPLACE VIEW public.contatos 
WITH (security_invoker = on) AS
SELECT
  c.id,
  c.user_id,
  c.empresa_id,
  c.filial_id,
  c.nome_fantasia as nome,
  c.tipo_pessoa,
  c.cpf_cnpj,
  c.email,
  c.celular,
  c.telefone,
  c.ativo,
  c.observacao,
  c.created_at,
  c.updated_at
FROM public.contatos_v2 c;

-- 2. Padronizar tipos lógicos nos vínculos - etiquetas
UPDATE public.etiqueta_vinculos 
SET referencia_tipo = 'contatos'
WHERE referencia_tipo IN ('contato', 'contatos_v2');

-- 3. Verificar se existe tabela documento_vinculos e padronizar
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documento_vinculos') THEN
    UPDATE public.documento_vinculos 
    SET vinculo_tipo = 'contatos'
    WHERE vinculo_tipo IN ('contato', 'contatos_v2');
  END IF;
END $$;

-- 4. Criar índices para performance nos vínculos se não existirem
CREATE INDEX IF NOT EXISTS idx_etiqueta_vinculos_contatos 
ON public.etiqueta_vinculos (referencia_tipo, referencia_id) 
WHERE referencia_tipo = 'contatos';

-- 5. Log da migração em bloco separado
DO $$
BEGIN
  PERFORM public.log_security_event(
    'contatos_v2_migration',
    'Compatibilidade VIEW criada e vínculos padronizados',
    jsonb_build_object(
      'view_created', 'public.contatos',
      'vinculos_updated', 'etiqueta_vinculos',
      'migration_timestamp', now()
    )
  );
END $$;