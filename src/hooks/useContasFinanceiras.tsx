import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContaFinanceira {
  id: string;
  nome: string;
  tipo: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  saldo_inicial: number;
  saldo_atual: number;
  observacoes?: string;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export function useContasFinanceiras() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchContas = async (): Promise<ContaFinanceira[]> => {
    const { data, error } = await supabase
      .from('contas_financeiras')
      .select('*')
      .eq('ativa', true)
      .order('nome', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const contasQuery = useQuery({
    queryKey: ['contas-financeiras'],
    queryFn: fetchContas,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const createContaMutation = useMutation({
    mutationFn: async (novaConta: Partial<ContaFinanceira>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const dataToInsert: any = {
        ...novaConta,
        saldo_atual: novaConta.saldo_inicial || 0,
      };

      // Add user_id separately to avoid TypeScript errors
      (dataToInsert as any).user_id = user.id;

      const { data, error } = await supabase
        .from('contas_financeiras')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-financeiras'] });
      toast({
        title: "Sucesso",
        description: "Conta financeira criada com sucesso",
      });
    },
    onError: (error) => {
      console.error('Erro ao criar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a conta financeira",
        variant: "destructive",
      });
    },
  });

  const updateContaMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContaFinanceira> & { id: string }) => {
      const { error } = await supabase
        .from('contas_financeiras')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-financeiras'] });
      toast({
        title: "Sucesso",
        description: "Conta financeira atualizada com sucesso",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar conta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a conta financeira",
        variant: "destructive",
      });
    },
  });

  const deleteContaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas-financeiras'] });
      toast({
        title: "Sucesso",
        description: "Conta financeira excluída com sucesso",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir conta:', error);
      const message = error.message?.includes('violates foreign key') 
        ? "Não é possível excluir esta conta pois existem transações vinculadas a ela"
        : "Não foi possível excluir a conta financeira";
      
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    },
  });

  return {
    contas: contasQuery.data || [],
    loading: contasQuery.isLoading,
    error: contasQuery.error,
    createConta: createContaMutation.mutate,
    updateConta: updateContaMutation.mutate,
    deleteConta: deleteContaMutation.mutate,
    refetch: contasQuery.refetch,
  };
}
