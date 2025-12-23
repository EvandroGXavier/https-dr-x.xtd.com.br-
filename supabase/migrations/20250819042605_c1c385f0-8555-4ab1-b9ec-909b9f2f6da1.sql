-- Add icon field to etiquetas table
ALTER TABLE public.etiquetas 
ADD COLUMN icone TEXT DEFAULT 'tag';