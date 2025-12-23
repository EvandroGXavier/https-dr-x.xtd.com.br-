-- Create storage bucket for anexos
INSERT INTO storage.buckets (id, name, public) VALUES ('anexos', 'anexos', false);

-- Create storage policies for anexos
CREATE POLICY "Users can view their own anexos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'anexos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own anexos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'anexos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own anexos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'anexos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own anexos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'anexos' AND auth.uid()::text = (storage.foldername(name))[1]);