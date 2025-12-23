-- Fix all remaining security issues for production readiness

-- 1. Fix search path for all functions to prevent injection attacks
ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.generate_etiqueta_slug() SET search_path = 'public';  
ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
ALTER FUNCTION public.has_role(app_role) SET search_path = 'public';
ALTER FUNCTION public.get_current_user_role() SET search_path = 'public';
ALTER FUNCTION public.change_user_role(uuid, app_role, text) SET search_path = 'public';
ALTER FUNCTION public.log_profile_changes() SET search_path = 'public';

-- 2. Add performance indexes for production
CREATE INDEX IF NOT EXISTS idx_contatos_user_id ON public.contatos(user_id);
CREATE INDEX IF NOT EXISTS idx_contatos_email ON public.contatos(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contatos_cpf_cnpj ON public.contatos(cpf_cnpj) WHERE cpf_cnpj IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contatos_created_at ON public.contatos(created_at);

CREATE INDEX IF NOT EXISTS idx_etiquetas_user_id ON public.etiquetas(user_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_slug ON public.etiquetas(slug);
CREATE INDEX IF NOT EXISTS idx_etiquetas_ativa ON public.etiquetas(ativa) WHERE ativa = true;

CREATE INDEX IF NOT EXISTS idx_etiqueta_vinculos_user_id ON public.etiqueta_vinculos(user_id);
CREATE INDEX IF NOT EXISTS idx_etiqueta_vinculos_referencia ON public.etiqueta_vinculos(referencia_id, referencia_tipo);
CREATE INDEX IF NOT EXISTS idx_etiqueta_vinculos_etiqueta ON public.etiqueta_vinculos(etiqueta_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 3. Ensure triggers are properly configured
DROP TRIGGER IF EXISTS update_contatos_updated_at ON public.contatos;
CREATE TRIGGER update_contatos_updated_at
    BEFORE UPDATE ON public.contatos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_etiquetas_updated_at ON public.etiquetas;
CREATE TRIGGER update_etiquetas_updated_at
    BEFORE UPDATE ON public.etiquetas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS generate_etiqueta_slug_trigger ON public.etiquetas;
CREATE TRIGGER generate_etiqueta_slug_trigger
    BEFORE INSERT OR UPDATE ON public.etiquetas
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_etiqueta_slug();

DROP TRIGGER IF EXISTS log_profile_changes_trigger ON public.profiles;
CREATE TRIGGER log_profile_changes_trigger
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.log_profile_changes();

-- 4. Add helpful comments for production maintenance
COMMENT ON TABLE public.contatos IS 'Tabela de contatos/clientes com dados completos e suporte a CNPJ';
COMMENT ON TABLE public.etiquetas IS 'Sistema de etiquetas/tags para categorização';
COMMENT ON TABLE public.etiqueta_vinculos IS 'Vínculos entre etiquetas e registros';
COMMENT ON TABLE public.profiles IS 'Perfis de usuários com controle de roles';
COMMENT ON TABLE public.profile_audit_log IS 'Log de auditoria para mudanças de perfil';

-- 5. Analyze tables for optimal query planning
ANALYZE public.contatos;
ANALYZE public.etiquetas;
ANALYZE public.etiqueta_vinculos;
ANALYZE public.profiles;
ANALYZE public.profile_audit_log;