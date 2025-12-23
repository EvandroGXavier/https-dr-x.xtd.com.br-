-- ============================================
-- PARTE 1: ESTRUTURA DE CONTAS FINANCEIRAS
-- ============================================

-- Criar tipo ENUM para tipo de conta (se não existir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_conta_financeira') THEN
        CREATE TYPE public.tipo_conta_financeira AS ENUM (
            'Conta Corrente', 
            'Conta Poupança', 
            'Caixa Físico', 
            'Investimento', 
            'Outros'
        );
    END IF;
END$$;

-- Verificar e ajustar tabela contas_financeiras
-- A tabela já existe, vamos garantir que tenha todas as colunas necessárias
DO $$ 
BEGIN
    -- Adicionar coluna pix se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contas_financeiras' 
        AND column_name = 'pix'
    ) THEN
        ALTER TABLE public.contas_financeiras ADD COLUMN pix TEXT;
    END IF;

    -- Adicionar coluna saldo_atual se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contas_financeiras' 
        AND column_name = 'saldo_atual'
    ) THEN
        ALTER TABLE public.contas_financeiras ADD COLUMN saldo_atual NUMERIC(15, 2) NOT NULL DEFAULT 0.00;
    END IF;

    -- Adicionar coluna observacoes se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'contas_financeiras' 
        AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE public.contas_financeiras ADD COLUMN observacoes TEXT;
    END IF;
END$$;

-- ============================================
-- PARTE 2: VINCULAÇÃO COM TRANSAÇÕES
-- ============================================

-- Adicionar coluna conta_financeira_id na tabela de transações (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transacoes_financeiras' 
        AND column_name = 'conta_financeira_id'
    ) THEN
        ALTER TABLE public.transacoes_financeiras 
        ADD COLUMN conta_financeira_id UUID;
    END IF;
END$$;

-- Criar conta "Caixa Geral" padrão se não existir
DO $$
DECLARE
    v_caixa_geral_id UUID;
    v_user_id UUID;
BEGIN
    -- Buscar um user_id válido para criar a conta (pega o primeiro usuário do sistema)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Verificar se já existe uma conta "Caixa Geral"
        SELECT id INTO v_caixa_geral_id 
        FROM public.contas_financeiras 
        WHERE nome = 'Caixa Geral' 
        LIMIT 1;
        
        -- Se não existir, criar
        IF v_caixa_geral_id IS NULL THEN
            INSERT INTO public.contas_financeiras (
                nome, tipo, saldo_inicial, saldo_atual, user_id, observacoes
            ) VALUES (
                'Caixa Geral',
                'Caixa Físico',
                0.00,
                0.00,
                v_user_id,
                'Conta padrão criada automaticamente pelo sistema'
            ) RETURNING id INTO v_caixa_geral_id;
        END IF;
        
        -- Migrar transações sem conta para "Caixa Geral"
        UPDATE public.transacoes_financeiras
        SET conta_financeira_id = v_caixa_geral_id
        WHERE conta_financeira_id IS NULL;
    END IF;
END$$;

-- Tornar conta_financeira_id obrigatório e adicionar FK
DO $$
BEGIN
    -- Alterar coluna para NOT NULL (só funciona se não houver valores NULL)
    IF NOT EXISTS (
        SELECT 1 FROM public.transacoes_financeiras 
        WHERE conta_financeira_id IS NULL
    ) THEN
        ALTER TABLE public.transacoes_financeiras 
        ALTER COLUMN conta_financeira_id SET NOT NULL;
    END IF;

    -- Adicionar chave estrangeira se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_transacoes_conta_financeira'
        AND table_name = 'transacoes_financeiras'
    ) THEN
        ALTER TABLE public.transacoes_financeiras
        ADD CONSTRAINT fk_transacoes_conta_financeira
        FOREIGN KEY (conta_financeira_id)
        REFERENCES public.contas_financeiras(id)
        ON DELETE RESTRICT;
    END IF;
END$$;

-- ============================================
-- PARTE 3: AUTOMAÇÃO DE SALDO
-- ============================================

