import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ProcessoContrato {
  id: string;
  user_id: string;
  processo_id: string;
  cliente_contrato_id: string;
  tipo: 'honorarios' | 'acordo_judicial' | 'compra_venda' | 'outros';
  status: 'rascunho' | 'enviado' | 'aprovado' | 'assinado' | 'cancelado';
  titulo: string;
  descricao?: string;
  observacoes?: string;
  valor_total?: number;
  documento_nome?: string;
  documento_gerado_url?: string;
  data_envio?: string;
  data_aprovacao?: string;
  data_assinatura?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessoContratoItem {
  id: string;
  user_id: string;
  contrato_id: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  data_vencimento: string;
  parcela_numero?: number;
  total_parcelas?: number;
  observacoes?: string;
  created_at: string;
}

export function useProcessoContratos(processoId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const { data: contratos, isLoading } = useQuery({
    queryKey: ["processo-contratos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processo_contratos")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  const createContrato = useMutation({
    mutationFn: async (contrato: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!profile?.empresa_id) throw new Error("Usuário não possui empresa configurada");

      const { data, error } = await supabase
        .from("processo_contratos")
        .insert({
          ...contrato,
          user_id: user.id,
          tenant_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contratos", processoId] });
      toast.success("Contrato criado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar contrato:", error);
      toast.error("Erro ao criar contrato");
    },
  });

  const updateContrato = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoContrato> & { id: string }) => {
      // Remove campos protegidos para evitar tenant-hopping
      const { tenant_id, user_id, created_at, ...editaveis } = updates as any;
      
      const { data, error } = await supabase
        .from("processo_contratos")
        .update(editaveis)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contratos", processoId] });
      toast.success("Contrato atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar contrato:", error);
      toast.error("Erro ao atualizar contrato");
    },
  });

  const deleteContrato = useMutation({
    mutationFn: async (contratoId: string) => {
      const { error } = await supabase
        .from("processo_contratos")
        .delete()
        .eq("id", contratoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contratos", processoId] });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ contratoId, status }: { contratoId: string; status: string }) => {
      const updates: any = { status };
      
      // Add timestamp fields based on status
      if (status === 'enviado') {
        updates.data_envio = new Date().toISOString();
      } else if (status === 'aprovado') {
        updates.data_aprovacao = new Date().toISOString();
      } else if (status === 'assinado') {
        updates.data_assinatura = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from("processo_contratos")
        .update(updates)
        .eq("id", contratoId)
        .select()
        .single();

      if (error) throw error;

      // If status is approved or signed, generate financial transactions
      if (status === 'aprovado' || status === 'assinado') {
        try {
          const { data: financeData, error: financeError } = await supabase.rpc('gerar_transacoes_de_contrato', {
            contrato_id_param: contratoId
          });
          
          if (financeError) {
            console.error('Erro ao gerar transações financeiras:', financeError);
          } else {
            console.log('Transações financeiras geradas:', financeData);
          }
        } catch (error) {
          console.error('Erro na geração de transações:', error);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contratos", processoId] });
    },
  });

  const gerarTransacoesFinanceiras = useMutation({
    mutationFn: async (contratoId: string) => {
      const { data, error } = await supabase.rpc('gerar_transacoes_de_contrato', {
        contrato_id_param: contratoId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contratos"] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
    },
  });

  return {
    contratos,
    isLoading,
    createContrato: createContrato.mutateAsync,
    updateContrato: updateContrato.mutateAsync,
    deleteContrato: deleteContrato.mutateAsync,
    updateStatus: (contratoId: string, status: string) => 
      updateStatus.mutateAsync({ contratoId, status }),
    gerarTransacoesFinanceiras: gerarTransacoesFinanceiras.mutateAsync,
    isCreating: createContrato.isPending,
    isUpdating: updateContrato.isPending || updateStatus.isPending,
    isDeleting: deleteContrato.isPending,
    isGeneratingTransactions: gerarTransacoesFinanceiras.isPending,
  };
}

export function useProcessoContratoItens(contratoId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const { data: itens, isLoading } = useQuery({
    queryKey: ["processo-contrato-itens", contratoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processo_contrato_itens")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("parcela_numero", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!contratoId,
  });

  const createItem = useMutation({
    mutationFn: async (item: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!profile?.empresa_id) throw new Error("Usuário não possui empresa configurada");

      const { data, error } = await supabase
        .from("processo_contrato_itens")
        .insert({
          ...item,
          user_id: user.id,
          tenant_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contrato-itens", contratoId] });
      toast.success("Item criado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao criar item:", error);
      toast.error("Erro ao criar item");
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoContratoItem> & { id: string }) => {
      // Remove campos protegidos
      const { tenant_id, user_id, created_at, ...editaveis } = updates as any;
      
      const { data, error } = await supabase
        .from("processo_contrato_itens")
        .update(editaveis)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contrato-itens", contratoId] });
      toast.success("Item atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar item:", error);
      toast.error("Erro ao atualizar item");
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("processo_contrato_itens")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-contrato-itens", contratoId] });
    },
  });

  return {
    itens,
    isLoading,
    createItem: createItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    isCreating: createItem.isPending,
    isUpdating: updateItem.isPending,
    isDeleting: deleteItem.isPending,
  };
}