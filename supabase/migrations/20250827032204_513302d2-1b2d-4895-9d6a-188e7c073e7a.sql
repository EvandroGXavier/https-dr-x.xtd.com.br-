-- Limpar todas as etiquetas de áreas do direito criadas automaticamente
DELETE FROM public.etiquetas 
WHERE nome IN (
  'Direito Civil', 'Direito Penal', 'Direito Trabalhista', 'Direito Tributário',
  'Direito Empresarial', 'Direito Imobiliário', 'Direito de Família', 
  'Direito Previdenciário', 'Direito do Consumidor', 'Direito Administrativo',
  'Direito Digital', 'Direito Ambiental'
);