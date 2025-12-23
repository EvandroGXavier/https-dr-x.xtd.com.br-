-- Inserir grupos padrão das áreas do direito
INSERT INTO public.biblioteca_grupos (nome, slug, descricao, ordem, user_id) 
SELECT 
  grupos.nome,
  grupos.slug,
  grupos.descricao,
  grupos.ordem,
  (SELECT user_id FROM public.profiles LIMIT 1)
FROM (
  VALUES 
    ('Todos', 'todos', 'Todas as áreas do direito', 0),
    ('Cível', 'civel', 'Direito Civil', 1),
    ('Trabalhista', 'trabalhista', 'Direito Trabalhista', 2),
    ('Previdenciário', 'previdenciario', 'Direito Previdenciário', 3),
    ('Penal', 'penal', 'Direito Penal', 4),
    ('Tributário', 'tributario', 'Direito Tributário', 5),
    ('Administrativo', 'administrativo', 'Direito Administrativo', 6),
    ('Constitucional', 'constitucional', 'Direito Constitucional', 7),
    ('Empresarial', 'empresarial', 'Direito Empresarial', 8),
    ('Consumidor', 'consumidor', 'Direito do Consumidor', 9),
    ('Família', 'familia', 'Direito de Família', 10),
    ('Sucessões', 'sucessoes', 'Direito das Sucessões', 11)
) AS grupos(nome, slug, descricao, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.biblioteca_grupos WHERE nome = grupos.nome)
AND EXISTS (SELECT 1 FROM public.profiles);