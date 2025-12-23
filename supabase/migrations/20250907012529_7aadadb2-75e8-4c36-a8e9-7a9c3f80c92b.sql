-- Atualizar perfil do usuário evandro com empresa e filial master
UPDATE public.profiles 
SET 
  empresa_id = 1,
  filial_id = 1,
  current_empresa_id = 1,
  current_filial_id = 1,
  role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'evandro@conectionmg.com.br'
);