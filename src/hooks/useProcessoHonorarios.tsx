import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ProcessoHonorario {
  id: string;
  user_id: string;
  processo_id: string;
  objeto: string;
  status: 'rascunho' | 'aprovado' | 'assinado' | 'cancelado';
  valor_total_definido: number;
  valor_total_cobrado: number;
  justificativa_diferenca?: string;
  cha_gerado: boolean;
  cha_documento_id?: string;
  data_aprovacao?: string;
  data_assinatura?: string;
  assinatura_nome?: string;
  assinatura_email?: string;
  assinatura_ip?: string;
  assinatura_metodo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessoHonorarioItem {
  id: string;
  user_id: string;
  honorario_id: string;
  tipo: 'inicial' | 'mensal' | 'exito' | 'outros';
  descricao: string;
  valor_definido?: number;
  valor_cobrado?: number;
  percentual_exito?: number;
  referencia_oab?: string;
  observacoes?: string;
  created_at: string;
}

export interface ProcessoHonorarioParcela {
  id: string;
  user_id: string;
  honorario_item_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  status: 'pendente' | 'vencida' | 'paga' | 'cancelada';
  transacao_financeira_id?: string;
  recorrente: boolean;
  dia_vencimento?: number;
  observacoes?: string;
  created_at: string;
}

export interface ProcessoHonorarioEvento {
  id: string;
  user_id: string;
  honorario_id: string;
  tipo: 'criado' | 'modelo_aplicado' | 'valor_alterado' | 'aprovado' | 'assinado' | 'titulo_gerado' | 'exito_recebido';
  descricao: string;
  dados_antes?: any;
  dados_depois?: any;
  metadata?: any;
  created_at: string;
}

export function useProcessoHonorarios(processoId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const { data: honorarios, isLoading } = useQuery({
    queryKey: ["processo-honorarios", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processo_honorarios")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  const { data: itens, isLoading: isLoadingItens } = useQuery({
    queryKey: ["processo-honorarios-itens", processoId],
    queryFn: async () => {
      if (!honorarios?.length) return [];
      
      const honorarioIds = honorarios.map(h => h.id);
      const { data, error } = await supabase
        .from("processo_honorarios_item")
        .select("*")
        .in("honorario_id", honorarioIds)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!honorarios?.length,
  });

  const { data: parcelas, isLoading: isLoadingParcelas } = useQuery({
    queryKey: ["processo-honorarios-parcelas", processoId],
    queryFn: async () => {
      if (!itens?.length) return [];
      
      const itemIds = itens.map(i => i.id);
      const { data, error } = await supabase
        .from("processo_honorarios_parcela")
        .select("*")
        .in("honorario_item_id", itemIds)
        .order("data_vencimento", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!itens?.length,
  });

  const { data: eventos, isLoading: isLoadingEventos } = useQuery({
    queryKey: ["processo-honorarios-eventos", processoId],
    queryFn: async () => {
      if (!honorarios?.length) return [];
      
      const honorarioIds = honorarios.map(h => h.id);
      const { data, error } = await supabase
        .from("processo_honorarios_eventos")
        .select("*")
        .in("honorario_id", honorarioIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!honorarios?.length,
  });

  const createHonorario = useMutation({
    mutationFn: async (honorario: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!profile?.empresa_id) throw new Error("Usuário não possui empresa configurada");

      const { data, error } = await supabase
        .from("processo_honorarios")
        .insert({
          ...honorario,
          user_id: user.id,
          tenant_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-eventos", processoId] });
      toast.success("Honorário criado com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao criar honorário:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error(error.message || "Erro ao criar honorário");
    },
  });

  const updateHonorario = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoHonorario> & { id: string }) => {
      // Remove campos protegidos
      const { tenant_id, user_id, created_at, ...editaveis } = updates as any;
      
      const { data, error } = await supabase
        .from("processo_honorarios")
        .update(editaveis)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      toast.success("Honorário atualizado com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao atualizar honorário:", error);
      toast.error(error.message || "Erro ao atualizar honorário");
    },
  });

  const deleteHonorario = useMutation({
    mutationFn: async (honorarioId: string) => {
      const { error } = await supabase
        .from("processo_honorarios")
        .delete()
        .eq("id", honorarioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!profile?.empresa_id) throw new Error("Usuário não possui empresa configurada");

      const { data, error } = await supabase
        .from("processo_honorarios_item")
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
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      toast.success("Item criado com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao criar item:", error);
      toast.error(error.message || "Erro ao criar item");
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoHonorarioItem> & { id: string }) => {
      // Remove campos protegidos
      const { tenant_id, user_id, created_at, ...editaveis } = updates as any;
      
      const { data, error } = await supabase
        .from("processo_honorarios_item")
        .update(editaveis)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
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
        .from("processo_honorarios_item")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
    },
  });

  const createParcela = useMutation({
    mutationFn: async (parcela: any) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!profile?.empresa_id) throw new Error("Usuário não possui empresa configurada");

      const { data, error } = await supabase
        .from("processo_honorarios_parcela")
        .insert({
          ...parcela,
          user_id: user.id,
          tenant_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-itens", processoId] });
      toast.success("Parcela criada com sucesso");
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao criar parcela:", error);
      toast.error(error.message || "Erro ao criar parcela");
    },
  });

  const updateParcela = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoHonorarioParcela> & { id: string }) => {
      // Remove campos protegidos
      const { tenant_id, user_id, created_at, ...editaveis } = updates as any;
      
      const { data, error } = await supabase
        .from("processo_honorarios_parcela")
        .update(editaveis)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
      toast.success("Parcela atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao atualizar parcela:", error);
      toast.error("Erro ao atualizar parcela");
    },
  });

  const deleteParcela = useMutation({
    mutationFn: async (parcelaId: string) => {
      const { error } = await supabase
        .from("processo_honorarios_parcela")
        .delete()
        .eq("id", parcelaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
    },
  });

  const aprovarHonorario = useMutation({
    mutationFn: async (honorarioId: string) => {
      const { data, error } = await supabase
        .from("processo_honorarios")
        .update({ 
          status: 'aprovado',
          data_aprovacao: new Date().toISOString()
        })
        .eq("id", honorarioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-eventos", processoId] });
    },
  });

  const assinarHonorario = useMutation({
    mutationFn: async ({ 
      honorarioId, 
      nome, 
      email, 
      metodo 
    }: { 
      honorarioId: string; 
      nome: string; 
      email: string; 
      metodo: string; 
    }) => {
      const { data, error } = await supabase
        .from("processo_honorarios")
        .update({ 
          status: 'assinado',
          data_assinatura: new Date().toISOString(),
          assinatura_nome: nome,
          assinatura_email: email,
          assinatura_metodo: metodo
        })
        .eq("id", honorarioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-eventos", processoId] });
    },
  });

  const gerarTitulosFinanceiros = useMutation({
    mutationFn: async (honorarioId: string) => {
      const { data, error } = await supabase.rpc('gerar_titulos_honorarios', {
        honorario_id_param: honorarioId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios", processoId] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-parcelas", processoId] });
      queryClient.invalidateQueries({ queryKey: ["transacoes-financeiras"] });
      queryClient.invalidateQueries({ queryKey: ["processo-honorarios-eventos", processoId] });
    },
    onError: (error: any) => {
      console.error("Erro detalhado ao gerar títulos financeiros:", error);
      toast.error(error.message || "Erro ao gerar títulos financeiros");
    },
  });

  return {
    honorarios,
    itens,
    parcelas,
    eventos,
    isLoading: isLoading || isLoadingItens || isLoadingParcelas || isLoadingEventos,
    createHonorario: createHonorario.mutateAsync,
    updateHonorario: updateHonorario.mutateAsync,
    deleteHonorario: deleteHonorario.mutateAsync,
    createItem: createItem.mutateAsync,
    updateItem: updateItem.mutateAsync,
    deleteItem: deleteItem.mutateAsync,
    createParcela: createParcela.mutateAsync,
    updateParcela: updateParcela.mutateAsync,
    deleteParcela: deleteParcela.mutateAsync,
    aprovarHonorario: aprovarHonorario.mutateAsync,
    assinarHonorario: assinarHonorario.mutateAsync,
    gerarTitulosFinanceiros: gerarTitulosFinanceiros.mutateAsync,
    isCreating: createHonorario.isPending,
    isUpdating: updateHonorario.isPending || aprovarHonorario.isPending || assinarHonorario.isPending,
    isDeleting: deleteHonorario.isPending,
    isGeneratingTitulos: gerarTitulosFinanceiros.isPending,
  };
}