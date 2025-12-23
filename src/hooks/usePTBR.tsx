/**
 * Hook para usar views PT-BR do sistema
 * Facilita o consumo das views com nomenclatura amigável (somente leitura)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  ProcessoPT, 
  ContatoPT, 
  AgendaPT, 
  TransacaoFinanceiraPT, 
  EtiquetaPT, 
  AnexoPT 
} from '@/types/ptbr';
import {
  mapProcessoDbToPT,
  mapContatoToPT,
  mapContatoGeralPT,
  mapAgendaToPT,
  mapTransacaoFinanceiraToPT,
  mapEtiquetaToPT,
  mapAnexoToPT,
  normalizeEmpresaId
} from '@/adapters/ptbrAdapters';

// ===== HOOK PARA PROCESSOS PT-BR (LEITURA) =====
export function useProcessosPT() {
  const processos = useQuery({
    queryKey: ['processos-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  return {
    processos: processos.data || [],
    carregando: processos.isLoading,
    erro: processos.error,
    recarregar: processos.refetch,
  };
}

// ===== HOOK PARA CONTATOS PT-BR (LEITURA) =====
export function useContatosPT() {
  const contatos = useQuery({
    queryKey: ['contatos-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_contatos_completo')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapContatoToPT) || [];
    },
  });

  return {
    contatos: contatos.data || [],
    carregando: contatos.isLoading,
    erro: contatos.error,
    recarregar: contatos.refetch,
  };
}

/**
 * Hook para usar a view padronizada vw_contatos_geral_pt
 * Esta view oferece uma interface consistente e normalizada em PT-BR
 * incluindo campos de email, telefone e celular consolidados
 */
export function useContatosGeralPT() {
  const contatos = useQuery({
    queryKey: ['contatos-geral-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_contatos_geral_pt' as any)
        .select('*')
        .order('nome_completo');
      
      if (error) throw error;
      return data?.map(mapContatoGeralPT) || [];
    },
  });

  return {
    contatos: contatos.data || [],
    carregando: contatos.isLoading,
    erro: contatos.error,
    recarregar: contatos.refetch,
  };
}

// ===== HOOK PARA AGENDA PT-BR (LEITURA) =====
export function useAgendaPT() {
  const agenda = useQuery({
    queryKey: ['agenda-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .order('data_inicio', { ascending: true });
      
      if (error) throw error;
      return data?.map(mapAgendaToPT) || [];
    },
  });

  return {
    agenda: agenda.data || [],
    carregando: agenda.isLoading,
    erro: agenda.error,
    recarregar: agenda.refetch,
  };
}

// ===== HOOK PARA TRANSAÇÕES FINANCEIRAS PT-BR (LEITURA) =====
export function useTransacoesFinanceirasPT() {
  const transacoes = useQuery({
    queryKey: ['transacoes-financeiras-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_transacoes_financeiras_pt')
        .select('*')
        .order('atualizado_em', { ascending: false });
      
      if (error) throw error;
      return data?.map(mapTransacaoFinanceiraToPT) || [];
    },
  });

  return {
    transacoes: transacoes.data || [],
    carregando: transacoes.isLoading,
    erro: transacoes.error,
    recarregar: transacoes.refetch,
  };
}

// ===== HOOK PARA ETIQUETAS PT-BR (LEITURA) =====
export function useEtiquetasPT() {
  const etiquetas = useQuery({
    queryKey: ['etiquetas-pt'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_etiquetas_pt')
        .select('*')
        .eq('ativa', true)
        .order('nome');
      
      if (error) throw error;
      return data?.map(mapEtiquetaToPT) || [];
    },
  });

  return {
    etiquetas: etiquetas.data || [],
    carregando: etiquetas.isLoading,
    erro: etiquetas.error,
    recarregar: etiquetas.refetch,
  };
}

// ===== HOOK PARA ANEXOS PT-BR (LEITURA) =====
// TODO: Reativar quando view vw_anexos_pt for criada
export function useAnexosPT(moduloFiltro?: string, registroId?: string) {
  return {
    anexos: [],
    carregando: false,
    erro: null,
    recarregar: () => {},
  };
}

// ===== HOOK PARA BUSCAR UM PROCESSO ESPECÍFICO =====
export function useProcessoPT(processoId: string) {
  const processo = useQuery({
    queryKey: ['processo-pt', processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .eq('id', processoId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  return {
    processo: processo.data,
    carregando: processo.isLoading,
    erro: processo.error,
    recarregar: processo.refetch,
  };
}

// ===== HOOK PARA BUSCAR UM CONTATO ESPECÍFICO =====
export function useContatoPT(contatoId: string) {
  const contato = useQuery({
    queryKey: ['contato-pt', contatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_contatos_completo')
        .select('*')
        .eq('id', contatoId)
        .single();
      
      if (error) throw error;
      return mapContatoToPT(data);
    },
    enabled: !!contatoId,
  });

  return {
    contato: contato.data,
    carregando: contato.isLoading,
    erro: contato.error,
    recarregar: contato.refetch,
  };
}

// ===== HOOK UTILITÁRIO PARA EMPRESA/TENANT =====
export function useEmpresaContext() {
  return {
    obterEmpresaId: normalizeEmpresaId,
    formatarDataPTBR: (data: string) => {
      if (!data) return '';
      return new Date(data).toLocaleDateString('pt-BR');
    },
    formatarDataHoraPTBR: (data: string) => {
      if (!data) return '';
      return new Date(data).toLocaleString('pt-BR');
    },
    formatarMoedaPTBR: (valor: number) => {
      if (typeof valor !== 'number') return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor);
    },
  };
}

// ===== HOOK PARA ESTATÍSTICAS BÁSICAS =====
export function useEstatisticasPT() {
  const estatisticas = useQuery({
    queryKey: ['estatisticas-pt'],
    queryFn: async () => {
      // Buscar estatísticas básicas
      const [processosData, contatosData, agendaData, transacoesData] = await Promise.all([
        supabase.from('processos').select('id, status').limit(1000),
        supabase.from('vw_contatos_compat').select('id').limit(1000),
        supabase.from('agendas').select('id, status').limit(1000),
        supabase.from('vw_transacoes_financeiras_pt').select('id, status, valor_documento').limit(1000),
      ]);

      const totalProcessos = processosData.data?.length || 0;
      const processosAtivos = processosData.data?.filter(p => p.status === 'Ativo').length || 0;
      
      const totalContatos = contatosData.data?.length || 0;
      const contatosAtivos = totalContatos; // Todos contatos ativos por padrão na nova arquitetura
      
      const totalCompromissos = agendaData.data?.length || 0;
      const compromissosPendentes = agendaData.data?.filter(a => a.status === 'analise').length || 0;
      
      const totalTransacoes = transacoesData.data?.length || 0;
      const valorTotal = transacoesData.data?.reduce((sum, t) => sum + (t.valor_documento || 0), 0) || 0;

      return {
        processos: {
          total: totalProcessos,
          ativos: processosAtivos,
        },
        contatos: {
          total: totalContatos,
          ativos: contatosAtivos,
        },
        agenda: {
          total: totalCompromissos,
          pendentes: compromissosPendentes,
        },
        financeiro: {
          total_transacoes: totalTransacoes,
          valor_total: valorTotal,
        },
      };
    },
  });

  return {
    estatisticas: estatisticas.data,
    carregando: estatisticas.isLoading,
    erro: estatisticas.error,
    recarregar: estatisticas.refetch,
  };
}