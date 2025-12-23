-- Make UUID fields nullable for internal processes
ALTER TABLE processos 
ALTER COLUMN cliente_principal_id DROP NOT NULL,
ALTER COLUMN advogado_responsavel_id DROP NOT NULL,
ALTER COLUMN numero_processo DROP NOT NULL;