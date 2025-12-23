import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface AidJob {
  id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  source_module: string;
  source_ref_id?: string | null;
  contato_id?: string | null;
  original_filename?: string | null;
  mime_type?: string | null;
  size_bytes?: number | null;
  storage_path?: string | null;
  meta: any;
  started_at?: string | null;
  finished_at?: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  empresa_id?: string | null;
  filial_id?: string | null;
  user_id: string;
  sha256?: string | null;
}

export interface AidResult {
  id: string;
  job_id: string;
  plain_text: string;
  structured: any;
  labels: any;
  confidence?: number | null;
  pages_meta: any;
  created_at: string;
}

export interface AidAnalysisRequest {
  content?: string; // Para texto colado
  file?: File; // Para arquivos
  source_module: string;
  source_ref_id?: string;
  contato_id?: string;
}

export function useAid() {
  const [jobs, setJobs] = useState<AidJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadJobs = useCallback(async (filters?: { 
    status?: string; 
    source_module?: string; 
    limit?: number;
  }) => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('aid_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.source_module) {
        query = query.eq('source_module', filters.source_module);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs((data || []).map(job => ({
        ...job,
        status: job.status as AidJob['status']
      })));
    } catch (error) {
      console.error('Erro ao carregar jobs AID:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os jobs de análise",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const createAnalysisJob = useCallback(async (request: AidAnalysisRequest): Promise<string | null> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    setIsAnalyzing(true);
    try {
      // Preparar dados do job
      const jobData: any = {
        created_by: user.id,
        user_id: user.id,
        source_module: request.source_module,
        source_ref_id: request.source_ref_id,
        contato_id: request.contato_id,
        empresa_id: null, // TODO: Implementar seleção de empresa
        filial_id: null,  // TODO: Implementar seleção de filial
        meta: {}
      };

      // Se for arquivo, fazer upload primeiro
      if (request.file) {
        const fileName = `${user.id}/${Date.now()}_${request.file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('aid_uploads')
          .upload(fileName, request.file);

        if (uploadError) throw uploadError;

        jobData.original_filename = request.file.name;
        jobData.mime_type = request.file.type;
        jobData.size_bytes = request.file.size;
        jobData.storage_path = fileName;
        jobData.sha256 = await calculateSHA256(request.file);
      } else if (request.content) {
        // Para texto colado, salvar no meta
        jobData.meta = { content: request.content };
      }

      // Criar job no banco
      const { data: job, error: jobError } = await supabase
        .from('aid_jobs')
        .insert([jobData])
        .select()
        .single();

      if (jobError) throw jobError;

      // Chamar edge function para processar
      const { error: processError } = await supabase.functions.invoke('aid-process', {
        body: { jobId: job.id }
      });

      if (processError) {
        console.warn('Erro ao iniciar processamento:', processError);
        // Não é um erro fatal, o job pode ser processado depois
      }

      // Log de auditoria
      await supabase
        .from('aid_audit')
        .insert([{
          job_id: job.id,
          action: 'create_job',
          details: {
            source_module: request.source_module,
            has_file: !!request.file,
            has_content: !!request.content
          }
        }]);

      toast({
        title: "Análise iniciada",
        description: "O documento está sendo processado. Você será notificado quando concluído.",
      });

      return job.id;
    } catch (error: any) {
      console.error('Erro ao criar job de análise:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Não foi possível iniciar a análise do documento",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, toast]);

  const getJobResult = useCallback(async (jobId: string): Promise<AidResult | null> => {
    try {
      const { data, error } = await supabase
        .from('aid_results')
        .select('*')
        .eq('job_id', jobId)
        .single();

      if (error) throw error;
      return data ? {
        ...data,
        labels: Array.isArray(data.labels) ? data.labels : [],
        pages_meta: Array.isArray(data.pages_meta) ? data.pages_meta : []
      } : null;
    } catch (error) {
      console.error('Erro ao buscar resultado:', error);
      return null;
    }
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      // Buscar dados do job para deletar arquivo se necessário
      const { data: job } = await supabase
        .from('aid_jobs')
        .select('storage_path')
        .eq('id', jobId)
        .single();

      // Deletar arquivo do storage se existir
      if (job?.storage_path) {
        await supabase.storage
          .from('aid_uploads')
          .remove([job.storage_path]);
      }

      // Deletar job (cascata deleta resultado)
      const { error } = await supabase
        .from('aid_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      // Log de auditoria
      await supabase
        .from('aid_audit')
        .insert([{
          job_id: jobId,
          action: 'delete_job',
          details: {}
        }]);

      toast({
        title: "Job excluído",
        description: "O job de análise foi removido com sucesso",
      });

      // Recarregar lista
      loadJobs();
    } catch (error: any) {
      console.error('Erro ao deletar job:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o job",
        variant: "destructive",
      });
    }
  }, [toast, loadJobs]);

  return {
    jobs,
    loading,
    isAnalyzing,
    loadJobs,
    createAnalysisJob,
    getJobResult,
    deleteJob
  };
}

// Função auxiliar para calcular SHA256
async function calculateSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}