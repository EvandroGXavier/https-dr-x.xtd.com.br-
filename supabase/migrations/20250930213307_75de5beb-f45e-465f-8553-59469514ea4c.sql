-- Garantir permissões de leitura nas views de compatibilidade
GRANT SELECT ON public.vw_contatos_compat TO authenticated;
GRANT SELECT ON public.vw_contas_compat TO authenticated;

-- Habilitar RLS na tabela de associação de etiquetas
ALTER TABLE public.transacoes_financeiras_etiquetas ENABLE ROW LEVEL SECURITY;

-- Criar policy para permitir leitura de etiquetas de transações que o usuário possui
CREATE POLICY "select_transacao_etiquetas_por_dono" ON public.transacoes_financeiras_etiquetas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.transacoes_financeiras tf
    WHERE tf.id = transacoes_financeiras_etiquetas.transacao_id
      AND (tf.user_id = auth.uid() OR has_role('admin'))
  )
);