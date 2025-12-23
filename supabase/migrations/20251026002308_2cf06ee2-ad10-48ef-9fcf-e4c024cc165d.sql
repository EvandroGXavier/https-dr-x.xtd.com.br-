-- Desabilitar trigger temporariamente
ALTER TABLE saas_empresas DISABLE TRIGGER trg_validar_cnpj_empresa;

-- 1. Preparar migração de IDs
DO $$
DECLARE
  old_id uuid;
  new_id uuid := 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41';
  temp_cnpj text := '99.999.999/9999-99';
BEGIN
  -- Buscar ID existente com o CNPJ
  SELECT empresa_id INTO old_id
  FROM saas_empresas
  WHERE cnpj = '00.000.000/0001-00'
  LIMIT 1;

  IF old_id IS NOT NULL AND old_id != new_id THEN
    -- Criar novo registro com CNPJ temporário
    INSERT INTO saas_empresas (
      empresa_id,
      nome,
      cnpj,
      ativa,
      codigo,
      created_at
    ) VALUES (
      new_id,
      'Empresa Master',
      temp_cnpj,
      TRUE,
      'MASTER',
      NOW()
    );

    -- Atualizar referências em saas_filiais
    UPDATE saas_filiais
    SET empresa_id = new_id
    WHERE empresa_id = old_id;

    -- Atualizar referências em saas_assinaturas
    UPDATE saas_assinaturas
    SET empresa_id = new_id,
        empresa_uuid = new_id
    WHERE empresa_id = old_id;

    -- Atualizar referências em profiles
    UPDATE profiles
    SET empresa_id = new_id
    WHERE empresa_id = old_id;

    -- Deletar o registro antigo
    DELETE FROM saas_empresas WHERE empresa_id = old_id;

    -- Atualizar o CNPJ para o valor correto
    UPDATE saas_empresas
    SET cnpj = '00.000.000/0001-00'
    WHERE empresa_id = new_id;

  ELSIF old_id IS NULL THEN
    -- Se não existe, inserir direto
    INSERT INTO saas_empresas (
      empresa_id,
      nome,
      cnpj,
      ativa,
      codigo,
      created_at
    ) VALUES (
      new_id,
      'Empresa Master',
      '00.000.000/0001-00',
      TRUE,
      'MASTER',
      NOW()
    );
  ELSE
    -- Se já existe com o ID correto, apenas atualizar dados
    UPDATE saas_empresas
    SET nome = 'Empresa Master',
        ativa = TRUE,
        codigo = 'MASTER',
        updated_at = NOW()
    WHERE empresa_id = new_id;
  END IF;
END $$;

-- Reabilitar trigger
ALTER TABLE saas_empresas ENABLE TRIGGER trg_validar_cnpj_empresa;

-- 2. Garantir que o superadmin está registrado
INSERT INTO saas_superadmins (email, created_at)
VALUES ('evandro@conectionmg.com.br', NOW())
ON CONFLICT (email) DO NOTHING;

-- 3. Garantir assinatura ativa
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM saas_assinaturas 
    WHERE empresa_id = 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41'
      AND status = 'ativa'
  ) THEN
    INSERT INTO saas_assinaturas (
      assinatura_id,
      empresa_id,
      empresa_uuid,
      plano_id,
      tenant_id,
      status,
      valor_mensal,
      dia_vencimento,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'ec87f7f2-f8a1-4f2e-8076-723fe3943c41',
      'ec87f7f2-f8a1-4f2e-8076-723fe3943c41',
      NULL,
      '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8',
      'ativa',
      0.00,
      1,
      NOW()
    );
  END IF;
END $$;

-- 4. Configurar RLS
ALTER TABLE saas_empresas ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS superadmin_manage_empresas ON saas_empresas;
DROP POLICY IF EXISTS superadmin_view_all_empresas ON saas_empresas;
DROP POLICY IF EXISTS saas_empresas_insert_by_superadmin ON saas_empresas;
DROP POLICY IF EXISTS saas_empresas_delete_by_superadmin ON saas_empresas;
DROP POLICY IF EXISTS saas_empresas_select_by_superadmin_or_own ON saas_empresas;
DROP POLICY IF EXISTS saas_empresas_update_by_superadmin_or_own ON saas_empresas;
DROP POLICY IF EXISTS superadmin_full_access_empresas ON saas_empresas;

-- Criar policy para superadmins
CREATE POLICY superadmin_full_access_empresas
ON saas_empresas
FOR ALL
TO authenticated
USING (
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  is_superadmin((SELECT email FROM auth.users WHERE id = auth.uid()))
);