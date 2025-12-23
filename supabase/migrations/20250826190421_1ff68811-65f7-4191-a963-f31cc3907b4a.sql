-- Corrigir política RLS para permitir que usuários autenticados criem contas WhatsApp
DROP POLICY IF EXISTS "Admins can create whatsapp_accounts" ON public.whatsapp_accounts;

-- Criar nova política que permite usuários autenticados criarem suas próprias contas
CREATE POLICY "Users can create their own whatsapp_accounts"
  ON public.whatsapp_accounts
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Também corrigir a política de UPDATE para ser mais específica
DROP POLICY IF EXISTS "Admins can update whatsapp_accounts" ON public.whatsapp_accounts;

CREATE POLICY "Users can update their own whatsapp_accounts"
  ON public.whatsapp_accounts
  FOR UPDATE
  USING (user_id = auth.uid() OR has_role('admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR has_role('admin'::app_role));