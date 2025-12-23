-- Desabilitar temporariamente o trigger que está causando o erro
ALTER TABLE profiles DISABLE TRIGGER create_default_grupos_trigger;

-- Inserir perfil
INSERT INTO profiles (user_id, nome, email, empresa_id, filial_id, eh_primeiro_acesso)
VALUES (
  '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8',
  'Evandro',
  'evandro@conectionmg.com.br',
  'ec87f7f2-f8a1-4f2e-8076-723fe3943c41',
  '922c973b-023b-4e54-9268-7aefc53ad5b7',
  false
);

-- Atribuir role de admin
INSERT INTO user_roles (user_id, role)
SELECT '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8' 
  AND role = 'admin'::app_role::text
);

-- Criar grupos manualmente
INSERT INTO public.biblioteca_grupos (nome, slug, descricao, ordem, empresa_id, filial_id, user_id) VALUES
  ('Todos', 'todos', 'Todos os modelos', 0, 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41', '922c973b-023b-4e54-9268-7aefc53ad5b7', '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'),
  ('Cível', 'civel', 'Modelos para área cível', 1, 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41', '922c973b-023b-4e54-9268-7aefc53ad5b7', '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'),
  ('Trabalhista', 'trabalhista', 'Modelos para área trabalhista', 2, 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41', '922c973b-023b-4e54-9268-7aefc53ad5b7', '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'),
  ('Previdenciário', 'previdenciario', 'Modelos para área previdenciária', 3, 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41', '922c973b-023b-4e54-9268-7aefc53ad5b7', '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'),
  ('Penal', 'penal', 'Modelos para área penal', 4, 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41', '922c973b-023b-4e54-9268-7aefc53ad5b7', '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8'),
  ('Tributário', 'tributario', 'Modelos para área tributária', 5, 'ec87f7f2-f8a1-4f2e-8076-723fe3943c41', '922c973b-023b-4e54-9268-7aefc53ad5b7', '0f7d3382-18c3-4d5b-9803-3d65b79bcfc8');

-- Reabilitar o trigger
ALTER TABLE profiles ENABLE TRIGGER create_default_grupos_trigger;