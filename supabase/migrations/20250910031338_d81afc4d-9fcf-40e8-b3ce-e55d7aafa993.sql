-- Corrigir foreign keys para contatos_v2
-- Primeiro, vamos dropar as constraints existentes que referenciam a tabela antiga

-- Tabela contato_meios_contato
ALTER TABLE public.contato_meios_contato 
DROP CONSTRAINT IF EXISTS contato_meios_contato_contato_id_fkey;

-- Adicionar nova constraint referenciando contatos_v2
ALTER TABLE public.contato_meios_contato 
ADD CONSTRAINT contato_meios_contato_contato_id_fkey 
FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON DELETE CASCADE;

-- Atualizar as políticas RLS para contato_meios_contato para usar contatos_v2
DROP POLICY IF EXISTS "Users can view their own contato_meios_contato" ON public.contato_meios_contato;

CREATE POLICY "Users can view their own contato_meios_contato" 
ON public.contato_meios_contato 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_meios_contato.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));

-- Corrigir outras tabelas relacionadas também
-- Tabela contato_pf
ALTER TABLE public.contato_pf 
DROP CONSTRAINT IF EXISTS contato_pf_contato_id_fkey;

ALTER TABLE public.contato_pf 
ADD CONSTRAINT contato_pf_contato_id_fkey 
FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON DELETE CASCADE;

-- Atualizar políticas RLS para contato_pf
DROP POLICY IF EXISTS "Users can view their own contato_pf" ON public.contato_pf;

CREATE POLICY "Users can view their own contato_pf" 
ON public.contato_pf 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_pf.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));

-- Permitir inserção e atualização para contato_pf
CREATE POLICY "Users can insert contato_pf for their own contacts" 
ON public.contato_pf 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_pf.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));

CREATE POLICY "Users can update contato_pf for their own contacts" 
ON public.contato_pf 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_pf.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));

-- Tabela contato_pj
ALTER TABLE public.contato_pj 
DROP CONSTRAINT IF EXISTS contato_pj_contato_id_fkey;

ALTER TABLE public.contato_pj 
ADD CONSTRAINT contato_pj_contato_id_fkey 
FOREIGN KEY (contato_id) REFERENCES public.contatos_v2(id) ON DELETE CASCADE;

-- Atualizar políticas RLS para contato_pj
DROP POLICY IF EXISTS "Users can view their own contato_pj" ON public.contato_pj;

CREATE POLICY "Users can view their own contato_pj" 
ON public.contato_pj 
FOR SELECT 
USING (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_pj.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));

-- Permitir inserção e atualização para contato_pj
CREATE POLICY "Users can insert contato_pj for their own contacts" 
ON public.contato_pj 
FOR INSERT 
WITH CHECK (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_pj.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));

CREATE POLICY "Users can update contato_pj for their own contacts" 
ON public.contato_pj 
FOR UPDATE 
USING (EXISTS ( SELECT 1
   FROM contatos_v2 c
  WHERE ((c.id = contato_pj.contato_id) AND ((c.user_id = auth.uid()) OR has_role('admin'::app_role)))));