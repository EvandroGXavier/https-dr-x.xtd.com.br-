-- RLS de leitura para telas de criação de processo
-- Garante que usuários possam ler dados necessários para preencher formulários

-- Políticas para contatos_v2
DROP POLICY IF EXISTS contatos_v2_select_by_user ON public.contatos_v2;
CREATE POLICY contatos_v2_select_by_user ON public.contatos_v2
FOR SELECT USING (
  user_id = auth.uid() OR has_role('admin'::app_role)
);

-- Políticas para saas_empresas (leitura para combos)
ALTER TABLE public.saas_empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS empresas_select_by_user ON public.saas_empresas;
CREATE POLICY empresas_select_by_user ON public.saas_empresas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid() AND ufp.empresa_id = saas_empresas.id
  ) OR
  EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  )
);

-- Políticas para saas_filiais (leitura para combos)
ALTER TABLE public.saas_filiais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS filiais_select_by_user ON public.saas_filiais;
CREATE POLICY filiais_select_by_user ON public.saas_filiais
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuario_filial_perfis ufp
    WHERE ufp.user_id = auth.uid() 
      AND ufp.empresa_id = saas_filiais.empresa_id
      AND (ufp.filial_id = saas_filiais.id OR ufp.filial_id IS NULL)
  ) OR
  EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()
  )
);