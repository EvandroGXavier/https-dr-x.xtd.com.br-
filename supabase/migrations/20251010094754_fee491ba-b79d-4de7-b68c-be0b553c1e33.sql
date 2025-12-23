-- ============================================================================
-- FASE 3: OTIMIZAÇÃO TRANSACIONAL - CADASTRO PJ VIA CNPJ
-- ============================================================================

-- ETAPA 1: Remover campos redundantes da tabela contato_pj
-- A fonte única da verdade para telefone e email é contato_meios_contato
ALTER TABLE public.contato_pj
DROP COLUMN IF EXISTS telefone_1,
DROP COLUMN IF EXISTS telefone_2,
DROP COLUMN IF EXISTS ddd_1,
DROP COLUMN IF EXISTS ddd_2;

-- ETAPA 2: Criar função RPC transacional para criar contato PJ completo
CREATE OR REPLACE FUNCTION public.criar_contato_pj_transacional(
  p_nome_fantasia text,
  p_classificacao text DEFAULT 'cliente',
  p_responsavel_id uuid DEFAULT NULL,
  p_observacao text DEFAULT NULL,
  p_dados_pj jsonb DEFAULT '{}'::jsonb,
  p_enderecos jsonb DEFAULT '[]'::jsonb,
  p_meios_contato jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_empresa_id uuid;
  v_filial_id uuid;
  v_contato_id uuid;
  v_endereco jsonb;
  v_meio_contato jsonb;
  v_cnpj text;
  v_result jsonb;
BEGIN
  -- Validar autenticação
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Obter contexto SaaS do perfil do usuário
  SELECT 
    current_empresa_uuid,
    current_filial_uuid
  INTO v_empresa_id, v_filial_id
  FROM public.profiles
  WHERE user_id = v_user_id;

  IF v_empresa_id IS NULL OR v_filial_id IS NULL THEN
    RAISE EXCEPTION 'Configuração SaaS incompleta. Entre em contato com o administrador.';
  END IF;

  v_tenant_id := v_user_id;

  -- INÍCIO DA TRANSAÇÃO ATÔMICA
  
  -- 1. Criar registro em contatos_v2
  INSERT INTO public.contatos_v2 (
    user_id,
    tenant_id,
    empresa_id,
    filial_id,
    nome_fantasia,
    cpf_cnpj,
    classificacao,
    responsavel_id,
    observacao,
    ativo
  ) VALUES (
    v_user_id,
    v_tenant_id,
    v_empresa_id,
    v_filial_id,
    p_nome_fantasia,
    p_dados_pj->>'cnpj',
    p_classificacao,
    p_responsavel_id,
    p_observacao,
    true
  ) RETURNING id INTO v_contato_id;

  -- 2. Criar registro em contato_pj com dados completos
  IF jsonb_typeof(p_dados_pj) = 'object' AND p_dados_pj != '{}'::jsonb THEN
    INSERT INTO public.contato_pj (
      contato_id,
      empresa_id,
      filial_id,
      tenant_id,
      cnpj,
      razao_social,
      nome_fantasia,
      natureza_juridica,
      porte,
      situacao_cadastral,
      data_abertura,
      capital_social,
      cnae_principal,
      cnaes_secundarios,
      matriz_filial,
      regime_tributario,
      situacao_motivo,
      situacao_data,
      municipio_ibge,
      origem_dados
    ) VALUES (
      v_contato_id,
      v_empresa_id,
      v_filial_id,
      v_tenant_id,
      p_dados_pj->>'cnpj',
      p_dados_pj->>'razao_social',
      p_dados_pj->>'nome_fantasia',
      p_dados_pj->>'natureza_juridica',
      p_dados_pj->>'porte',
      p_dados_pj->>'situacao_cadastral',
      (p_dados_pj->>'data_abertura')::date,
      (p_dados_pj->>'capital_social')::numeric,
      p_dados_pj->>'cnae_principal',
      p_dados_pj->'cnaes_secundarios',
      p_dados_pj->>'matriz_filial',
      p_dados_pj->>'regime_tributario',
      p_dados_pj->>'situacao_motivo',
      (p_dados_pj->>'situacao_data')::date,
      p_dados_pj->>'municipio_ibge',
      COALESCE(p_dados_pj->>'origem_dados', 'api_cnpj')
    );
  END IF;

  -- 3. Criar endereços
  IF jsonb_array_length(p_enderecos) > 0 THEN
    FOR v_endereco IN SELECT * FROM jsonb_array_elements(p_enderecos)
    LOOP
      INSERT INTO public.contato_enderecos (
        contato_id,
        empresa_id,
        filial_id,
        tipo,
        principal,
        cep,
        logradouro,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        ibge,
        latitude,
        longitude,
        origem_dados
      ) VALUES (
        v_contato_id,
        v_empresa_id,
        v_filial_id,
        COALESCE(v_endereco->>'tipo', 'Comercial'),
        COALESCE((v_endereco->>'principal')::boolean, false),
        v_endereco->>'cep',
        v_endereco->>'logradouro',
        v_endereco->>'numero',
        v_endereco->>'complemento',
        v_endereco->>'bairro',
        v_endereco->>'cidade',
        v_endereco->>'uf',
        v_endereco->>'ibge',
        (v_endereco->>'latitude')::numeric,
        (v_endereco->>'longitude')::numeric,
        COALESCE(v_endereco->>'origem_dados', 'api_cnpj')
      );
    END LOOP;
  END IF;

  -- 4. Criar meios de contato
  IF jsonb_array_length(p_meios_contato) > 0 THEN
    FOR v_meio_contato IN SELECT * FROM jsonb_array_elements(p_meios_contato)
    LOOP
      INSERT INTO public.contato_meios_contato (
        contato_id,
        tenant_id,
        empresa_id,
        filial_id,
        tipo,
        valor,
        principal,
        observacao
      ) VALUES (
        v_contato_id,
        v_tenant_id,
        v_empresa_id,
        v_filial_id,
        v_meio_contato->>'tipo',
        v_meio_contato->>'valor',
        COALESCE((v_meio_contato->>'principal')::boolean, false),
        v_meio_contato->>'observacao'
      );
    END LOOP;
  END IF;

  -- 5. Registrar auditoria
  PERFORM public.log_security_event(
    'contact_pj_created_transactional',
    format('Contato PJ criado transacionalmente: %s (CNPJ: %s)', 
      p_nome_fantasia, 
      p_dados_pj->>'cnpj'
    ),
    jsonb_build_object(
      'contato_id', v_contato_id,
      'cnpj', p_dados_pj->>'cnpj',
      'empresa_id', v_empresa_id,
      'filial_id', v_filial_id,
      'total_enderecos', jsonb_array_length(p_enderecos),
      'total_meios_contato', jsonb_array_length(p_meios_contato)
    )
  );

  -- Retornar resultado
  v_result := jsonb_build_object(
    'success', true,
    'contato_id', v_contato_id,
    'message', 'Contato PJ criado com sucesso'
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, a transação é automaticamente revertida
    RAISE EXCEPTION 'Erro ao criar contato PJ: %', SQLERRM;
END;
$$;