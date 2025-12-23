-- Criar dados de teste para contas financeiras se não existir
INSERT INTO public.contas_financeiras (nome, tipo, banco, user_id)
SELECT 'Conta Principal', 'corrente', 'Banco do Brasil', auth.uid()
WHERE NOT EXISTS (
  SELECT 1 FROM public.contas_financeiras WHERE user_id = auth.uid()
);

-- Testar se o trigger está funcionando corretamente
-- Insere uma transação de teste se não existir nenhuma
DO $$
DECLARE
  contato_teste_id UUID;
  conta_teste_id UUID;
  user_atual UUID := auth.uid();
BEGIN
  -- Buscar primeiro contato disponível
  SELECT id INTO contato_teste_id 
  FROM public.contatos_v2 
  WHERE user_id = user_atual 
  LIMIT 1;
  
  -- Buscar primeira conta disponível
  SELECT id INTO conta_teste_id 
  FROM public.contas_financeiras 
  WHERE user_id = user_atual 
  LIMIT 1;
  
  -- Inserir transação de teste apenas se temos dados e não existe transação
  IF contato_teste_id IS NOT NULL AND conta_teste_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.transacoes_financeiras WHERE user_id = user_atual) THEN
      INSERT INTO public.transacoes_financeiras (
        contato_id,
        conta_financeira_id,
        tipo,
        valor_documento,
        data_emissao,
        data_vencimento,
        numero_documento,
        categoria,
        historico,
        forma_pagamento,
        situacao
      ) VALUES (
        contato_teste_id,
        conta_teste_id,
        'receber',
        1000.00,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        'TESTE-001',
        'SERVICOS',
        'Transação de teste - hotfix financeiro',
        'BOLETO',
        'aberta'
      );
    END IF;
  END IF;
END $$;