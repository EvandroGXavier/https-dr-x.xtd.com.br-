-- 1) Adicionar observacao na tabela contatos existente
ALTER TABLE public.contatos
  ADD COLUMN IF NOT EXISTS observacao text;

-- Índice otimizado para busca
CREATE INDEX IF NOT EXISTS idx_contatos_busca
  ON public.contatos (empresa_id, filial_id, lower(nome), cpf_cnpj, lower(email), celular);

-- 2) Tabela Pessoa Física (1-1 com contatos)
CREATE TABLE IF NOT EXISTS public.contato_pf (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  nome_completo text,
  cpf varchar(14), -- espelhado da aba Contato
  rg varchar(20),
  orgao_expedidor varchar(20),
  estado_civil varchar(20),
  sexo varchar(10),
  data_nascimento date,
  nacionalidade varchar(60),
  naturalidade varchar(60),
  profissao varchar(80),
  renda numeric(14,2),
  emprego varchar(20), -- CTPS | Autônomo | MEI | ...
  ctps varchar(30),
  cnis varchar(30),
  pis varchar(30),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contato_id)
);

-- 3) Tabela Pessoa Jurídica (1-1 com contatos)
CREATE TABLE IF NOT EXISTS public.contato_pj (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  cnpj varchar(18), -- espelhado da aba Contato
  razao_social text,
  nome_fantasia text, -- espelho
  natureza_juridica text,
  porte text,
  data_abertura date,
  regime_tributario text,
  cnae_principal varchar(10),
  cnaes_secundarios text[],
  capital_social numeric(16,2),
  situacao_cadastral text,
  situacao_data date,
  situacao_motivo text,
  matriz_filial varchar(10),
  municipio_ibge varchar(10),
  ddd_1 varchar(3),
  telefone_1 varchar(20),
  ddd_2 varchar(3),
  telefone_2 varchar(20),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contato_id)
);

-- 4) Tabela Endereços (1-N com contatos)
CREATE TABLE IF NOT EXISTS public.contato_enderecos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  tipo varchar(20), -- Principal | Residencial | Cobrança | Comercial | Outro
  cep varchar(9),
  logradouro text,
  numero varchar(20),
  complemento text,
  bairro text,
  cidade text,
  uf char(2),
  ibge varchar(10),
  principal boolean DEFAULT false,
  latitude numeric(9,6),
  longitude numeric(9,6),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enderecos_principal
  ON public.contato_enderecos (contato_id) WHERE principal = true;

-- 5) Tabela Meios de Contato (1-N)
CREATE TABLE IF NOT EXISTS public.contato_meios_contato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  tipo varchar(20), -- Telefone | Email | Site | WhatsApp | Telegram | Outro
  valor text NOT NULL,
  observacao text,
  principal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Tabela Vínculos entre contatos (N-N)
CREATE TABLE IF NOT EXISTS public.contato_vinculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  vinculado_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE RESTRICT,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  tipo_vinculo varchar(30) NOT NULL, -- conjuge, pai, mae, socio, etc.
  bidirecional boolean DEFAULT true,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contato_id, vinculado_id, tipo_vinculo)
);

-- 7) Tabela Documentos gerados do contato (1-N)
CREATE TABLE IF NOT EXISTS public.contato_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  modelo_id uuid NOT NULL, -- da biblioteca de modelos
  documento_id uuid NOT NULL, -- id do documento gerado
  versao integer NOT NULL DEFAULT 1,
  compartilhar_com_cliente boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contato_documentos
  ON public.contato_documentos (contato_id, empresa_id, filial_id);

-- 8) Tabela Configuração Financeira/ADM (1-1 por contato)
CREATE TABLE IF NOT EXISTS public.contato_financeiro_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  empresa_id uuid NOT NULL,
  filial_id uuid NOT NULL,
  limite_credito numeric(16,2),
  validade_limite date,
  forma_pagamento_padrao text,
  banco varchar(60),
  agencia varchar(20),
  conta varchar(30),
  pix_tipo varchar(20),
  pix_chave text,
  observacao text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(contato_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.contato_pf ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_pj ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_enderecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_meios_contato ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_financeiro_config ENABLE ROW LEVEL SECURITY;