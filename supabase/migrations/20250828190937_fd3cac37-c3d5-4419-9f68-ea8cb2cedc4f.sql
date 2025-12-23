-- Criar enum para papel das partes
CREATE TYPE IF NOT EXISTS papel_parte AS ENUM ('cliente', 'parte_contraria', 'testemunha', 'advogado', 'juizo', 'outro');

-- Criar enum para origem dos anexos
CREATE TYPE IF NOT EXISTS origem_anexo AS ENUM ('processo', 'contato');

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

-- Criar tabela processo_partes se não existir
CREATE TABLE IF NOT EXISTS public.processo_partes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  contato_id uuid NOT NULL REFERENCES public.contatos(id) ON DELETE CASCADE,
  papel papel_parte NOT NULL DEFAULT 'cliente',
  observacao text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  
  -- Evitar duplicatas de mesmo contato com mesmo papel no mesmo processo
  UNIQUE(processo_id, contato_id, papel)
);

-- Habilitar RLS na tabela processo_partes
ALTER TABLE public.processo_partes ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para processo_partes
CREATE POLICY "Users can view their own processo_partes" ON public.processo_partes
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own processo_partes" ON public.processo_partes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processo_partes" ON public.processo_partes
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_partes" ON public.processo_partes
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Criar tabela processo_anexos se não existir
CREATE TABLE IF NOT EXISTS public.processo_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  contato_id uuid REFERENCES public.contatos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  arquivo_url text NOT NULL,
  origem origem_anexo NOT NULL DEFAULT 'processo',
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela processo_anexos
ALTER TABLE public.processo_anexos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para processo_anexos
CREATE POLICY "Users can view their own processo_anexos" ON public.processo_anexos
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own processo_anexos" ON public.processo_anexos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processo_anexos" ON public.processo_anexos
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_anexos" ON public.processo_anexos
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Criar tabela processo_honorarios se não existir
CREATE TABLE IF NOT EXISTS public.processo_honorarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL UNIQUE REFERENCES public.processos(id) ON DELETE CASCADE,
  causa_valor numeric(15,2),
  recebido_valor numeric(15,2),
  inicial_valor numeric(15,2),
  inicial_forma_pagamento text,
  inicial_obs text,
  mensal_valor numeric(15,2),
  mensal_forma_pagamento text,
  mensal_obs text,
  exito_percentual numeric(5,2),
  exito_forma_pagamento text,
  exito_obs text,
  sucumbencia_valor numeric(15,2),
  sucumbencia_forma_pagamento text,
  sucumbencia_obs text,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS na tabela processo_honorarios
ALTER TABLE public.processo_honorarios ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para processo_honorarios
CREATE POLICY "Users can view their own processo_honorarios" ON public.processo_honorarios
  FOR SELECT USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own processo_honorarios" ON public.processo_honorarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own processo_honorarios" ON public.processo_honorarios
  FOR UPDATE USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own processo_honorarios" ON public.processo_honorarios
  FOR DELETE USING (auth.uid() = user_id OR has_role('admin'));

-- Trigger para updated_at em processo_honorarios
CREATE OR REPLACE FUNCTION update_processo_honorarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_processo_honorarios_updated_at
  BEFORE UPDATE ON public.processo_honorarios
  FOR EACH ROW
  EXECUTE FUNCTION update_processo_honorarios_updated_at();

-- Criar view para anexos consolidados
CREATE OR REPLACE VIEW public.vw_processo_anexos_consolidados AS
SELECT 
  pa.processo_id,
  pa.id as anexo_id,
  pa.titulo,
  pa.arquivo_url,
  pa.origem,
  pa.contato_id,
  c.nome as contato_nome,
  pa.created_at
FROM public.processo_anexos pa
LEFT JOIN public.contatos c ON pa.contato_id = c.id
WHERE pa.origem = 'processo'

UNION ALL

SELECT 
  pp.processo_id,
  ca.id as anexo_id,
  ca.arquivo_nome_original as titulo,
  ca.arquivo_caminho as arquivo_url,
  'contato'::origem_anexo as origem,
  ca.contato_id,
  c.nome as contato_nome,
  ca.created_at
FROM public.processo_partes pp
JOIN public.contato_anexo ca ON pp.contato_id = ca.contato_id
JOIN public.contatos c ON ca.contato_id = c.id
WHERE ca.deleted_at IS NULL;

-- Função para validar processo por etiqueta
CREATE OR REPLACE FUNCTION public.validate_processo_by_etiqueta(
  p_etiqueta etiqueta_processo,
  p_numero_processo text,
  p_cliente_principal_id uuid,
  p_titulo text
) RETURNS jsonb AS $$
DECLARE
  errors text[] := '{}';
BEGIN
  -- Validações por etiqueta
  CASE p_etiqueta
    WHEN 'judicial' THEN
      IF p_numero_processo IS NULL OR p_numero_processo = '' THEN
        errors := array_append(errors, 'Número do processo é obrigatório para processos judiciais');
      END IF;
      IF p_cliente_principal_id IS NULL THEN
        errors := array_append(errors, 'Cliente principal é obrigatório para processos judiciais');
      END IF;
      IF p_titulo IS NULL OR p_titulo = '' THEN
        errors := array_append(errors, 'Título é obrigatório para processos judiciais');
      END IF;
    
    WHEN 'extrajudicial' THEN
      IF p_cliente_principal_id IS NULL THEN
        errors := array_append(errors, 'Cliente principal é obrigatório para processos extrajudiciais');
      END IF;
      IF p_titulo IS NULL OR p_titulo = '' THEN
        errors := array_append(errors, 'Título é obrigatório para processos extrajudiciais');
      END IF;
    
    WHEN 'administrativo', 'interno' THEN
      IF p_titulo IS NULL OR p_titulo = '' THEN
        errors := array_append(errors, 'Título é obrigatório');
      END IF;
  END CASE;
  
  RETURN jsonb_build_object(
    'valid', array_length(errors, 1) IS NULL,
    'errors', to_jsonb(errors)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;