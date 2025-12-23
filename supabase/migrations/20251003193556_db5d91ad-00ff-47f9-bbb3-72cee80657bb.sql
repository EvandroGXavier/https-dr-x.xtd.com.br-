-- =====================================================
-- CORREÇÃO DE AVISOS DE SEGURANÇA
-- =====================================================

-- 1. HABILITAR RLS nas tabelas públicas sem RLS
-- Verificar quais tabelas não têm RLS habilitado

-- Habilitar RLS em todas as tabelas públicas que ainda não têm
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            SELECT tablename 
            FROM pg_tables t
            JOIN pg_class c ON c.relname = t.tablename
            WHERE c.relrowsecurity = true
            AND t.schemaname = 'public'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. ADICIONAR search_path = 'public' em funções que não têm
ALTER FUNCTION public.update_timestamp() SET search_path = 'public';
ALTER FUNCTION public.update_whatsapp_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_configuracoes_updated_at() SET search_path = 'public';
ALTER FUNCTION public.migrar_dados_whatsapp() SET search_path = 'public';
ALTER FUNCTION public.set_tipo_pessoa_contatos_v2() SET search_path = 'public';
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';
ALTER FUNCTION public.get_current_user_email() SET search_path = 'public';
ALTER FUNCTION public.is_superadmin(text) SET search_path = 'public';

-- 3. CRIAR POLÍTICAS RLS para tabelas específicas identificadas
-- Verificar se há tabelas críticas sem políticas e criar políticas padrão

-- Para a tabela contato_anexo (se existir e não tiver políticas)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contato_anexo') THEN
        -- Habilitar RLS se ainda não estiver habilitado
        EXECUTE 'ALTER TABLE public.contato_anexo ENABLE ROW LEVEL SECURITY';
        
        -- Criar políticas básicas se não existirem
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contato_anexo' AND policyname = 'Users can view their own contato_anexo') THEN
            EXECUTE '
            CREATE POLICY "Users can view their own contato_anexo"
            ON public.contato_anexo FOR SELECT
            TO public
            USING (user_id = auth.uid() OR has_role(''admin''::app_role))';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contato_anexo' AND policyname = 'Users can create their own contato_anexo') THEN
            EXECUTE '
            CREATE POLICY "Users can create their own contato_anexo"
            ON public.contato_anexo FOR INSERT
            TO public
            WITH CHECK (user_id = auth.uid())';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contato_anexo' AND policyname = 'Users can update their own contato_anexo') THEN
            EXECUTE '
            CREATE POLICY "Users can update their own contato_anexo"
            ON public.contato_anexo FOR UPDATE
            TO public
            USING (user_id = auth.uid() OR has_role(''admin''::app_role))';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'contato_anexo' AND policyname = 'Users can delete their own contato_anexo') THEN
            EXECUTE '
            CREATE POLICY "Users can delete their own contato_anexo"
            ON public.contato_anexo FOR DELETE
            TO public
            USING (user_id = auth.uid() OR has_role(''admin''::app_role))';
        END IF;
    END IF;
END $$;

-- =====================================================
-- AVISOS CORRIGIDOS:
-- - RLS habilitado em todas as tabelas públicas
-- - search_path definido em todas as funções
-- - Políticas RLS criadas para tabelas críticas
-- =====================================================