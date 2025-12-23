-- Rename existing cnpj column to cpf_cnpj
ALTER TABLE public.contatos RENAME COLUMN cnpj TO cpf_cnpj;

-- Add all the new fields to contatos table
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS empresa_id UUID;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS filial_id UUID;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS orgao_expedidor TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS ie_rg TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS ie_isento BOOLEAN DEFAULT FALSE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS remember_token TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS etiqueta TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS web_site TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS celular TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS complemento TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS contatos TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS fone TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS fax TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS estado_civil TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS profissao TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS sexo TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS naturalidade TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS nome_pai TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS cpf_pai TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS nome_mae TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS cpf_mae TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS segmento TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS vendedor TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS email_nfe TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS limite_credito DECIMAL(15,2);
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS cliente_desde DATE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS proxima_visita DATE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS condicao_pagamento TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS regime_tributario TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS nacionalidade TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS cliente_endereco TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS email_cliente TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS nascimento_cliente DATE;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS pai_cliente TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS mae_cliente TEXT;
ALTER TABLE public.contatos ADD COLUMN IF NOT EXISTS cpf_cliente TEXT;

-- Add some useful indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contatos_cpf_cnpj ON public.contatos(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_contatos_codigo ON public.contatos(codigo);
CREATE INDEX IF NOT EXISTS idx_contatos_empresa_id ON public.contatos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_contatos_filial_id ON public.contatos(filial_id);
CREATE INDEX IF NOT EXISTS idx_contatos_ativo ON public.contatos(ativo);
CREATE INDEX IF NOT EXISTS idx_contatos_user_id ON public.contatos(user_id);

-- Add some constraints for data integrity
ALTER TABLE public.contatos ADD CONSTRAINT chk_sexo CHECK (sexo IN ('M', 'F', 'Masculino', 'Feminino', 'Outro') OR sexo IS NULL);
ALTER TABLE public.contatos ADD CONSTRAINT chk_regime_tributario CHECK (regime_tributario IN ('Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'MEI') OR regime_tributario IS NULL);

-- Comment on table for documentation
COMMENT ON TABLE public.contatos IS 'Tabela de contatos/clientes com informações completas para gestão jurídica e comercial';