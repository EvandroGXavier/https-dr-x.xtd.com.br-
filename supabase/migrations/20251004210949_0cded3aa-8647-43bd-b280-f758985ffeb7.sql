-- Criar tabelas do módulo SaaS

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.saas_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  valor_padrao numeric(10,2) NOT NULL DEFAULT 0,
  limite_usuarios integer,
  limite_filiais integer,
  ativo boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS public.saas_empresas (
  id serial PRIMARY KEY,
  uuid_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text UNIQUE,
  ativa boolean DEFAULT true,
  plano text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de filiais
CREATE TABLE IF NOT EXISTS public.saas_filiais (
  id serial PRIMARY KEY,
  uuid_id uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  empresa_id integer NOT NULL REFERENCES public.saas_empresas(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  matriz boolean DEFAULT false,
  ativa boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.saas_assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id integer NOT NULL REFERENCES public.saas_empresas(id) ON DELETE CASCADE,
  plano_id uuid REFERENCES public.saas_planos(id),
  valor_mensal numeric(10,2) NOT NULL,
  dia_vencimento integer NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'ativa',
  trial_until date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela de superadmins
CREATE TABLE IF NOT EXISTS public.saas_superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.saas_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_filiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_superadmins ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas superadmins podem acessar
CREATE POLICY "Superadmins can manage planos" ON public.saas_planos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.saas_superadmins WHERE email = get_current_user_email())
  );

CREATE POLICY "Superadmins can manage empresas" ON public.saas_empresas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.saas_superadmins WHERE email = get_current_user_email())
  );

CREATE POLICY "Superadmins can manage filiais" ON public.saas_filiais
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.saas_superadmins WHERE email = get_current_user_email())
  );

CREATE POLICY "Superadmins can manage assinaturas" ON public.saas_assinaturas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.saas_superadmins WHERE email = get_current_user_email())
  );

CREATE POLICY "Superadmins can view superadmins" ON public.saas_superadmins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.saas_superadmins WHERE email = get_current_user_email())
  );

-- Função para listar empresas com assinaturas
CREATE OR REPLACE FUNCTION public.saas_list_empresas_com_assinatura()
RETURNS TABLE (
  empresa_id integer,
  razao_social text,
  nome_fantasia text,
  plano text,
  valor numeric,
  dia_vencimento integer,
  status text,
  updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as empresa_id,
    e.nome as razao_social,
    e.nome as nome_fantasia,
    COALESCE(a.plano_id::text, e.plano, 'Sem plano') as plano,
    COALESCE(a.valor_mensal, 0) as valor,
    COALESCE(a.dia_vencimento, 10) as dia_vencimento,
    COALESCE(a.status, CASE WHEN e.ativa THEN 'ATIVA' ELSE 'INATIVA' END) as status,
    e.updated_at
  FROM public.saas_empresas e
  LEFT JOIN public.saas_assinaturas a ON e.id = a.empresa_id
  ORDER BY e.created_at DESC;
END;
$$;

-- Função para criar empresa completa
CREATE OR REPLACE FUNCTION public.create_empresa_completa(
  p_nome text,
  p_cnpj text,
  p_email_admin text,
  p_nome_admin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_empresa_id integer;
  v_filial_id integer;
  v_user_id uuid;
  v_admin_existe boolean;
  v_result jsonb;
BEGIN
  -- Verificar se usuário admin já existe
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email_admin
  LIMIT 1;

  v_admin_existe := v_user_id IS NOT NULL;

  -- Criar empresa
  INSERT INTO public.saas_empresas (nome, cnpj, ativa)
  VALUES (p_nome, p_cnpj, true)
  RETURNING id INTO v_empresa_id;

  -- Criar filial matriz
  INSERT INTO public.saas_filiais (empresa_id, nome, cnpj, matriz, ativa)
  VALUES (v_empresa_id, 'Matriz', p_cnpj, true, true)
  RETURNING id INTO v_filial_id;

  -- Se admin existe, vincular à empresa
  IF v_admin_existe THEN
    -- Aqui você pode adicionar lógica de vínculo usuário-empresa se necessário
    NULL;
  END IF;

  -- Log de auditoria
  PERFORM log_security_event(
    'empresa_created',
    format('Empresa %s criada com CNPJ %s', p_nome, p_cnpj),
    jsonb_build_object(
      'empresa_id', v_empresa_id,
      'admin_email', p_email_admin,
      'admin_existe', v_admin_existe
    )
  );

  v_result := jsonb_build_object(
    'success', true,
    'empresa_id', v_empresa_id,
    'filial_id', v_filial_id,
    'admin_pendente', NOT v_admin_existe
  );

  RETURN v_result;
END;
$$;