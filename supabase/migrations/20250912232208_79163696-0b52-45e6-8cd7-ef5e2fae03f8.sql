-- Fix contatos_v2 RLS policies and add proper tenant handling
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can create their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can update their own contatos_v2" ON public.contatos_v2;
DROP POLICY IF EXISTS "Users can delete their own contatos_v2" ON public.contatos_v2;

-- Create simplified RLS policies for contatos_v2
CREATE POLICY "contatos_v2_tenant_access"
ON public.contatos_v2
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure tenant_id trigger for contatos_v2
CREATE OR REPLACE FUNCTION public.set_contatos_v2_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set user_id if not provided
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  
  -- Validate user_id matches authenticated user (except for admins)
  IF NEW.user_id != auth.uid() AND NOT public.has_role('admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Cannot create/update contacts for other users';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS contatos_v2_set_tenant_id ON public.contatos_v2;

-- Create trigger
CREATE TRIGGER contatos_v2_set_tenant_id
  BEFORE INSERT OR UPDATE ON public.contatos_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contatos_v2_tenant_id();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_contatos_v2_user_id ON public.contatos_v2(user_id);

-- Log the changes
COMMENT ON POLICY "contatos_v2_tenant_access" ON public.contatos_v2 IS 'Simplified RLS policy for contatos_v2 - users can only access their own contacts';
COMMENT ON FUNCTION public.set_contatos_v2_tenant_id() IS 'Ensures proper tenant isolation for contatos_v2 table';