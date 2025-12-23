import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Venda {
  id: string;
  tenant_id: string;
  fornecedor_id: string; // cliente
  tipo: string;
  numero_nfe?: string;
  chave_nfe?: string;
  data_emissao?: string;
  valor_total: number;
  status: 'pendente' | 'aprovada' | 'cancelada';
  observacoes?: string;
  cliente?: {
    nome_fantasia: string;
    cpf_cnpj?: string;
  };
}

export interface ItemVenda {
  id?: string;
  produto_id?: string;
  codigo_produto: string;
  descricao: string;
  ncm?: string;
  cfop?: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  aliquota_icms?: number;
  aliquota_pis?: number;
  aliquota_cofins?: number;
  valor_ipi?: number;
}

export const useVendas = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vendas, isLoading } = useQuery({
    queryKey: ['vendas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .order('data_emissao', { ascending: false });

      if (error) throw error;
      
      // Buscar dados dos clientes manualmente
      if (data && data.length > 0) {
        const fornecedorIds = data.map(v => v.fornecedor_id).filter(Boolean);
        if (fornecedorIds.length > 0) {
          const { data: fornecedores } = await supabase
            .from('contatos_v2')
            .select('id, nome_fantasia, cpf_cnpj')
            .in('id', fornecedorIds);
          
          // Mapear fornecedores para vendas
          return data.map(venda => ({
            ...venda,
            cliente: fornecedores?.find(f => f.id === venda.fornecedor_id)
          })) as Venda[];
        }
      }
      
      return data as Venda[];
    },
  });

  const createVendaMutation = useMutation({
    mutationFn: async (data: {
      venda: Omit<Venda, 'id' | 'tenant_id'>;
      itens: ItemVenda[];
      parcelas?: Array<{
        numero_parcela: number;
        data_vencimento: string;
        valor: number;
      }>;
    }) => {
      const { data: vendaData, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          ...data.venda,
          tenant_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Inserir itens
      if (data.itens.length > 0) {
        const { error: itensError } = await supabase
          .from('vendas_itens')
          .insert(
            data.itens.map((item) => ({
              venda_id: vendaData.id,
              ...item,
            }))
          );

        if (itensError) throw itensError;
      }

      // Inserir parcelas
      if (data.parcelas && data.parcelas.length > 0) {
        const { error: parcelasError } = await supabase
          .from('vendas_parcelas')
          .insert(
            data.parcelas.map((parcela) => ({
              venda_id: vendaData.id,
              ...parcela,
            }))
          );

        if (parcelasError) throw parcelasError;
      }

      return vendaData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Sucesso',
        description: 'Venda registrada com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao registrar venda',
        variant: 'destructive',
      });
    },
  });

  const aprovarVendaMutation = useMutation({
    mutationFn: async (vendaId: string) => {
      // Usa a função que gera financeiro automaticamente
      const { error } = await supabase.rpc(
        'fn_aprovar_venda',
        { p_venda_id: vendaId }
      );

      if (error) throw error;

      return vendaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Sucesso',
        description: 'Venda aprovada e títulos financeiros gerados!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar venda',
        variant: 'destructive',
      });
    },
  });

  const deletarVendaMutation = useMutation({
    mutationFn: async (vendaId: string) => {
      // Deletar itens
      await supabase.from('vendas_itens').delete().eq('venda_id', vendaId);
      
      // Deletar parcelas
      await supabase.from('vendas_parcelas').delete().eq('venda_id', vendaId);
      
      // Deletar venda
      const { error } = await supabase
        .from('vendas')
        .delete()
        .eq('id', vendaId);

      if (error) throw error;

      return vendaId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast({
        title: 'Sucesso',
        description: 'Venda excluída com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir venda',
        variant: 'destructive',
      });
    },
  });

  return {
    vendas,
    isLoading,
    createVenda: createVendaMutation.mutate,
    aprovarVenda: aprovarVendaMutation.mutate,
    deletarVenda: deletarVendaMutation.mutate,
    isCreating: createVendaMutation.isPending,
    isApproving: aprovarVendaMutation.isPending,
    isDeleting: deletarVendaMutation.isPending,
  };
};
