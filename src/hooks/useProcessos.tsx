import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { useAuditLog } from "./useAuditLog";
import { z } from "zod";
import { useTenantContext } from "@/hooks/useTenantContext";
import { setServerContext } from "@/lib/supabase/rpc";

interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

export type ProcessoStatus = 'ativo' | 'suspenso' | 'arquivado' | 'finalizado';
export type ProcessoTipo = 'civel' | 'criminal' | 'trabalhista' | 'tributario' | 'previdenciario' | 'administrativo' | 'outros';
export type ProcessoInstancia = 'primeira' | 'segunda' | 'superior' | 'supremo';
export type QualificacaoParte = 'autor' | 'reu' | 'cliente' | 'contrario' | 'testemunha' | 'juizo' | 'advogado' | 'ministerio_publico' | 'terceiro_interessado' | 'perito' | 'falecido' | 'outros';
export type MovimentacaoTipo = 'decisao' | 'despacho' | 'audiencia' | 'juntada' | 'peticao' | 'sentenca' | 'recurso' | 'outros';

// Interface V2 LIMPA: Apenas os 4 campos de negócio da tabela processos
// Todos os demais dados (judicial, valores, partes) ficam em tabelas satélites
export interface Processo {
  // Campos de Sistema (automáticos/invisíveis)
  id: string;
  user_id: string;
  tenant_id: string;
  empresa_id?: string;
  filial_id?: string;
  created_at: string;
  updated_at: string;

  // 4 Campos de Negócio (visíveis no formulário)
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  status: string;

  // Relações (para UI)
  etiquetas?: Etiqueta[];
}

export interface ProcessoParte {
  id: string;
  user_id: string;
  processo_id: string;
  contato_id: string;
  qualificacao: QualificacaoParte;
  principal: boolean;
  observacoes?: string;
  created_at: string;
}

export interface ProcessoMovimentacao {
  id: string;
  user_id: string;
  processo_id: string;
  id_tribunal?: string;
  data_movimentacao: string;
  tipo: MovimentacaoTipo;
  titulo: string;
  descricao?: string;
  documento_url?: string;
  documento_nome?: string;
  hash_deduplicacao?: string;
  metadata?: any;
  created_at: string;
}

export interface ProcessoContrato {
  id: string;
  user_id: string;
  processo_id: string;
  cliente_contrato_id: string;
  tipo: string;
  status: string;
  titulo: string;
  descricao?: string;
  created_at: string;
}

// Schema de validação Zod V2
// [DR.X-EPR] Removido do schema: advogado_responsavel_id
const processoSchema = z.object({
  titulo: z.string().min(3, { message: "O título é obrigatório e deve ter pelo menos 3 caracteres." }),
  descricao: z.string().optional().nullable(),
  local: z.union([
    z.string().url("Link deve ser uma URL válida"),
    z.literal(''),
    z.null()
  ]).optional().nullable(),
  status: z.string().min(1, { message: "Status é obrigatório." }),
});

