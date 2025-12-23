-- Fix contato_enderecos table structure to allow nullable empresa_id and filial_id
-- and add proper default values for required fields

-- First, alter the columns to allow NULL values
ALTER TABLE public.contato_enderecos 
  ALTER COLUMN empresa_id DROP NOT NULL,
  ALTER COLUMN filial_id DROP NOT NULL;

-- Set default values for tipo field
ALTER TABLE public.contato_enderecos 
  ALTER COLUMN tipo SET DEFAULT 'Principal';