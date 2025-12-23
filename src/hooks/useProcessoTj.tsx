import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { ProcessoTj } from "@/types/processos";

export const useProcessoTj = (processoId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar dados judiciais
  const { data: processoTj, isLoading } = useQuery({
    queryKey: ["processo-tj", processoId],
    queryFn: async () => {
      if (!user || !processoId) return null;

      const { data, error } = await supabase
        .from("processos_tj")
        .select("*")
        .eq("processo_id", processoId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ProcessoTj | null;
    },
    enabled: !!user && !!processoId,
  });

  // Mutation para criar/atualizar dados judiciais via UPSERT
  const saveMutation = useMutation({
    mutationFn: async (data: Partial<ProcessoTj>) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (!processoId) throw new Error("ID do processo inválido");

      // Buscar tenant_id do profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.empresa_id) {
        throw new Error("Usuário não possui empresa configurada");
      }

      // Sanitizar dados - converter strings vazias para null
      const sanitizeData = (obj: Record<string, unknown>) => {
        const sanitized: Record<string, unknown> = {};
        for (const key in obj) {
          const value = obj[key];
          if (value === "" || value === undefined) {
            sanitized[key] = null;
          } else {
            sanitized[key] = value;
          }
        }
        return sanitized;
      };

      // Remove campos protegidos e sanitiza
      const { id: _id, tenant_id: _t, user_id: _u, created_at: _c, criado_em: _cr, atualizado_em: _at, updated_at: _ua, ...editaveis } = data as Record<string, unknown>;
      const sanitizedData = sanitizeData(editaveis);

      // Payload para UPSERT
      const payload = {
        ...sanitizedData,
        processo_id: processoId,
        tenant_id: profile.empresa_id,
        numero_oficial: (sanitizedData.numero_oficial || sanitizedData.numero_cnj || 'SEM NÚMERO') as string,
        origem_dados: (sanitizedData.origem_dados || 'manual') as string,
      };

      const { data: result, error } = await supabase
        .from("processos_tj")
        .upsert([payload], { onConflict: 'processo_id' })
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar dados judiciais:", error);
        throw error;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-tj", processoId] });
      toast.success("Dados judiciais salvos com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Erro detalhado ao salvar dados judiciais:", error);
      toast.error(error.message || "Erro ao salvar dados judiciais");
    },
  });

  // Mutation para remover dados judiciais
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!processoTj) return;
      
      const { error } = await supabase
        .from("processos_tj")
        .delete()
        .eq("id", processoTj.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-tj", processoId] });
      toast.success("Dados judiciais removidos");
    },
  });

  return {
    processoTj,
    isLoading,
    save: saveMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
};
