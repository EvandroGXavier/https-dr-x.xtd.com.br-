-- Fix RLS policies for atendimentos table
-- The current policy checks JWT app_metadata, but we need to check against profiles.empresa_id

-- Drop existing policy
DROP POLICY IF EXISTS "RLS_Atendimentos_All" ON atendimentos;

-- Create separate policies for better control
CREATE POLICY "atendimentos_select_by_tenant"
ON atendimentos
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "atendimentos_insert_by_tenant"
ON atendimentos
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "atendimentos_update_by_tenant"
ON atendimentos
FOR UPDATE
TO authenticated
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "atendimentos_delete_by_tenant"
ON atendimentos
FOR DELETE
TO authenticated
USING (
  tenant_id IN (
    SELECT empresa_id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);