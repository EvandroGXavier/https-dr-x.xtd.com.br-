-- Dropar VIEWs existentes e criar corretamente
DROP VIEW IF EXISTS public.vw_contatos_compat CASCADE;
DROP VIEW IF EXISTS public.vw_contas_compat CASCADE;

-- 1) VIEW de compatibilidade de Contatos (corrigida)
CREATE OR REPLACE VIEW public.vw_contatos_compat AS
SELECT 
  c.id::uuid                                            as id,
  c.nome_fantasia                                       as nome,
  c.cpf_cnpj                                            as documento,
  coalesce(c.celular, c.telefone)                       as telefone,
  c.email                                               as email,
  c.user_id                                             as tenant_id
FROM public.contatos_v2 c;

REVOKE ALL ON public.vw_contatos_compat FROM public;
GRANT SELECT ON public.vw_contatos_compat TO authenticated;

-- 2) VIEW de compatibilidade de Contas Financeiras
CREATE OR REPLACE VIEW public.vw_contas_compat AS
SELECT 
  cf.id::uuid        as id,
  cf.nome            as nome,
  cf.tipo            as tipo,
  cf.banco           as banco,
  cf.agencia         as agencia,
  cf.conta           as conta,
  cf.user_id         as tenant_id
FROM public.contas_financeiras cf;

REVOKE ALL ON public.vw_contas_compat FROM public;
GRANT SELECT ON public.vw_contas_compat TO authenticated;

-- 3) Trigger para preencher user_id quando vier nulo (inserção de financeiro)
CREATE OR REPLACE FUNCTION public.fn_fill_user_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END $$;

-- Criar trigger se não existir
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transacoes_financeiras') THEN
    -- Dropar trigger se existir e recriar
    DROP TRIGGER IF EXISTS tr_transacoes_financeiras_fill_user ON public.transacoes_financeiras;
    
    CREATE TRIGGER tr_transacoes_financeiras_fill_user
    BEFORE INSERT ON public.transacoes_financeiras
    FOR EACH ROW EXECUTE FUNCTION public.fn_fill_user_id();
  END IF;
END $$;