-- Criar enum para papel das partes (verificando se não existe)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'papel_parte') THEN
    CREATE TYPE papel_parte AS ENUM ('cliente', 'parte_contraria', 'testemunha', 'advogado', 'juizo', 'outro');
  END IF;
END $$;

-- Criar enum para origem dos anexos (verificando se não existe)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'origem_anexo') THEN
    CREATE TYPE origem_anexo AS ENUM ('processo', 'contato');
  END IF;
END $$;

-- Criar enum para etiqueta do processo (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'etiqueta_processo') THEN
    CREATE TYPE etiqueta_processo AS ENUM ('interno', 'administrativo', 'extrajudicial', 'judicial');
  END IF;
END $$;

-- Criar enum para situacao do processo (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'situacao_processo') THEN
    CREATE TYPE situacao_processo AS ENUM ('em_andamento', 'arquivado', 'encerrado');
  END IF;
END $$;

-- Adicionar colunas na tabela processos se não existirem
DO $$ 
BEGIN
  -- Verificar e adicionar etiqueta
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processos' AND column_name = 'etiqueta') THEN
    ALTER TABLE public.processos ADD COLUMN etiqueta etiqueta_processo DEFAULT 'interno';
  END IF;
  
  -- Verificar e adicionar cliente_principal_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processos' AND column_name = 'cliente_principal_id') THEN
    ALTER TABLE public.processos ADD COLUMN cliente_principal_id uuid REFERENCES public.contatos(id);
  END IF;
  
  -- Verificar e adicionar numero_processo
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processos' AND column_name = 'numero_processo') THEN
    ALTER TABLE public.processos ADD COLUMN numero_processo text;
  END IF;
  
  -- Verificar e adicionar situacao
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processos' AND column_name = 'situacao') THEN
    ALTER TABLE public.processos ADD COLUMN situacao situacao_processo DEFAULT 'em_andamento';
  END IF;
  
  -- Verificar e adicionar data_distribuicao
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'processos' AND column_name = 'data_distribuicao') THEN
    ALTER TABLE public.processos ADD COLUMN data_distribuicao date;
  END IF;
END $$;

-- Criar índice para cliente_principal_id se não existir
CREATE INDEX IF NOT EXISTS idx_processos_cliente_principal ON public.processos(cliente_principal_id);