import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AgendaConfig {
  id: string;
  nome_fluxo: string;
  tipo: string;
  modulo_origem: string;
  responsavel_padrao: string | null;
  prazo_padrao_minutos: number;
  participantes_padrao: any[];
  descricao_padrao: string | null;
  gatilho: string;
  ativo: boolean;
  tenant_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useAgendaConfig = () => {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['agenda-configuracoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agenda_configuracoes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgendaConfig[];
    },
  });

  const createConfig = useMutation({
    mutationFn: async (config: Partial<AgendaConfig>) => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('Usuário não autenticado');

      const { data, error} = await supabase
        .from('agenda_configuracoes')
        .insert([
          {
            nome_fluxo: config.nome_fluxo!,
            tipo: config.tipo!,
            modulo_origem: config.modulo_origem!,
            gatilho: config.gatilho!,
            responsavel_padrao: config.responsavel_padrao,
            prazo_padrao_minutos: config.prazo_padrao_minutos,
            participantes_padrao: config.participantes_padrao as any,
            descricao_padrao: config.descricao_padrao,
            ativo: config.ativo ?? true,
            tenant_id: currentUser.id,
            created_by: currentUser.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-configuracoes'] });
      toast({
        title: 'Configuração criada',
        description: 'O fluxo de agenda foi configurado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar configuração',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<AgendaConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('agenda_configuracoes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-configuracoes'] });
      toast({
        title: 'Configuração atualizada',
        description: 'O fluxo foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('agenda_configuracoes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-configuracoes'] });
      toast({
        title: 'Configuração excluída',
        description: 'O fluxo foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleConfig = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('agenda_configuracoes')
        .update({ ativo })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-configuracoes'] });
      toast({
        title: 'Status atualizado',
        description: 'O fluxo foi ativado/desativado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    configs,
    isLoading,
    createConfig,
    updateConfig,
    deleteConfig,
    toggleConfig,
  };
};
