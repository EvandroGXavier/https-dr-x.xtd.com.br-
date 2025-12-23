-- Adicionar colunas UUID às tabelas SaaS e converter o sistema para usar UUIDs
-- Problema: Sistema SaaS usa integers mas outras tabelas esperam UUIDs

-- 1. Adicionar coluna UUID nas tabelas SaaS se não existir
ALTER TABLE public.saas_empresas ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.saas_filiais ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();

-- 2. Garantir que todos os registros tenham UUIDs
UPDATE public.saas_empresas SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;
UPDATE public.saas_filiais SET uuid_id = gen_random_uuid() WHERE uuid_id IS NULL;

-- 3. Adicionar colunas UUID no profiles para referenciar UUIDs SaaS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_empresa_uuid UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_filial_uuid UUID;

-- 4. Mapear os IDs integers para UUIDs no perfil do usuário
UPDATE public.profiles 
SET current_empresa_uuid = (
  SELECT uuid_id FROM saas_empresas WHERE id = profiles.current_empresa_id
),
current_filial_uuid = (
  SELECT uuid_id FROM saas_filiais WHERE id = profiles.current_filial_id
)
WHERE current_empresa_id IS NOT NULL AND current_filial_id IS NOT NULL;

-- 5. Verificar resultado
SELECT 
  p.user_id,
  p.current_empresa_id,
  p.current_filial_id, 
  p.current_empresa_uuid,
  p.current_filial_uuid,
  e.nome as empresa_nome,
  f.nome as filial_nome
FROM profiles p
LEFT JOIN saas_empresas e ON p.current_empresa_id = e.id
LEFT JOIN saas_filiais f ON p.current_filial_id = f.id
WHERE p.user_id = '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8';