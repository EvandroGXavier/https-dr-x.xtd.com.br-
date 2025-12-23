import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Tribunal {
  id: string;
  sigla: string;
  nome: string;
  sistema: string;
  ativo: boolean;
}

export interface CredencialTribunal {
  id: string;
  tribunal_id: string;
  tipo: string;
  alias: string;
  ref_armazenamento: string;
  valido_ate: string | null;
  homologado: boolean;
  tribunal?: Tribunal;
}

export interface ProcessoVinculo {
  id: string;
  processo_id: string;
  tribunal_id: string;
  numero_cnj: string;
  classe_processual?: string;
  orgao_julgador?: string;
  ultima_sincronizacao_em?: string;
  tribunal?: Tribunal;
}

export interface AndamentoProcessual {
  id: string;
  processo_vinculo_id: string;
  origem: string;
  codigo_evento?: string;
  descricao: string;
  data_evento: string;
  dados_brutos?: any;
  lido: boolean;
  created_at: string;
}

export interface IntegracaoJob {
  id: string;
  tipo: string;
  payload: any;
  status: string;
  tentativas: number;
  ultimo_erro?: string | null;
  agendado_para: string;
  created_at: string;
  updated_at: string;
}

export function useIntegracao() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tribunais, setTribunais] = useState<Tribunal[]>([]);
  const [credenciais, setCredenciais] = useState<CredencialTribunal[]>([]);
  const [jobs, setJobs] = useState<IntegracaoJob[]>([]);

  // Carrega tribunais disponíveis
  const fetchTribunais = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tribunais')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setTribunais(data || []);
    } catch (error) {
      console.error('Erro ao carregar tribunais:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar tribunais disponíveis",
        variant: "destructive"
      });
    }
  }, []);

  // Carrega credenciais do usuário
  const fetchCredenciais = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credenciais_tribunal')
        .select(`
          *,
          tribunal:tribunais(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCredenciais(data || []);
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar credenciais",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carrega jobs de integração
  const fetchJobs = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('integracao_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar fila de jobs",
        variant: "destructive"
      });
    }
  }, [user?.id]);

  // Vincula processo com tribunal
  const vincularProcesso = useCallback(async (
    processoId: string, 
    tribunalId: string, 
    numeroCnj: string,
    classeProcessual?: string,
    orgaoJulgador?: string
  ) => {
    if (!user?.id) return false;

    try {
      setLoading(true);

      // Create processos_tj entry if not exists
      const { data: existingTj } = await supabase
        .from('processos_tj')
        .select('id')
        .eq('processo_id', processoId)
        .maybeSingle();

      if (!existingTj) {
        // Buscar tenant_id do profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile?.empresa_id) {
          throw new Error("Usuário não possui empresa configurada");
        }

        const { error: processoTjError } = await supabase
          .from('processos_tj')
          .insert({
            processo_id: processoId,
            tenant_id: profile.empresa_id,
            numero_oficial: numeroCnj,
            numero_cnj: numeroCnj,
            tribunal: tribunalId,
            classe: classeProcessual,
            origem_dados: 'integracao' as const
          });

        if (processoTjError) throw processoTjError;
      }

      // Buscar tenant_id do profile para o vínculo
      const { data: profile } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile?.empresa_id) {
        throw new Error("Usuário não possui empresa configurada");
      }

      // Cria o vínculo
      const { error: vinculoError } = await supabase
        .from('processos_vinculos')
        .insert({
          processo_id: processoId,
          tribunal_id: tribunalId,
          numero_cnj: numeroCnj,
          classe_processual: classeProcessual,
          orgao_julgador: orgaoJulgador,
          user_id: user.id,
          tenant_id: profile.empresa_id
        });

      if (vinculoError) throw vinculoError;

      // Cria job para consulta de andamentos
      const { error: jobError } = await supabase
        .from('integracao_jobs')
        .insert({
          tipo: 'CONSULTA_DATAJUD',
          payload: {
            numeroCnj,
            tribunalId,
            processoId
          },
          user_id: user.id
        });

      if (jobError) throw jobError;

      toast({
        title: "Sucesso",
        description: "Processo vinculado ao tribunal com sucesso!"
      });

      return true;
    } catch (error) {
      console.error('Erro ao vincular processo:', error);
      toast({
        title: "Erro",
        description: "Falha ao vincular processo ao tribunal",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Busca andamentos de um processo
  const fetchAndamentos = useCallback(async (processoVinculoId: string) => {
    try {
      const { data, error } = await supabase
        .from('andamentos_processuais')
        .select('*')
        .eq('processo_vinculo_id', processoVinculoId)
        .order('data_evento', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar andamentos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar andamentos processuais",
        variant: "destructive"
      });
      return [];
    }
  }, []);

  // Solicita sincronização manual
  const solicitarSincronizacao = useCallback(async (processoVinculoId: string) => {
    if (!user?.id) return false;

    try {
      const { data: vinculo, error: vinculoError } = await supabase
        .from('processos_vinculos')
        .select('*')
        .eq('id', processoVinculoId)
        .eq('user_id', user.id)
        .single();

      if (vinculoError) throw vinculoError;

      const { error: jobError } = await supabase
        .from('integracao_jobs')
        .insert({
          tipo: 'CONSULTA_DATAJUD',
          payload: {
            numeroCnj: vinculo.numero_cnj,
            tribunalId: vinculo.tribunal_id,
            processoId: vinculo.processo_id,
            manual: true
          },
          user_id: user.id
        });

      if (jobError) throw jobError;

      toast({
        title: "Sucesso",
        description: "Sincronização solicitada com sucesso!"
      });

      return true;
    } catch (error) {
      console.error('Erro ao solicitar sincronização:', error);
      toast({
        title: "Erro",
        description: "Falha ao solicitar sincronização",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTribunais();
    fetchCredenciais();
    fetchJobs();
  }, [fetchTribunais, fetchCredenciais, fetchJobs]);

  return {
    loading,
    tribunais,
    credenciais,
    jobs,
    fetchTribunais,
    fetchCredenciais,
    fetchJobs,
    vincularProcesso,
    fetchAndamentos,
    solicitarSincronizacao
  };
}