export const useProcessos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { logProcessoAction } = useAuditLog();

  const { data: processos, isLoading, error } = useQuery({
    queryKey: ["processos"],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar processos V2 com etiquetas
      // [DR.X-EPR] Query limpa: removido advogado_responsavel_id
      const { data: processosData, error: processosError } = await supabase
        .from("processos")
        .select(`
          id,
          user_id,
          tenant_id,
          empresa_id,
          filial_id,
          titulo,
          descricao,
          local,
          status,
          created_at,
          updated_at,
          processo_etiquetas(
            etiquetas(id, nome, cor, icone)
          )
        `)
        .order("updated_at", { ascending: false });

      if (processosError) throw processosError;
      if (!processosData?.length) return [];

      // Mapear os dados para o formato que a UI espera
      const processosComEtiquetas = processosData.map(processo => {
        const etiquetas = processo.processo_etiquetas
          ?.map((pe: any) => pe.etiquetas)
          .filter(Boolean) || [];

        // Remove processo_etiquetas do objeto final
        const { processo_etiquetas, ...processoLimpo } = processo;

        return {
          ...processoLimpo,
          etiquetas,
        };
      });

      console.log("Processos query result:", { data: processosComEtiquetas, error: null });

      return processosComEtiquetas as Processo[];
    },
    enabled: !!user,
  });

  const createProcessoMutation = useMutation({
    mutationFn: async (novoProcesso: Partial<Processo>) => {
      if (!user) throw new Error("Usuário não autenticado");

      try {
        // Usar RPC segura criar_processo_v1() ao invés de INSERT direto
        // A RPC valida o contexto (tenant_id, empresa_id, filial_id) automaticamente e insere na tabela processos_tj
        const dadosSerializaveis = {
          titulo: novoProcesso.titulo,
          descricao: novoProcesso.descricao,
          local: novoProcesso.local,
          status: novoProcesso.status,
        };
        
        const { data: processoId, error } = await supabase
          .rpc('criar_processo_v1', {
            dados_complementares: dadosSerializaveis
          });

        if (error) {
          console.error("❌ Erro na RPC:", error);
          throw new Error(error.message);
        }

        if (!processoId) throw new Error("Erro ao criar processo: ID não retornado");

        // Buscar o processo criado para retornar
        const { data, error: fetchError } = await supabase
          .from("processos")
          .select()
          .eq('id', processoId)
          .single();

        if (fetchError) throw fetchError;

        console.log("✅ Processo criado:", data);
        return data;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const friendlyError = error.errors.map(e => e.message).join('\n');
          console.error("❌ Erro de validação (Zod):", friendlyError);
          throw new Error(friendlyError);
        }
        throw error;
      }
    },
    onSuccess: (novoProcesso) => {
      console.log('✅ PROCESSO CRIADO! Invalidando cache da grid...', novoProcesso);
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      console.log('✅ Cache invalidado! A grid será recarregada.');
      // Toast removido - será gerenciado pelo formulário

      // Log de auditoria
      logProcessoAction('create', novoProcesso.id, {
        titulo: novoProcesso.titulo,
        status: novoProcesso.status,
      });
    },
    onError: (error) => {
      console.error("Erro ao criar processo:", error);
      // Toast removido - será gerenciado pelo formulário
    },
  });

  // Criar processo rascunho V2 com template
  const createMinimalProcessoMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar configuração para obter o template
      const { data: config } = await supabase
        .from("processos_config")
        .select("template_oportunidade, status_padrao")
        .limit(1)
        .maybeSingle();

      // Parsear template se existir
      let templateData = {
        titulo: 'Nova Oportunidade',
        descricao: '',
        local: null,
      };

      if (config?.template_oportunidade) {
        try {
          const parsed = JSON.parse(config.template_oportunidade);
          templateData = {
            titulo: parsed.titulo || 'Nova Oportunidade',
            descricao: parsed.descricao || '',
            local: parsed.local || null,
          };
        } catch (e) {
          console.error("Erro ao parsear template:", e);
        }
      }

      // Usar RPC segura criar_processo_v1() ao invés de INSERT direto
      // A RPC valida o contexto (tenant_id, empresa_id, filial_id) automaticamente
      const { data: processoId, error } = await supabase
        .rpc('criar_processo_v1', {
          dados_complementares: {
            numero_cnj: 'RASCUNHO-' + Date.now(),
            titulo: templateData.titulo,
            descricao: templateData.descricao,
            local: templateData.local,
            status: config?.status_padrao || 'ativo',
          }
        });

      if (error) throw error;
      if (!processoId) throw new Error("Erro ao criar processo");

      // Buscar o processo criado
      const { data, error: fetchError } = await supabase
        .from("processos")
        .select()
        .eq('id', processoId)
        .single();

      if (fetchError) throw fetchError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
    onError: (error) => {
      console.error("Erro ao criar processo rascunho:", error);
      toast.error("Erro ao criar processo");
    },
  });

  const updateProcessoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Processo> & { id: string }) => {
      try {
        if (!user) throw new Error("Usuário não autenticado");

        console.log('🔄 Atualizando processo via RPC:', id, updates);

        // Limpar payload para enviar apenas os 4 campos de negócio
        const dadosSerializaveis = {
          titulo: updates.titulo,
          descricao: updates.descricao,
          local: updates.local,
          status: updates.status,
        };

        console.log("📤 Enviando payload para RPC:", dadosSerializaveis);

        // Usar RPC segura atualizar_processo_v1() (SECURITY DEFINER)
        const { data, error } = await supabase.rpc('atualizar_processo_v1', {
          processo_id: id,
          dados_complementares: dadosSerializaveis
        });

        if (error) {
          console.error('❌ Erro na RPC de update:', error);
          throw error;
        }

        console.log('✅ Processo atualizado via RPC:', data);
        return data;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const friendlyError = error.errors.map(e => e.message).join('\n');
          console.error("❌ Erro de validação (Zod):", friendlyError);
          throw new Error(friendlyError);
        }
        console.error('❌ Erro geral ao atualizar:', error);
        throw error;
      }
    },
    onSuccess: (data, variables) => {
      console.log('✅ PROCESSO ATUALIZADO! Invalidando caches...');
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      queryClient.invalidateQueries({ queryKey: ["processo", variables.id] });
      console.log('✅ Caches invalidados!');
      toast.success("Processo atualizado com sucesso!");
    },
    onError: (error: any) => {
      console.error("❌ Erro ao atualizar processo:", error);
      toast.error(error.message || "Erro ao atualizar processo");
    },
  });

  const deleteProcessoMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");

      // Usar RPC segura deletar_processo_v1() ao invés de DELETE direto
      // A RPC valida o contexto (tenant_id, empresa_id, filial_id) automaticamente
      const { error } = await supabase
        .rpc('deletar_processo_v1', {
          processo_id: id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
      toast.success("Processo excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir processo:", error);
      toast.error("Erro ao excluir processo");
    },
  });

  return {
    processos: processos || [],
    isLoading,
    error,
    createProcesso: createProcessoMutation.mutateAsync,
    createMinimalProcesso: createMinimalProcessoMutation.mutateAsync,
    updateProcesso: updateProcessoMutation.mutateAsync,
    deleteProcesso: deleteProcessoMutation.mutateAsync,
    isCreating: createProcessoMutation.isPending,
    isCreatingMinimal: createMinimalProcessoMutation.isPending,
    isUpdating: updateProcessoMutation.isPending,
    isDeleting: deleteProcessoMutation.isPending,
  };
};

export const useProcesso = (id: string) => {
  const { user } = useAuth();

  const { data: processo, isLoading } = useQuery({
    queryKey: ["processo", id],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar processo com suas etiquetas e partes
      const { data: processoData, error: processoError } = await supabase
        .from("processos")
        .select(`
          *,
          processo_etiquetas(
            etiquetas(id, nome, cor, icone)
          )
        `)
        .eq("id", id)
        .single();

      if (processoError) throw processoError;
      if (!processoData) return null;

      // Buscar partes do processo
      const { data: partesData, error: partesError } = await supabase
        .from("processo_partes")
        .select(`
          *,
          contatos!contato_id(id, nome, cpf_cnpj, email, telefone, celular)
        `)
        .eq("processo_id", id);

      if (partesError) {
        console.warn("Erro ao buscar partes:", partesError);
      }

      // Mapear etiquetas
      const etiquetas = processoData.processo_etiquetas
        ?.map((pe: any) => pe.etiquetas)
        .filter(Boolean) || [];

      const { processo_etiquetas, ...processoLimpo } = processoData;

      // Retornar no formato esperado pela UI
      return {
        processo_data: {
          ...processoLimpo,
          etiquetas,
        },
        partes: partesData || []
      };
    },
    enabled: !!user && !!id,
  });

  return {
    processo,
    isLoading,
  };
};

