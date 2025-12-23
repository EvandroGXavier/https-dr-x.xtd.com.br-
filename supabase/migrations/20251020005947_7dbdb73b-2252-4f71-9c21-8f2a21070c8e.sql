-- Criar tabela de configurações de processos
CREATE TABLE IF NOT EXISTS public.processos_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    empresa_id UUID,
    filial_id UUID,
    
    -- Configurações de Padrões
    advogado_responsavel_id UUID,
    status_padrao TEXT CHECK (status_padrao IN ('ativo', 'suspenso', 'arquivado', 'finalizado')),
    tipo_padrao TEXT CHECK (tipo_padrao IN ('civel', 'criminal', 'trabalhista', 'tributario', 'previdenciario', 'administrativo', 'outros')),
    instancia_padrao TEXT CHECK (instancia_padrao IN ('primeira', 'segunda', 'superior', 'supremo')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Garantir apenas um registro por tenant
    UNIQUE (tenant_id)
);

-- Habilitar RLS
ALTER TABLE public.processos_config ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT: usuários autenticados do mesmo tenant
CREATE POLICY "processos_config_select_by_tenant" ON public.processos_config
FOR SELECT USING (auth.uid() IS NOT NULL AND tenant_id = auth.uid());

-- Policy de INSERT: usuários autenticados podem criar para seu tenant
CREATE POLICY "processos_config_insert_by_tenant" ON public.processos_config
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND tenant_id = auth.uid());

-- Policy de UPDATE: apenas admins ou o próprio tenant
CREATE POLICY "processos_config_update_by_tenant" ON public.processos_config
FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    tenant_id = auth.uid()
) WITH CHECK (
    tenant_id = auth.uid()
);

-- Trigger para atualizar updated_at
CREATE TRIGGER handle_processos_config_updated_at
    BEFORE UPDATE ON public.processos_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();