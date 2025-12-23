import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserTenant } from '@/hooks/useUserTenant';
import { setServerContext } from '@/lib/supabase/rpc';

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

export interface AgendaV2 {
  id?: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  status: 'analise' | 'a_fazer' | 'fazendo' | 'feito';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  observacoes?: string;
  fluxo_id?: string;
  contato_responsavel_id?: string;
  contato_solicitante_id?: string;
  tenant_id?: string;
  empresa_id?: string;
  filial_id?: string;
  processo_id?: string;
}

export interface AgendaParte {
  id?: string;
  agenda_id: string;
  contato_id: string;
  papel: string;
  tenant_id?: string;
}

export interface AgendaLocal {
  id?: string;
  agenda_id: string;
  modalidade: string;
  endereco?: string;
  link?: string;
  pasta_arquivos?: string;
}

export interface AgendaEtapa {
  id?: string;
  agenda_id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  prevista_para?: string;
  status: string;
  responsavel_contato_id?: string;
  tenant_id?: string;
}

interface UseAgendaV2Return {
  agenda: AgendaV2 | null;
  partes: AgendaParte[];
  local: AgendaLocal | null;
  etapas: AgendaEtapa[];
  loading: boolean;
  saveAgendaCompleta: (payload: {
    agenda: Partial<AgendaV2>;
    partes: Omit<AgendaParte, 'id'>[];
    local: Omit<AgendaLocal, 'id' | 'agenda_id'> | null;
    etapas: Omit<AgendaEtapa, 'id'>[];
    etiqueta_ids?: string[];
  }) => Promise<string>;
  updateEtapaStatus: (etapaId: string, status: string) => Promise<void>;
}

