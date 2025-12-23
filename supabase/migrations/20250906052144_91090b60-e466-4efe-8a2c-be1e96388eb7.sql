-- Padronizar empresa_id e filial_id como integer em todas as tabelas de contato
-- Primeiro para contato_pf
ALTER TABLE public.contato_pf 
ALTER COLUMN empresa_id TYPE integer USING empresa_id::text::integer,
ALTER COLUMN filial_id TYPE integer USING filial_id::text::integer;

-- Depois para contato_vinculos (já permite NULL)
ALTER TABLE public.contato_vinculos 
ALTER COLUMN empresa_id TYPE integer USING empresa_id::text::integer,
ALTER COLUMN filial_id TYPE integer USING filial_id::text::integer;