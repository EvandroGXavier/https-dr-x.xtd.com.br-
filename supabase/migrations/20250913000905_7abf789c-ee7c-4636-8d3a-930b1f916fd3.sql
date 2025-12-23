-- Corrigir RLS e estrutura para contatos_v2
-- Adicionar feature flag para os fixes
-- Corrigir estrutura de contatos_v2 e meios de contato

-- Garantir que contatos_v2 tem a estrutura correta
ALTER TABLE public.contatos_v2 
ADD COLUMN IF NOT EXISTS tipo_pessoa text CHECK (tipo_pessoa IN ('pf', 'pj', 'lead'));

-- Índices únicos condicionais por tenant_id para evitar conflitos
CREATE UNIQUE INDEX IF NOT EXISTS uq_contatos_v2_cpf_tenant
ON public.contatos_v2(user_id, cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND tipo_pessoa = 'pf';

CREATE UNIQUE INDEX IF NOT EXISTS uq_contatos_v2_cnpj_tenant
ON public.contatos_v2(user_id, cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND tipo_pessoa = 'pj';

-- Trigger para determinar tipo_pessoa automaticamente baseado no cpf_cnpj
CREATE OR REPLACE FUNCTION public.set_tipo_pessoa_contatos_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Determinar tipo_pessoa baseado no cpf_cnpj
  IF NEW.cpf_cnpj IS NOT NULL THEN
    -- Remove caracteres não numéricos
    DECLARE
      digits_only text := regexp_replace(NEW.cpf_cnpj, '[^0-9]', '', 'g');
    BEGIN
      CASE length(digits_only)
        WHEN 11 THEN NEW.tipo_pessoa := 'pf';
        WHEN 14 THEN NEW.tipo_pessoa := 'pj';
        ELSE NEW.tipo_pessoa := 'lead';
      END CASE;
    END;
  ELSE
    -- Se não tem CPF/CNPJ, é lead
    NEW.tipo_pessoa := COALESCE(NEW.tipo_pessoa, 'lead');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tipo_pessoa ON public.contatos_v2;
CREATE TRIGGER trigger_set_tipo_pessoa
  BEFORE INSERT OR UPDATE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.set_tipo_pessoa_contatos_v2();

-- Garantir estrutura da tabela de meios de contato com tenant_id corrigido
-- A tabela já existe mas vamos garantir compatibilidade
ALTER TABLE public.contato_meios_contato 
ADD COLUMN IF NOT EXISTS tenant_id uuid;

-- Função para preencher tenant_id ausente nos meios de contato
UPDATE public.contato_meios_contato 
SET tenant_id = (
  SELECT user_id FROM public.contatos_v2 
  WHERE id = contato_meios_contato.contato_id
)
WHERE tenant_id IS NULL;

-- Adicionar constraint NOT NULL após preencher os dados
ALTER TABLE public.contato_meios_contato 
ALTER COLUMN tenant_id SET NOT NULL;