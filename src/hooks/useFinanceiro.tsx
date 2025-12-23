import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TransacaoFinanceira, FinanceiroFilters } from '@/types/financeiro';

export function useFinanceiro(filters: FinanceiroFilters = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchTransacoes = async (): Promise<TransacaoFinanceira[]> => {
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          contatos_v2!contato_id (
            id,
            nome_fantasia,
            cpf_cnpj,
            contato_meios_contato (
              tipo,
              valor
            )
          ),
          contas_financeiras:contas_financeiras!transacoes_financeiras_conta_financeira_id_fkey (
            id,
            nome,
            tipo
          ),
          transacoes_financeiras_etiquetas!left (
            etiqueta_id,
            etiquetas (
              id,
              nome,
              cor,
              icone
            )
          )
        `)
        .order('created_at', { ascending: false});

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar transações:', error);
        throw error;
      }

    const formattedTransacoes = data?.map((item: any) => {
      const meiosContato = item.contatos_v2?.contato_meios_contato || [];
      
      // Buscar email
      const emailMeio = meiosContato.find((m: any) => {
        const tipo = m.tipo?.toLowerCase() || '';
        return tipo === 'e-mail' || tipo === 'email';
      });
      
      // Buscar telefone (prioriza celular)
      const celularMeio = meiosContato.find((m: any) => m.tipo?.toLowerCase() === 'celular');
      const telefoneMeio = meiosContato.find((m: any) => m.tipo?.toLowerCase() === 'telefone');
      const telefone = celularMeio?.valor || telefoneMeio?.valor || '';
      
      return {
        id: item.id,
        contato: {
          id: item.contatos_v2?.id || '',
          nome: item.contatos_v2?.nome_fantasia || 'Contato não encontrado',
          cpf_cnpj: item.contatos_v2?.cpf_cnpj || '',
          email: emailMeio?.valor || '',
          telefone: telefone,
          meios_contato: meiosContato
        },
        tipo: item.tipo,
        valor_documento: item.valor_documento,
        valor_recebido: item.valor_recebido,
        data_emissao: item.data_emissao,
        data_vencimento: item.data_vencimento,
        data_liquidacao: item.data_liquidacao,
        situacao: item.situacao,
        numero_documento: item.numero_documento,
        numero_banco: item.numero_banco,
        categoria: item.categoria,
        historico: item.historico,
        conta_financeira: item.contas_financeiras?.nome || 'Não informado',
        conta_financeira_id: item.conta_financeira_id,
        data_vencimento_original: item.data_vencimento_original,
        forma_pagamento: item.forma_pagamento,
        data_competencia: item.data_competencia,
        origem_tipo: item.origem_tipo,
        origem_id: item.origem_id,
        etiquetas: item.transacoes_financeiras_etiquetas?.map((te: any) => te.etiquetas).filter(Boolean) || []
      };
    }) || [];

    // Aplicar filtros de etiquetas no JavaScript (após buscar todos os dados)
    let filteredTransacoes = formattedTransacoes;

    // Filtrar por etiquetas que DEVEM estar presentes
    if (filters.tagsEquals?.length) {
      filteredTransacoes = filteredTransacoes.filter(transacao => 
        filters.tagsEquals!.every(tagId => 
          transacao.etiquetas.some(etiqueta => etiqueta.id === tagId)
        )
      );
    }

    // Filtrar por etiquetas que NÃO devem estar presentes
    if (filters.tagsNotEquals?.length) {
      filteredTransacoes = filteredTransacoes.filter(transacao => 
        !transacao.etiquetas.some(etiqueta => 
          filters.tagsNotEquals!.includes(etiqueta.id)
        )
      );
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filteredTransacoes = filteredTransacoes.filter(transacao =>
        (transacao.contato.nome || '').toLowerCase().includes(searchLower) ||
        (transacao.contato.cpf_cnpj || '').includes(filters.searchTerm!) ||
        (transacao.numero_documento || '').toLowerCase().includes(searchLower) ||
        (transacao.historico || '').toLowerCase().includes(searchLower)
      );
    }

    if (filters.tipo && filters.tipo !== 'todas') {
      filteredTransacoes = filteredTransacoes.filter(transacao => {
        const now = new Date();
        const isVencida = transacao.situacao === 'aberta' && new Date(transacao.data_vencimento) < now;
        
        switch (filters.tipo) {
          case 'a-receber':
            if (filters.vencidas) {
              return transacao.tipo === 'receber' && isVencida;
            }
            return transacao.tipo === 'receber' && transacao.situacao === 'aberta';
          case 'a-pagar':
            if (filters.vencidas) {
              return transacao.tipo === 'pagar' && isVencida;
            }
            return transacao.tipo === 'pagar' && transacao.situacao === 'aberta';
          case 'recebidas':
            return transacao.tipo === 'receber' && transacao.situacao === 'recebida';
          case 'pagas':
            return transacao.tipo === 'pagar' && transacao.situacao === 'paga';
          default:
            return true;
        }
      });
    }

    return filteredTransacoes;
    } catch (error) {
      console.error('Erro ao processar transações:', error);
      throw error;
    }
  };

  const transacoesQuery = useQuery({
    queryKey: ['transacoes', filters],
    queryFn: fetchTransacoes,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Mutation para atualizar transação
  const updateTransacaoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TransacaoFinanceira> & { id: string }) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a transação",
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar transação
  const deleteTransacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transacoes'] });
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir transação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transação",
        variant: "destructive",
      });
    },
  });

  return {
    transacoes: transacoesQuery.data || [],
    loading: transacoesQuery.isLoading,
    error: transacoesQuery.error,
    updateTransacao: updateTransacaoMutation.mutate,
    deleteTransacao: deleteTransacaoMutation.mutate,
    refetch: transacoesQuery.refetch,
  };
}