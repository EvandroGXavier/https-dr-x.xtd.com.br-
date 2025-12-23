-- Create storage bucket for system backups (admin only)
INSERT INTO storage.buckets (id, name, public) VALUES ('system-backups', 'system-backups', false);

-- Create RLS policies for system-backups bucket
CREATE POLICY "Only admins can view system backup files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'system-backups' AND has_role('admin'));

CREATE POLICY "Only admins can upload system backup files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'system-backups' AND has_role('admin'));

CREATE POLICY "Only admins can delete system backup files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'system-backups' AND has_role('admin'));

-- Create table to track backup history
CREATE TABLE public.backup_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('database', 'source', 'complete')),
  backup_size BIGINT,
  file_path TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for backup_history
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backup_history
CREATE POLICY "Only admins can view backup history" 
ON public.backup_history 
FOR SELECT 
USING (has_role('admin'));

CREATE POLICY "Only admins can create backup history" 
ON public.backup_history 
FOR INSERT 
WITH CHECK (has_role('admin') AND auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_backup_history_updated_at
BEFORE UPDATE ON public.backup_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();