export const useProcessoPartes = (processoId: string) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: partes, isLoading } = useQuery({
    queryKey: ["processo-partes", processoId, profile?.empresa_id, profile?.filial_id],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      // Garantir contexto para passar nas políticas RLS
      if (profile?.empresa_id) {
        await setServerContext(supabase, profile.empresa_id, profile.filial_id || undefined);
      }

      const { data, error } = await supabase
        .from("processo_partes")
        .select(`
          *,
          contatos_v2:contato_id(id, nome_fantasia, cpf_cnpj)
        `)
        .eq("processo_id", processoId)
        .order("created_at");

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!processoId,
    staleTime: 30000,
  });

  const addParteMutation = useMutation({
    mutationFn: async (novaParte: Omit<ProcessoParte, "id" | "user_id" | "created_at">) => {
      if (!user || !profile?.empresa_id) throw new Error("Usuário não autenticado ou empresa não configurada");

      const { data, error } = await supabase
        .from("processo_partes")
        .insert({
          ...novaParte,
          user_id: user.id,
          tenant_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-partes", processoId, profile?.empresa_id, profile?.filial_id] });
      toast.success("Parte adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar parte:", error);
      toast.error("Erro ao adicionar parte");
    },
  });

  const removeParteMutation = useMutation({
    mutationFn: async (parteId: string) => {
      const { error } = await supabase
        .from("processo_partes")
        .delete()
        .eq("id", parteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-partes", processoId, profile?.empresa_id, profile?.filial_id] });
      toast.success("Parte removida com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover parte:", error);
      toast.error("Erro ao remover parte");
    },
  });

  const updateParteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProcessoParte> }) => {
      const { error } = await supabase
        .from("processo_partes")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-partes", processoId, profile?.empresa_id, profile?.filial_id] });
      toast.success("Parte atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar parte:", error);
      toast.error("Erro ao atualizar parte");
    },
  });

  return {
    partes: partes || [],
    isLoading,
    addParte: addParteMutation.mutateAsync,
    removeParte: removeParteMutation.mutateAsync,
    updateParte: (id: string, data: Partial<ProcessoParte>) => updateParteMutation.mutateAsync({ id, data }),
    isAdding: addParteMutation.isPending,
    isRemoving: removeParteMutation.isPending,
    isUpdating: updateParteMutation.isPending,
  };
};

export const useProcessoMovimentacoes = (processoId: string) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: movimentacoes, isLoading } = useQuery({
    queryKey: ["processo-movimentacoes", processoId],
    queryFn: async () => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("processo_movimentacoes")
        .select("*")
        .eq("processo_id", processoId)
        .order("data_movimentacao", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!processoId,
  });

  const addMovimentacaoMutation = useMutation({
    mutationFn: async (novaMovimentacao: Omit<ProcessoMovimentacao, "id" | "user_id" | "created_at">) => {
      if (!user || !profile?.empresa_id) throw new Error("Usuário não autenticado ou empresa não configurada");

      const { data, error } = await supabase
        .from("processo_movimentacoes")
        .insert({
          ...novaMovimentacao,
          user_id: user.id,
          tenant_id: profile.empresa_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-movimentacoes", processoId] });
      toast.success("Movimentação adicionada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao adicionar movimentação:", error);
      toast.error("Erro ao adicionar movimentação");
    },
  });

  const updateMovimentacaoMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProcessoMovimentacao> & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("processo_movimentacoes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-movimentacoes", processoId] });
      toast.success("Movimentação atualizada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar movimentação:", error);
      toast.error("Erro ao atualizar movimentação");
    },
  });

  return {
    movimentacoes: movimentacoes || [],
    isLoading,
    addMovimentacao: addMovimentacaoMutation.mutateAsync,
    updateMovimentacao: updateMovimentacaoMutation.mutateAsync,
    isAdding: addMovimentacaoMutation.isPending,
    isUpdating: updateMovimentacaoMutation.isPending,
  };
};
