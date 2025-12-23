import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EstoqueMovimentacao {
  id: string;
  tenant_id: string;
  produto_id: string;
  local_origem_id?: string;
  local_destino_id?: string;
  tipo_movimentacao: 'entrada' | 'saida' | 'ajuste' | 'transferencia';
  quantidade: number;
  valor_unitario?: number;
  valor_total?: number;
  documento_origem?: string;
  chave_nfe?: string;
  origem_modulo?: string;
  referencia_id?: string;
  data_movimentacao: string;
  observacao?: string;
  produto?: {
    descricao: string;
    codigo_interno: string;
  };
}

export interface EstoqueSaldo {
  produto_id: string;
  localizacao_id: string;
  quantidade: number;
  custo_medio: number;
  produto?: {
    descricao: string;
    codigo_interno: string;
  };
  localizacao?: {
    nome: string;
  };
}

export const useEstoque = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: movimentacoes, isLoading: isLoadingMovimentacoes } = useQuery({
    queryKey: ['estoque_movimentacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          *,
          produto:produtos(descricao, codigo_interno)
        `)
        .order('data_movimentacao', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EstoqueMovimentacao[];
    },
  });

  const { data: saldos, isLoading: isLoadingSaldos } = useQuery({
    queryKey: ['estoque_saldos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_saldos')
        .select(`
          *,
          produto:produtos(descricao, codigo_interno),
          localizacao:estoque_localizacoes(nome)
        `);

      if (error) throw error;
      return data as EstoqueSaldo[];
    },
  });

  const createMovimentacaoMutation = useMutation({
    mutationFn: async (
      movimentacao: Omit<EstoqueMovimentacao, 'id' | 'tenant_id'>
    ) => {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .insert({
          ...movimentacao,
          tenant_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estoque_movimentacoes'] });
      queryClient.invalidateQueries({ queryKey: ['estoque_saldos'] });
      toast({
        title: 'Sucesso',
        description: 'Movimentação registrada com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao registrar movimentação',
        variant: 'destructive',
      });
    },
  });

  return {
    movimentacoes,
    saldos,
    isLoadingMovimentacoes,
    isLoadingSaldos,
    createMovimentacao: createMovimentacaoMutation.mutate,
    isCreating: createMovimentacaoMutation.isPending,
  };
};
