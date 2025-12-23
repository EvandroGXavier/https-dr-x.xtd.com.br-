-- Fix signup failure: profiles trigger inserting integer into UUID columns of biblioteca_grupos
-- Update function to use the UUID fields from profiles

create or replace function public.create_default_biblioteca_grupos()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Use UUID fields from profiles to match biblioteca_grupos.empresa_id/filial_id (UUID)
  insert into public.biblioteca_grupos (nome, slug, descricao, ordem, empresa_id, filial_id, user_id) values
    ('Todos', 'todos', 'Todos os modelos', 0, NEW.current_empresa_uuid, NEW.current_filial_uuid, NEW.user_id),
    ('Cível', 'civel', 'Modelos para área cível', 1, NEW.current_empresa_uuid, NEW.current_filial_uuid, NEW.user_id),
    ('Trabalhista', 'trabalhista', 'Modelos para área trabalhista', 2, NEW.current_empresa_uuid, NEW.current_filial_uuid, NEW.user_id),
    ('Previdenciário', 'previdenciario', 'Modelos para área previdenciária', 3, NEW.current_empresa_uuid, NEW.current_filial_uuid, NEW.user_id),
    ('Penal', 'penal', 'Modelos para área penal', 4, NEW.current_empresa_uuid, NEW.current_filial_uuid, NEW.user_id),
    ('Tributário', 'tributario', 'Modelos para área tributária', 5, NEW.current_empresa_uuid, NEW.current_filial_uuid, NEW.user_id);
  return new;
end;
$$;