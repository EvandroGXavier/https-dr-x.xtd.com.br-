import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Compra {
  id: string;
  tenant_id: string;
  fornecedor_id: string;
  tipo: 'consumo' | 'revenda' | 'servico';
  numero_nfe?: string;
  chave_nfe?: string;
  data_emissao?: string;
  valor_total: number;
  status: 'pendente' | 'aprovada' | 'cancelada';
  observacoes?: string;
  fornecedor?: {
    nome_fantasia: string;
    cpf_cnpj?: string;
  };
}

export interface ItemCompra {
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

export const useCompras = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: compras, isLoading } = useQuery({
    queryKey: ['compras'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select(`
          *,
          fornecedor:contatos_v2(nome_fantasia, cpf_cnpj)
        `)
        .order('data_emissao', { ascending: false });

      if (error) throw error;
      return data as Compra[];
    },
  });

  const createCompraMutation = useMutation({
    mutationFn: async (data: {
      compra: Omit<Compra, 'id' | 'tenant_id'>;
      itens: ItemCompra[];
      parcelas?: Array<{
        numero_parcela: number;
        data_vencimento: string;
        valor: number;
      }>;
    }) => {
      const { data: compraData, error: compraError } = await supabase
        .from('compras')
        .insert({
          ...data.compra,
          tenant_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (compraError) throw compraError;

      // Inserir itens
      if (data.itens.length > 0) {
        const { error: itensError } = await supabase
          .from('compras_itens')
          .insert(
            data.itens.map((item) => ({
              compra_id: compraData.id,
              ...item,
            }))
          );

        if (itensError) throw itensError;
      }

      // Inserir parcelas
      if (data.parcelas && data.parcelas.length > 0) {
        const { error: parcelasError } = await supabase
          .from('compras_parcelas')
          .insert(
            data.parcelas.map((parcela) => ({
              compra_id: compraData.id,
              ...parcela,
            }))
          );

        if (parcelasError) throw parcelasError;
      }

      return compraData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      toast({
        title: 'Sucesso',
        description: 'Compra registrada com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao registrar compra',
        variant: 'destructive',
      });
    },
  });

  const aprovarCompraMutation = useMutation({
    mutationFn: async (compraId: string) => {
      // Usa a função que gera financeiro automaticamente
      const { error } = await supabase.rpc(
        'fn_aprovar_compra',
        { p_compra_id: compraId }
      );

      if (error) throw error;

      return compraId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      toast({
        title: 'Sucesso',
        description: 'Compra aprovada e títulos financeiros gerados!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar compra',
        variant: 'destructive',
      });
    },
  });

  const deletarCompraMutation = useMutation({
    mutationFn: async (compraId: string) => {
      // Deletar itens
      await supabase.from('compras_itens').delete().eq('compra_id', compraId);
      
      // Deletar parcelas
      await supabase.from('compras_parcelas').delete().eq('compra_id', compraId);
      
      // Deletar compra
      const { error } = await supabase
        .from('compras')
        .delete()
        .eq('id', compraId);

      if (error) throw error;

      return compraId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] });
      toast({
        title: 'Sucesso',
        description: 'Compra excluída com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir compra',
        variant: 'destructive',
      });
    },
  });

  return {
    compras,
    isLoading,
    createCompra: createCompraMutation.mutate,
    aprovarCompra: aprovarCompraMutation.mutate,
    deletarCompra: deletarCompraMutation.mutate,
    isCreating: createCompraMutation.isPending,
    isApproving: aprovarCompraMutation.isPending,
    isDeleting: deletarCompraMutation.isPending,
  };
};
