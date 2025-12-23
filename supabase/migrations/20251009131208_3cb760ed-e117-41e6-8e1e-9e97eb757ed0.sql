-- Corrigir tipos de dados na tabela contato_pj
-- O erro "value too long for type character varying(0)" indica campos com tamanho 0

ALTER TABLE public.contato_pj
  ALTER COLUMN cnpj TYPE text,
  ALTER COLUMN razao_social TYPE text,
  ALTER COLUMN nome_fantasia TYPE text,
  ALTER COLUMN porte TYPE text,
  ALTER COLUMN natureza_juridica TYPE text,
  ALTER COLUMN regime_tributario TYPE text,
  ALTER COLUMN situacao_cadastral TYPE text,
  ALTER COLUMN cnae_principal TYPE text,
  ALTER COLUMN situacao_motivo TYPE text,
  ALTER COLUMN matriz_filial TYPE text,
  ALTER COLUMN municipio_ibge TYPE text,
  ALTER COLUMN ddd_1 TYPE text,
  ALTER COLUMN telefone_1 TYPE text,
  ALTER COLUMN ddd_2 TYPE text,
  ALTER COLUMN telefone_2 TYPE text,
  ALTER COLUMN origem_dados TYPE text;

-- Garantir que cnaes_secundarios seja text[]
ALTER TABLE public.contato_pj
  ALTER COLUMN cnaes_secundarios TYPE text[] USING cnaes_secundarios::text[];