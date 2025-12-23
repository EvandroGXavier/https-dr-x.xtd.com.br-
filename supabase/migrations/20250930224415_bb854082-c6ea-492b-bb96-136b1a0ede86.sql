-- Adicionar coluna pf_obs na tabela contato_pf
ALTER TABLE public.contato_pf
ADD COLUMN pf_obs TEXT;

COMMENT ON COLUMN public.contato_pf.pf_obs IS 'Observações gerais sobre a pessoa física, como dados de passaporte, certidão de óbito, ou outras informações atípicas relevantes.';