-- Criar ou substituir função para atualizar saldo
CREATE OR REPLACE FUNCTION public.atualizar_saldo_financeiro_contas()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conta_id UUID;
    v_novo_saldo NUMERIC(15, 2);
BEGIN
    -- Determinar qual conta foi afetada
    IF TG_OP = 'DELETE' THEN
        v_conta_id := OLD.conta_financeira_id;
    ELSE
        v_conta_id := NEW.conta_financeira_id;
    END IF;

    -- Recalcular saldo da conta
    SELECT 
        COALESCE(cf.saldo_inicial, 0) + 
        COALESCE(SUM(
            CASE 
                WHEN tf.tipo = 'receber' AND tf.situacao IN ('recebida', 'paga') THEN 
                    COALESCE(tf.valor_recebido, tf.valor_documento)
                WHEN tf.tipo = 'pagar' AND tf.situacao IN ('recebida', 'paga') THEN 
                    -COALESCE(tf.valor_recebido, tf.valor_documento)
                ELSE 0
            END
        ), 0)
    INTO v_novo_saldo
    FROM public.contas_financeiras cf
    LEFT JOIN public.transacoes_financeiras tf ON tf.conta_financeira_id = cf.id
    WHERE cf.id = v_conta_id
    GROUP BY cf.id, cf.saldo_inicial;

    -- Atualizar saldo_atual
    UPDATE public.contas_financeiras
    SET saldo_atual = v_novo_saldo,
        updated_at = now()
    WHERE id = v_conta_id;

    -- Para UPDATE, se a conta mudou, atualizar ambas
    IF TG_OP = 'UPDATE' AND OLD.conta_financeira_id != NEW.conta_financeira_id THEN
        -- Recalcular saldo da conta antiga
        SELECT 
            COALESCE(cf.saldo_inicial, 0) + 
            COALESCE(SUM(
                CASE 
                    WHEN tf.tipo = 'receber' AND tf.situacao IN ('recebida', 'paga') THEN 
                        COALESCE(tf.valor_recebido, tf.valor_documento)
                    WHEN tf.tipo = 'pagar' AND tf.situacao IN ('recebida', 'paga') THEN 
                        -COALESCE(tf.valor_recebido, tf.valor_documento)
                    ELSE 0
                END
            ), 0)
        INTO v_novo_saldo
        FROM public.contas_financeiras cf
        LEFT JOIN public.transacoes_financeiras tf ON tf.conta_financeira_id = cf.id
        WHERE cf.id = OLD.conta_financeira_id
        GROUP BY cf.id, cf.saldo_inicial;

        UPDATE public.contas_financeiras
        SET saldo_atual = v_novo_saldo,
            updated_at = now()
        WHERE id = OLD.conta_financeira_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Criar trigger se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_atualiza_saldo_financeiro_contas'
    ) THEN
        CREATE TRIGGER trg_atualiza_saldo_financeiro_contas
        AFTER INSERT OR UPDATE OR DELETE ON public.transacoes_financeiras
        FOR EACH ROW
        EXECUTE FUNCTION public.atualizar_saldo_financeiro_contas();
    END IF;
END$$;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_financeira 
ON public.transacoes_financeiras(conta_financeira_id);

-- ============================================
-- PARTE 4: RLS POLICIES PARA CONTAS
-- ============================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

-- Políticas para SELECT
DROP POLICY IF EXISTS "Users can view their own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can view their own contas_financeiras"
ON public.contas_financeiras
FOR SELECT
USING (auth.uid() = user_id OR has_role('admin'));

-- Políticas para INSERT
DROP POLICY IF EXISTS "Users can create their own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can create their own contas_financeiras"
ON public.contas_financeiras
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Políticas para UPDATE
DROP POLICY IF EXISTS "Users can update their own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can update their own contas_financeiras"
ON public.contas_financeiras
FOR UPDATE
USING (auth.uid() = user_id OR has_role('admin'));

-- Políticas para DELETE
DROP POLICY IF EXISTS "Users can delete their own contas_financeiras" ON public.contas_financeiras;
CREATE POLICY "Users can delete their own contas_financeiras"
ON public.contas_financeiras
FOR DELETE
USING (auth.uid() = user_id OR has_role('admin'));