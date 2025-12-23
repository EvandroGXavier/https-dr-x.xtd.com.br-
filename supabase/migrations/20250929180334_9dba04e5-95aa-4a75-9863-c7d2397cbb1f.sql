-- Ativar RLS na tabela contas_financeiras se não estiver ativado
ALTER TABLE public.contas_financeiras ENABLE ROW LEVEL SECURITY;

-- Criar política de leitura para usuários autenticados
DROP POLICY IF EXISTS "Permite leitura de contas para usuários autenticados" ON public.contas_financeiras;
CREATE POLICY "Permite leitura de contas para usuários autenticados"
ON public.contas_financeiras
FOR SELECT
TO authenticated
USING (true);

-- Função para calcular saldo a realizar
CREATE OR REPLACE FUNCTION get_financeiro_saldo_a_realizar(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(total_a_receber NUMERIC, total_a_pagar NUMERIC, saldo_a_realizar NUMERIC) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN tipo = 'receber' AND situacao = 'aberta' THEN valor_documento ELSE 0 END), 0) AS total_a_receber,
        COALESCE(SUM(CASE WHEN tipo = 'pagar' AND situacao = 'aberta' THEN valor_documento ELSE 0 END), 0) AS total_a_pagar,
        COALESCE(
            SUM(CASE WHEN tipo = 'receber' AND situacao = 'aberta' THEN valor_documento ELSE 0 END) -
            SUM(CASE WHEN tipo = 'pagar' AND situacao = 'aberta' THEN valor_documento ELSE 0 END), 
            0
        ) AS saldo_a_realizar
    FROM public.transacoes_financeiras
    WHERE user_id = p_user_id OR has_role('admin');
END;
$$ LANGUAGE plpgsql;