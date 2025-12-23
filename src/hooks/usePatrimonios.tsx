import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Patrimonio, PatrimonioFormData } from "@/types/patrimonio";
import { useAuth } from "@/hooks/useAuth";

export const usePatrimonios = (contatoId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();

  // Query para buscar patrimônios de um contato
  const { data: patrimonios = [], isLoading } = useQuery({
    queryKey: ['patrimonios', contatoId],
    queryFn: async () => {
      if (!contatoId) return [];

      const { data, error } = await supabase
        .from('contato_patrimonios')
        .select('*')
        .eq('contato_id', contatoId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Patrimonio[];
    },
    enabled: !!contatoId,
  });

  // Mutation para criar patrimônio
  const createMutation = useMutation({
    mutationFn: async (data: PatrimonioFormData & { contato_id: string }) => {
      const tenantId = profile?.empresa_id;
      if (!tenantId) {
        throw new Error('Empresa não configurada no perfil do usuário');
      }
      const userId = user?.id || (await supabase.auth.getUser()).data.user?.id;

      const { data: result, error } = await supabase
        .from('contato_patrimonios')
        .insert([{ 
          ...data, 
          tenant_id: tenantId,
          user_id: userId!,
          empresa_id: null,
          filial_id: null,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonios', contatoId] });
      toast({
        title: "Sucesso",
        description: "Patrimônio criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao criar patrimônio: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar patrimônio
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PatrimonioFormData> }) => {
      const { data: result, error } = await supabase
        .from('contato_patrimonios')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonios', contatoId] });
      toast({
        title: "Sucesso",
        description: "Patrimônio atualizado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar patrimônio: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation para deletar patrimônio
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contato_patrimonios')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patrimonios', contatoId] });
      toast({
        title: "Sucesso",
        description: "Patrimônio excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao excluir patrimônio: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    patrimonios,
    isLoading,
    createPatrimonio: createMutation.mutateAsync,
    updatePatrimonio: updateMutation.mutateAsync,
    deletePatrimonio: deleteMutation.mutateAsync,
  };
};
