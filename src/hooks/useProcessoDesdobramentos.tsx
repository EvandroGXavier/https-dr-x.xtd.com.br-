import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ProcessoDesdobramento {
  id: string;
  user_id: string;
  processo_principal_id: string;
  numero_processo: string;
  tipo: string;
  status: 'ativo' | 'finalizado' | 'suspenso' | 'arquivado';
  tribunal?: string;
  comarca?: string;
  vara?: string;
  data_distribuicao?: string;
  descricao?: string;
  created_at: string;
  updated_at: string;
}

export function useProcessoDesdobramentos(processoId: string) {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  const { data: desdobramentos, isLoading } = useQuery({
    queryKey: ["processo-desdobramentos", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processo_desdobramentos")
        .select("*")
        .eq("processo_principal_id", processoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  const createDesdobramento = useMutation({
    mutationFn: async (desdobramento: Partial<ProcessoDesdobramento>) => {
      if (!desdobramento.numero_processo || !desdobramento.tipo) {
        throw new Error("Número do processo e tipo são obrigatórios");
      }

      if (!profile?.empresa_id) {
        throw new Error("Usuário não possui empresa configurada");
      }

      const { data, error } = await supabase
        .from("processo_desdobramentos")
        .insert({
          numero_processo: desdobramento.numero_processo,
          tipo: desdobramento.tipo,
          status: desdobramento.status || 'ativo',
          tribunal: desdobramento.tribunal,
          comarca: desdobramento.comarca,
          vara: desdobramento.vara,
          data_distribuicao: desdobramento.data_distribuicao,
          descricao: desdobramento.descricao,
          user_id: user?.id,
          tenant_id: profile.empresa_id,
          processo_principal_id: processoId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-desdobramentos", processoId] });
    },
  });

  const updateDesdobramento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoDesdobramento> & { id: string }) => {
      const { data, error } = await supabase
        .from("processo_desdobramentos")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-desdobramentos", processoId] });
    },
  });

  const deleteDesdobramento = useMutation({
    mutationFn: async (desdobramentoId: string) => {
      const { error } = await supabase
        .from("processo_desdobramentos")
        .delete()
        .eq("id", desdobramentoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-desdobramentos", processoId] });
    },
  });

  return {
    desdobramentos,
    isLoading,
    createDesdobramento: createDesdobramento.mutateAsync,
    updateDesdobramento: updateDesdobramento.mutateAsync,
    deleteDesdobramento: deleteDesdobramento.mutateAsync,
    isCreating: createDesdobramento.isPending,
    isUpdating: updateDesdobramento.isPending,
    isDeleting: deleteDesdobramento.isPending,
  };
}