export function useAgendaV2(agendaId?: string): UseAgendaV2Return {
  const [agenda, setAgenda] = useState<AgendaV2 | null>(null);
  const [partes, setPartes] = useState<AgendaParte[]>([]);
  const [local, setLocal] = useState<AgendaLocal | null>(null);
  const [etapas, setEtapas] = useState<AgendaEtapa[]>([]);
  const [loading, setLoading] = useState(false);

  const { empresaId, filialId, isLoading: tenantLoading } = useUserTenant();

  const loadAgenda = async (id: string) => {
    setLoading(true);
    console.log('🔄 [loadAgenda] Iniciando carregamento da agenda:', id);
    try {
      // 1. Buscar dados principais da agenda (SEM join com contatos)
      const { data: agendaData, error: agendaError } = await supabase
        .from('agendas')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      console.log('📊 [loadAgenda] Agenda carregada:', agendaData);

      if (agendaError) {
        console.error('❌ [loadAgenda] Erro ao buscar agenda:', agendaError);
        throw agendaError;
      }
      if (!agendaData) {
        console.warn('⚠️ [loadAgenda] Agenda não encontrada');
        toast.error('Agenda não encontrada');
        setLoading(false);
        return;
      }

      setAgenda(agendaData);

      // 2. Buscar partes (SEM join - apenas IDs)
      console.log('🔄 [loadAgenda] Buscando partes...');
      const { data: partesData, error: partesError } = await supabase
        .from('agenda_partes')
        .select('*')
        .eq('agenda_id', id);

      if (partesError) {
        console.error('❌ [loadAgenda] Erro ao buscar partes:', partesError);
        throw partesError;
      }
      console.log('✅ [loadAgenda] Partes carregadas:', partesData?.length || 0);
      setPartes(partesData || []);

      // 3. Buscar local
      console.log('🔄 [loadAgenda] Buscando local...');
      const { data: localData, error: localError } = await supabase
        .from('agenda_locais')
        .select('*')
        .eq('agenda_id', id)
        .maybeSingle();

      if (localError && localError.code !== 'PGRST116') {
        console.error('❌ [loadAgenda] Erro ao buscar local:', localError);
        throw localError;
      }
      console.log('✅ [loadAgenda] Local carregado:', localData ? 'Sim' : 'Não');
      setLocal(localData);

      // 4. Buscar etapas
      console.log('🔄 [loadAgenda] Buscando etapas...');
      const { data: etapasData, error: etapasError } = await supabase
        .from('agenda_etapas')
        .select('*')
        .eq('agenda_id', id)
        .order('ordem', { ascending: true });

      if (etapasError) {
        console.error('❌ [loadAgenda] Erro ao buscar etapas:', etapasError);
        throw etapasError;
      }
      console.log('✅ [loadAgenda] Etapas carregadas:', etapasData?.length || 0);
      setEtapas(etapasData || []);

    } catch (error: any) {
      console.error('❌ [loadAgenda] Erro crítico:', error);
      toast.error('Erro ao carregar agenda: ' + error.message);
    } finally {
      setLoading(false);
      console.log('✅ [loadAgenda] Carregamento finalizado');
    }
  };

  useEffect(() => {
    if (!agendaId || tenantLoading) return;
    loadAgenda(agendaId);
  }, [agendaId, tenantLoading]);

  // Função ÚNICA e TRANSACIONAL para salvar a agenda completa
  const saveAgendaCompleta = async (payload: {
    agenda: Partial<AgendaV2>;
    partes: Omit<AgendaParte, 'id'>[];
    local: Omit<AgendaLocal, 'id' | 'agenda_id'> | null;
    etapas: Omit<AgendaEtapa, 'id'>[];
    etiqueta_ids?: string[];
  }): Promise<string> => {
    console.log('💾 [saveAgendaCompleta] Iniciando salvamento...');
    console.log('📦 [saveAgendaCompleta] Payload recebido:', JSON.stringify(payload, null, 2));
    
    try {
      setLoading(true);

      // Validar e garantir empresa_id/filial_id
      console.log('🏢 [saveAgendaCompleta] empresa_id recebido:', payload.agenda.empresa_id);
      console.log('🏪 [saveAgendaCompleta] filial_id recebido:', payload.agenda.filial_id);

      // Garantir que empresa_id e filial_id estão preenchidos
      if (!payload.agenda.empresa_id && empresaId) {
        console.warn('⚠️ empresa_id está vazio! Usando empresaId do perfil:', empresaId);
        payload.agenda.empresa_id = empresaId;
      }
      if (!payload.agenda.filial_id && filialId) {
        console.log('ℹ️ filial_id está vazio. Usando filialId do perfil:', filialId);
        payload.agenda.filial_id = filialId;
      }

      // Validar que são UUIDs válidos
      if (payload.agenda.empresa_id && typeof payload.agenda.empresa_id !== 'string') {
        console.error('❌ empresa_id não é UUID:', payload.agenda.empresa_id);
        throw new Error('empresa_id deve ser UUID');
      }
      if (payload.agenda.filial_id && typeof payload.agenda.filial_id !== 'string') {
        console.error('❌ filial_id não é UUID:', payload.agenda.filial_id);
        throw new Error('filial_id deve ser UUID');
      }

      console.log('✅ [saveAgendaCompleta] empresa_id final:', payload.agenda.empresa_id);
      console.log('✅ [saveAgendaCompleta] filial_id final:', payload.agenda.filial_id);

      // Construir o payload para a RPC
      const rpcPayload = {
        id: agendaId || null,
        titulo: payload.agenda.titulo,
        descricao: payload.agenda.descricao,
        data_inicio: payload.agenda.data_inicio,
        data_fim: payload.agenda.data_fim,
        status: payload.agenda.status,
        prioridade: payload.agenda.prioridade,
        observacoes: payload.agenda.observacoes,
        processo_id: payload.agenda.processo_id,
        empresa_id: payload.agenda.empresa_id,
        filial_id: payload.agenda.filial_id,
        partes: payload.partes,
        local: payload.local,
        etapas: payload.etapas,
        etiqueta_ids: payload.etiqueta_ids || [],
      };

      console.log('📡 [saveAgendaCompleta] Chamando RPC upsert_agenda_transacional...');
      const { data: newAgendaId, error } = await supabase.rpc(
        'upsert_agenda_transacional',
        { payload: rpcPayload }
      );

      if (error) {
        console.error('❌ [saveAgendaCompleta] Erro na RPC:', error);
        if (error.message?.includes('invalid input syntax for type integer')) {
          throw new Error('Erro de tipo de dados: empresa_id ou filial_id inválidos. Verifique se são UUIDs.');
        }
        throw error;
      }

      if (!newAgendaId) {
        console.error('❌ [saveAgendaCompleta] Nenhum ID retornado');
        throw new Error('Nenhum ID retornado pela função');
      }

      console.log('✅ [saveAgendaCompleta] Agenda salva com sucesso! ID:', newAgendaId);

      // Recarregar os dados para garantir consistência
      await loadAgenda(newAgendaId);

      toast.success(agendaId ? 'Agenda atualizada com sucesso!' : 'Agenda criada com sucesso!');
      return newAgendaId;
    } catch (error: any) {
      console.error('❌ [saveAgendaCompleta] Erro crítico:', error);
      toast.error('Falha ao salvar a agenda: ' + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateEtapaStatus = async (etapaId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('agenda_etapas')
        .update({ status })
        .eq('id', etapaId);

      if (error) throw error;

      // Atualizar estado local
      setEtapas(prev => prev.map(e => 
        e.id === etapaId ? { ...e, status } : e
      ));

      toast.success('Status da etapa atualizado!');
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status: ' + error.message);
      throw error;
    }
  };

  return {
    agenda,
    partes,
    local,
    etapas,
    loading,
    saveAgendaCompleta,
    updateEtapaStatus,
  };
}
