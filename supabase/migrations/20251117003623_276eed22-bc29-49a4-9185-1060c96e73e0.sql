-- Inicia uma transação segura. Se algo falhar, tudo é revertido.
BEGIN;

----------------------------------------------------------------
-- FASE 0: PADRONIZAÇÃO DE TABELAS (NÃO-DESTRUTIVO)
-- Garante que os campos "Básicos" (Hierarquia e Auditoria) existam.
----------------------------------------------------------------

-- 0.1: Garante a função de trigger para 'updated_at' (Padrão de Qualidade)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 0.2: Padroniza 'profiles' (deve conter a hierarquia do usuário)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS filial_id uuid;

-- 0.3: Padroniza 'processos' (deve conter a hierarquia e auditoria)
ALTER TABLE public.processos
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS empresa_id uuid,
  ADD COLUMN IF NOT EXISTS filial_id uuid,
  ADD COLUMN IF NOT EXISTS user_id uuid, -- 'user_id' aqui é o 'actor' (quem criou)
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 0.4: Aplica o trigger 'updated_at' na tabela 'processos' (se ainda não existir)
DROP TRIGGER IF EXISTS on_processos_updated ON public.processos;
CREATE TRIGGER on_processos_updated
  BEFORE UPDATE ON public.processos
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 0.5: Cria a tabela de 'auditoria' (se não existir) - (Conforme PROMPT_MASTER_BASE.md)
CREATE TABLE IF NOT EXISTS public.auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,        -- 'create', 'update', 'delete', 'login', 'invite'
  module text NOT NULL,        -- 'processos', 'agenda', 'auth'
  target_id uuid,              -- ID do registro afetado (ex: processo.id)
  details jsonb,               -- Opcional: 'diff' ou 'snapshot'
  ip_address inet,             -- Opcional
  "timestamp" timestamptz NOT NULL DEFAULT now()
);

-- 0.6: Habilita RLS na tabela de auditoria (segurança)
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RLS: Admin pode ler tudo" ON public.auditoria;
CREATE POLICY "RLS: Admin pode ler tudo" ON public.auditoria FOR SELECT USING (true);
DROP POLICY IF EXISTS "RLS: Usuário pode inserir seu próprio log" ON public.auditoria;
CREATE POLICY "RLS: Usuário pode inserir seu próprio log" ON public.auditoria FOR INSERT WITH CHECK (actor_id = auth.uid() AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);


----------------------------------------------------------------
-- FASE 1: TIPO DE RETORNO DO CONTEXTO (HELPER)
----------------------------------------------------------------

-- (Garantir que não exista antes de criar)
DROP TYPE IF EXISTS public.contexto_seguranca CASCADE;

CREATE TYPE public.contexto_seguranca AS (
  tenant_id uuid,
  empresa_id uuid,
  filial_id uuid,
  user_id uuid
);


----------------------------------------------------------------
-- FASE 2: FUNÇÃO "BÁSICA" (HELPER DE SEGURANÇA)
-- Pega o contexto do token/perfil e VALIDA.
----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_contexto_seguranca()
RETURNS public.contexto_seguranca
LANGUAGE plpgsql
SECURITY DEFINER -- Essencial para acessar 'profiles' com privilégios
STABLE
SET search_path = public
AS $$
DECLARE
  v_contexto public.contexto_seguranca;
BEGIN
  -- 1. Pega IDs do token de autenticação (Fonte da Verdade)
  v_contexto.tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
  v_contexto.user_id := auth.uid();

  -- 2. TRAVA IMEDIATA: Se o token for inválido ou não tiver tenant.
  IF v_contexto.tenant_id IS NULL OR v_contexto.user_id IS NULL THEN
    RAISE EXCEPTION 'Contexto de segurança inválido (token). Ação bloqueada.';
  END IF;

  -- 3. Busca hierarquia no perfil do usuário
  SELECT empresa_id, filial_id
  INTO v_contexto.empresa_id, v_contexto.filial_id
  FROM public.profiles
  WHERE id = v_contexto.user_id
  AND tenant_id = v_contexto.tenant_id;

  -- 4. TRAVA DE PERFIL: (Como concordamos) Se o usuário não tiver hierarquia, NADA FUNCIONA.
  IF v_contexto.empresa_id IS NULL OR v_contexto.filial_id IS NULL THEN
    RAISE EXCEPTION 'Perfil de usuário incompleto. (empresa_id ou filial_id não definidos). Ação bloqueada.';
  END IF;

  RETURN v_contexto;
