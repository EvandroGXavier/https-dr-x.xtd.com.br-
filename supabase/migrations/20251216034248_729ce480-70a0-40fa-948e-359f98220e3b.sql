-- Remover políticas RLS duplicadas da tabela processos
-- Mantendo apenas as políticas V2 unificadas

DROP POLICY IF EXISTS "RLS: Usuários leem processos da sua filial" ON processos;
DROP POLICY IF EXISTS "Users can create processos in their tenant" ON processos;
DROP POLICY IF EXISTS "Users can delete their tenant processos" ON processos;
DROP POLICY IF EXISTS "Users can update their tenant processos" ON processos;
DROP POLICY IF EXISTS "Users can view their tenant processos" ON processos;
DROP POLICY IF EXISTS "processos_select_by_tenant" ON processos;
DROP POLICY IF EXISTS "processos_update_by_tenant" ON processos;