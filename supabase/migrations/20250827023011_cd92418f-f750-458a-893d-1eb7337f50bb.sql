-- Inserir etiquetas para áreas do direito (sem constraint única em slug+user_id)
INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Civil', 'direito-civil', '#3B82F6', '⚖️', 'Área do Direito Civil', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-civil' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Penal', 'direito-penal', '#DC2626', '🚔', 'Área do Direito Penal', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-penal' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Trabalhista', 'direito-trabalhista', '#059669', '👷', 'Área do Direito Trabalhista', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-trabalhista' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Tributário', 'direito-tributario', '#7C3AED', '💰', 'Área do Direito Tributário', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-tributario' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Empresarial', 'direito-empresarial', '#EA580C', '🏢', 'Área do Direito Empresarial', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-empresarial' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Imobiliário', 'direito-imobiliario', '#0891B2', '🏠', 'Área do Direito Imobiliário', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-imobiliario' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito de Família', 'direito-familia', '#EC4899', '👨‍👩‍👧‍👦', 'Área do Direito de Família', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-familia' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Previdenciário', 'direito-previdenciario', '#16A34A', '🏥', 'Área do Direito Previdenciário', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-previdenciario' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito do Consumidor', 'direito-consumidor', '#F59E0B', '🛒', 'Área do Direito do Consumidor', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-consumidor' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Administrativo', 'direito-administrativo', '#6366F1', '🏛️', 'Área do Direito Administrativo', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-administrativo' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Digital', 'direito-digital', '#06B6D4', '💻', 'Área do Direito Digital', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-digital' AND user_id = auth.uid());

INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) 
SELECT 'Direito Ambiental', 'direito-ambiental', '#22C55E', '🌱', 'Área do Direito Ambiental', auth.uid(), true
WHERE NOT EXISTS (SELECT 1 FROM public.etiquetas WHERE slug = 'direito-ambiental' AND user_id = auth.uid());