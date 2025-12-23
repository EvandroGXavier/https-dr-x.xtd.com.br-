import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ProcessoConfig {
  id?: string;
  tenant_id?: string;
  template_oportunidade?: string | null;
  status_padrao?: string | null;
  created_at?: string;
  updated_at?: string;
}

const fetchProcessoConfig = async () => {
  const { data, error } = await supabase
    .from("processos_config")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message);
  }
  return data;
};

const upsertProcessoConfig = async (config: ProcessoConfig) => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new Error("Usuário não autenticado");

  const payload = { 
    ...config, 
    tenant_id: userId,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("processos_config")
    .upsert(payload, { onConflict: 'tenant_id' })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const useProcessoConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["processoConfig"];

  const { data, isLoading, isError } = useQuery<ProcessoConfig | null>({
    queryKey,
    queryFn: fetchProcessoConfig,
  });

  const mutation = useMutation({
    mutationFn: upsertProcessoConfig,
    onSuccess: (updatedConfig) => {
      queryClient.setQueryData(queryKey, updatedConfig);
      toast({
        title: "Sucesso",
        description: "Configurações de processos salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações. " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    config: data,
    isLoading,
    isError,
    saveConfig: mutation.mutate,
    isSaving: mutation.isPending,
  };
};
