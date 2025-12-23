-- Corrigir incompatibilidade de tipos SaaS entre integers e UUIDs
-- Problema: profiles tem empresa_id/filial_id como integer, mas outras tabelas esperam UUID

-- 1. Verificar se já existem UUIDs para as empresas/filiais SaaS
SELECT 'Empresas SaaS:' as info;
SELECT id, nome, uuid FROM saas_empresas ORDER BY id;

SELECT 'Filiais SaaS:' as info;  
SELECT id, nome, empresa_id, uuid FROM saas_filiais ORDER BY id;

-- 2. Se não existirem UUIDs, vamos criar
-- Primeiro, garantir que as colunas UUID existam
ALTER TABLE public.saas_empresas ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
ALTER TABLE public.saas_filiais ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

-- 3. Atualizar UUIDs se estiverem nulos
UPDATE public.saas_empresas SET uuid = gen_random_uuid() WHERE uuid IS NULL;
UPDATE public.saas_filiais SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- 4. Mostrar os UUIDs gerados/existentes
SELECT 'UUIDs após atualização:' as info;
SELECT id, nome, uuid FROM saas_empresas WHERE id = 1;
SELECT id, nome, empresa_id, uuid FROM saas_filiais WHERE id = 1;