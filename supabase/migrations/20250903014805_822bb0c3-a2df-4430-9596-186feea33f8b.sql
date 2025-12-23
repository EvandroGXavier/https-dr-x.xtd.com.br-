-- Políticas RLS para contato_pf
CREATE POLICY "Users can view their own contato_pf"
  ON public.contato_pf FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_pf.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_pf"
  ON public.contato_pf FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_pf.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_pf.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Políticas RLS para contato_pj
CREATE POLICY "Users can view their own contato_pj"
  ON public.contato_pj FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_pj.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_pj"
  ON public.contato_pj FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_pj.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_pj.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Políticas RLS para contato_enderecos
CREATE POLICY "Users can view their own contato_enderecos"
  ON public.contato_enderecos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_enderecos"
  ON public.contato_enderecos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_enderecos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Políticas RLS para contato_meios_contato
CREATE POLICY "Users can view their own contato_meios_contato"
  ON public.contato_meios_contato FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_meios_contato.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_meios_contato"
  ON public.contato_meios_contato FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_meios_contato.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_meios_contato.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Políticas RLS para contato_vinculos
CREATE POLICY "Users can view their own contato_vinculos"
  ON public.contato_vinculos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_vinculos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_vinculos"
  ON public.contato_vinculos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_vinculos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_vinculos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Políticas RLS para contato_documentos
CREATE POLICY "Users can view their own contato_documentos"
  ON public.contato_documentos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_documentos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_documentos"
  ON public.contato_documentos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_documentos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_documentos.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Políticas RLS para contato_financeiro_config
CREATE POLICY "Users can view their own contato_financeiro_config"
  ON public.contato_financeiro_config FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

CREATE POLICY "Users can manage their own contato_financeiro_config"
  ON public.contato_financeiro_config FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.contatos c 
    WHERE c.id = contato_financeiro_config.contato_id 
    AND (c.user_id = auth.uid() OR has_role('admin'::app_role))
  ));

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql SET search_path = public;

CREATE TRIGGER update_contato_pf_updated_at 
  BEFORE UPDATE ON public.contato_pf 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contato_pj_updated_at 
  BEFORE UPDATE ON public.contato_pj 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contato_enderecos_updated_at 
  BEFORE UPDATE ON public.contato_enderecos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contato_meios_contato_updated_at 
  BEFORE UPDATE ON public.contato_meios_contato 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contato_vinculos_updated_at 
  BEFORE UPDATE ON public.contato_vinculos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contato_documentos_updated_at 
  BEFORE UPDATE ON public.contato_documentos 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contato_financeiro_config_updated_at 
  BEFORE UPDATE ON public.contato_financeiro_config 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();