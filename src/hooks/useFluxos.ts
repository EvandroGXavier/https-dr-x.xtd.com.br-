import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Fluxo {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FluxoEtapa {
  id: string;
  fluxo_id: string;
  ordem: number;
  titulo: string;
  descricao?: string;
  offset_dias: number;
  obrigatoria: boolean;
  created_at: string;
  updated_at: string;
}

export interface FluxoCompleto extends Fluxo {
  etapas: FluxoEtapa[];
}

export function useFluxos() {
  const [fluxos, setFluxos] = useState<FluxoCompleto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Carregar fluxos ativos
  const loadFluxos = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('agenda_fluxos')
        .select(`
          *,
          etapas:agenda_fluxo_etapas(*)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      
      setFluxos(data || []);
    } catch (error) {
      console.error('Erro ao carregar fluxos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar fluxos de agendamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Gerar etapas baseadas em um fluxo e data base
  const gerarEtapas = (fluxo: FluxoCompleto, dataBase: Date) => {
    return fluxo.etapas
      .sort((a, b) => a.ordem - b.ordem)
      .map(etapaModelo => {
        const dataPrevista = new Date(dataBase);
        dataPrevista.setDate(dataPrevista.getDate() + etapaModelo.offset_dias);

        return {
          ordem: etapaModelo.ordem,
          titulo: etapaModelo.titulo,
          descricao: etapaModelo.descricao,
          prevista_para: dataPrevista.toISOString(),
          status: 'PENDENTE' as const,
          responsavel_contato_id: undefined,
        };
      });
  };

  // Buscar fluxo por ID com etapas
  const getFluxoById = async (fluxoId: string): Promise<FluxoCompleto | null> => {
    try {
      const { data, error } = await supabase
        .from('agenda_fluxos')
        .select(`
          *,
          etapas:agenda_fluxo_etapas(*)
        `)
        .eq('id', fluxoId)
        .eq('ativo', true)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar fluxo:', error);
      return null;
    }
  };

  useEffect(() => {
    loadFluxos();
  }, []);

  return {
    fluxos,
    loading,
    loadFluxos,
    gerarEtapas,
    getFluxoById,
  };
}