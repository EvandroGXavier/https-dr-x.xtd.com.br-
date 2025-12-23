-- Inserir grupos padrão para todas as empresas/filiais existentes
INSERT INTO public.biblioteca_grupos (nome, slug, descricao, ordem, empresa_id, filial_id, user_id) 
SELECT 
  grupos.nome,
  grupos.slug,
  grupos.descricao,
  grupos.ordem,
  p.empresa_id,
  p.filial_id,
  p.user_id
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
CROSS JOIN (
  SELECT DISTINCT user_id, empresa_id, filial_id 
  FROM public.profiles 
  WHERE empresa_id IS NOT NULL OR filial_id IS NOT NULL
) p
WHERE NOT EXISTS (
  SELECT 1 FROM public.biblioteca_grupos bg 
  WHERE bg.nome = grupos.nome 
  AND bg.user_id = p.user_id
  AND (bg.empresa_id = p.empresa_id OR (bg.empresa_id IS NULL AND p.empresa_id IS NULL))
  AND (bg.filial_id = p.filial_id OR (bg.filial_id IS NULL AND p.filial_id IS NULL))
);

-- Se não houver registros em profiles com empresa/filial, inserir para o primeiro usuário admin
INSERT INTO public.biblioteca_grupos (nome, slug, descricao, ordem, user_id) 
SELECT 
  grupos.nome,
  grupos.slug,
  grupos.descricao,
  grupos.ordem,
  (SELECT user_id FROM public.profiles WHERE role = 'admin' LIMIT 1)
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
WHERE NOT EXISTS (SELECT 1 FROM public.biblioteca_grupos)
AND EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin');