-- Limpar etiquetas duplicadas, mantendo apenas a primeira de cada tipo por usuário
WITH ranked_tags AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, nome ORDER BY created_at) as rn
  FROM public.etiquetas
)
DELETE FROM public.etiquetas 
WHERE id IN (
  SELECT id FROM ranked_tags WHERE rn > 1
);