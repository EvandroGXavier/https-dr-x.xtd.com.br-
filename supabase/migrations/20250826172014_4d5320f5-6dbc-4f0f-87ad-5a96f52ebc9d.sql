-- Remove constraint problemática de CPF/CNPJ que está impedindo salvamento
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'valid_cpf_cnpj_format') THEN
        ALTER TABLE public.contatos DROP CONSTRAINT valid_cpf_cnpj_format;
    END IF;
END $$;

-- Adicionar constraint mais flexível que permite valores vazios/nulos
ALTER TABLE public.contatos 
ADD CONSTRAINT valid_cpf_cnpj_format_flexible 
CHECK (
    cpf_cnpj IS NULL OR 
    cpf_cnpj = '' OR 
    LENGTH(REGEXP_REPLACE(cpf_cnpj, '[^0-9]', '', 'g')) IN (11, 14) OR
    LENGTH(cpf_cnpj) = 0
);