END;
$$;


----------------------------------------------------------------
-- FASE 3: FUNÇÃO "COMPLEMENTAR" (RPC) - MÓDULO PROCESSOS
-- Reutiliza o 'básico' e adiciona o 'complementar' (regras de negócio).
----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.criar_processo_v1(
  dados_complementares JSONB
)
RETURNS uuid -- Retorna o ID do novo processo criado
LANGUAGE plpgsql
SECURITY DEFINER -- Essencial para RLS e Auditoria
SET search_path = public
AS $$
DECLARE
  -- 1. Obter o "Básico" (Helper)
  v_contexto public.contexto_seguranca := public.get_contexto_seguranca();
  
  -- 2. Definir o "Complementar" (Campos específicos do módulo)
  v_numero_cnj TEXT;
  v_novo_processo_id uuid;
BEGIN
  -- 3. Validação de Negócio (Lógica complementar)
  v_numero_cnj := dados_complementares ->> 'numero_cnj';
  
  IF v_numero_cnj IS NULL OR length(v_numero_cnj) < 5 THEN
    RAISE EXCEPTION 'O campo "numero_cnj" é obrigatório e deve ser válido.';
  END IF;
  
  -- 4. O INSERT SEGURO (SQL Estático)
  INSERT INTO public.processos (
    -- Campos "Básicos" (da Hierarquia e Auditoria)
    tenant_id,
    empresa_id,
    filial_id,
    user_id,
    
    -- Campos "Complementares" (do JSON)
    numero_cnj,
    dados -- Coluna 'dados' (jsonb) para guardar o resto
  )
  VALUES (
    -- Do Helper
    v_contexto.tenant_id,
    v_contexto.empresa_id,
    v_contexto.filial_id,
    v_contexto.user_id,
    
    -- Desta função
    v_numero_cnj,
    dados_complementares
  )
  RETURNING id INTO v_novo_processo_id;

  -- 5. AUDITORIA CENTRALIZADA (Obrigatório pelo PROMPT)
  INSERT INTO public.auditoria 
    (actor_id, tenant_id, action, module, target_id, details)
  VALUES 
    (
      v_contexto.user_id, 
      v_contexto.tenant_id, 
      'create',             -- Ação
      'processos',          -- Módulo
      v_novo_processo_id,   -- Alvo
      jsonb_build_object('numero_cnj', v_numero_cnj) -- Detalhes
    );

  RETURN v_novo_processo_id;
  
END;
$$;


----------------------------------------------------------------
-- FASE 4: "TRAVA" DE SEGURANÇA E HABILITAÇÃO DA RPC
-- Resolve o problema original: Impede o 'INSERT' direto.
----------------------------------------------------------------

-- 4.1: REVOGA permissões de escrita direta (INSERT/UPDATE) para o frontend.
-- O usuário 'authenticated' (frontend) NÃO PODE mais dar INSERT direto.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.processos FROM authenticated, anon;

-- 4.2: GARANTE permissões de leitura (SELECT).
GRANT SELECT ON TABLE public.processos TO authenticated;

-- 4.3: CONCEDE permissão para o frontend EXECUTAR a nova função.
-- Esta é a única forma de criar um processo agora.
GRANT EXECUTE ON FUNCTION public.criar_processo_v1(JSONB) TO authenticated;

-- 4.4: Habilita RLS na tabela (se já não estiver)
ALTER TABLE public.processos ENABLE ROW LEVEL SECURITY;

-- 4.5: Cria a Política de Leitura (SELECT) baseada na hierarquia
DROP POLICY IF EXISTS "RLS: Usuários leem processos da sua filial" ON public.processos;
CREATE POLICY "RLS: Usuários leem processos da sua filial"
  ON public.processos
  FOR SELECT
  TO authenticated
  USING (
    -- Trava 1: O tenant_id do registro DEVE ser o do token.
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid 
    AND
    -- Trava 2: A filial_id do registro DEVE ser a mesma do perfil do usuário.
    filial_id = (SELECT filial_id FROM public.profiles WHERE id = auth.uid())
  );

-- Finaliza a transação
COMMIT;