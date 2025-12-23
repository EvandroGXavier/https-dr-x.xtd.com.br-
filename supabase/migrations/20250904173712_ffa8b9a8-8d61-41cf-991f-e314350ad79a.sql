-- Fix numeric field overflow in contato_enderecos table
-- Adjust latitude and longitude fields to support larger precision
ALTER TABLE public.contato_enderecos 
ALTER COLUMN latitude TYPE numeric(10,8),
ALTER COLUMN longitude TYPE numeric(11,8);

-- Make sure all fields are nullable as requested by user
ALTER TABLE public.contato_enderecos 
ALTER COLUMN tipo DROP NOT NULL,
ALTER COLUMN contato_id DROP NOT NULL;

-- Add back NOT NULL constraint only for contato_id as it's needed for foreign key
ALTER TABLE public.contato_enderecos 
ALTER COLUMN contato_id SET NOT NULL;