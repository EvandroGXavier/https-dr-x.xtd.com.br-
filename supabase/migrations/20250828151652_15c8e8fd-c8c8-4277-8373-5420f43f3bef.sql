-- Enable RLS on missing table
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policy for whatsapp_accounts if needed
CREATE POLICY "Users can view their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR SELECT 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can create their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role('admin'));

CREATE POLICY "Users can delete their own whatsapp_accounts" 
ON public.whatsapp_accounts 
FOR DELETE 
USING (auth.uid() = user_id OR has_role('admin'));