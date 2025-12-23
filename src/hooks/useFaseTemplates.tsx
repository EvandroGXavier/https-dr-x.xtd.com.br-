import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface FaseTemplate {
  id?: string;
  etiqueta_fase_id: string;
  etiqueta_fase_nome?: string;
  tarefa_descricao: string;
  alerta_dias: number | null;
  etiqueta_auto_id: string | null;
  etiqueta_auto_nome?: string;
}

export const useFaseTemplates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os templates de fase
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["fase_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("processos_fase_templates")
        .select("*")
        .order("created_at");

      if (error) throw error;

      return (data || []).map((template) => ({
        id: template.id,
        etiqueta_fase_id: template.etiqueta_fase_id,
        tarefa_descricao: template.tarefa_descricao,
        alerta_dias: template.alerta_dias,
        etiqueta_auto_id: template.etiqueta_auto_id,
      })) as FaseTemplate[];
    },
    enabled: !!user,
  });

  // Criar novo template
  const createTemplate = useMutation({
    mutationFn: async (template: Omit<FaseTemplate, "id">) => {
      const { data, error } = await supabase
        .from("processos_fase_templates")
        .insert({
          etiqueta_fase_id: template.etiqueta_fase_id,
          tarefa_descricao: template.tarefa_descricao,
          alerta_dias: template.alerta_dias,
          etiqueta_auto_id: template.etiqueta_auto_id,
          tenant_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fase_templates"] });
      toast({
        title: "Template criado",
        description: "Template de fase criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar template
  const updateTemplate = useMutation({
    mutationFn: async (template: FaseTemplate) => {
      if (!template.id) throw new Error("ID do template não fornecido");

      const { data, error } = await supabase
        .from("processos_fase_templates")
        .update({
          etiqueta_fase_id: template.etiqueta_fase_id,
          tarefa_descricao: template.tarefa_descricao,
          alerta_dias: template.alerta_dias,
          etiqueta_auto_id: template.etiqueta_auto_id,
        })
        .eq("id", template.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fase_templates"] });
      toast({
        title: "Template atualizado",
        description: "Template de fase atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("processos_fase_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fase_templates"] });
      toast({
        title: "Template removido",
        description: "Template de fase removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
};
