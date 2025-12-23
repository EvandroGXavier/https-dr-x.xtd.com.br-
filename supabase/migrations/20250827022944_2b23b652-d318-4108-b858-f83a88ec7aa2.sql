-- Inserir etiquetas para áreas do direito
INSERT INTO public.etiquetas (nome, slug, cor, icone, descricao, user_id, ativa) VALUES
('Direito Civil', 'direito-civil', '#3B82F6', '⚖️', 'Área do Direito Civil', '00000000-0000-0000-0000-000000000000', true),
('Direito Penal', 'direito-penal', '#DC2626', '🚔', 'Área do Direito Penal', '00000000-0000-0000-0000-000000000000', true),
('Direito Trabalhista', 'direito-trabalhista', '#059669', '👷', 'Área do Direito Trabalhista', '00000000-0000-0000-0000-000000000000', true),
('Direito Tributário', 'direito-tributario', '#7C3AED', '💰', 'Área do Direito Tributário', '00000000-0000-0000-0000-000000000000', true),
('Direito Empresarial', 'direito-empresarial', '#EA580C', '🏢', 'Área do Direito Empresarial', '00000000-0000-0000-0000-000000000000', true),
('Direito Imobiliário', 'direito-imobiliario', '#0891B2', '🏠', 'Área do Direito Imobiliário', '00000000-0000-0000-0000-000000000000', true),
('Direito de Família', 'direito-familia', '#EC4899', '👨‍👩‍👧‍👦', 'Área do Direito de Família', '00000000-0000-0000-0000-000000000000', true),
('Direito Previdenciário', 'direito-previdenciario', '#16A34A', '🏥', 'Área do Direito Previdenciário', '00000000-0000-0000-0000-000000000000', true),
('Direito do Consumidor', 'direito-consumidor', '#F59E0B', '🛒', 'Área do Direito do Consumidor', '00000000-0000-0000-0000-000000000000', true),
('Direito Administrativo', 'direito-administrativo', '#6366F1', '🏛️', 'Área do Direito Administrativo', '00000000-0000-0000-0000-000000000000', true),
('Direito Digital', 'direito-digital', '#06B6D4', '💻', 'Área do Direito Digital', '00000000-0000-0000-0000-000000000000', true),
('Direito Ambiental', 'direito-ambiental', '#22C55E', '🌱', 'Área do Direito Ambiental', '00000000-0000-0000-0000-000000000000', true)
ON CONFLICT (slug, user_id) DO NOTHING;