-- Adicionar superadmin para teste do SaaS
-- O email deve corresponder ao usuário logado: evandro@conectionmg.com.br
INSERT INTO public.saas_superadmins (email, created_at)
VALUES ('evandro@conectionmg.com.br', now())
ON CONFLICT (email) DO NOTHING;