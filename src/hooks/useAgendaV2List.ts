import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  icone: string;
}

export interface AgendaEvent {
  id: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim?: string;
  status: 'analise' | 'a_fazer' | 'fazendo' | 'feito';
  prioridade?: string;
  observacoes?: string;
  tenant_id: string;
  empresa_id?: string;
  filial_id?: string;
  processo_id?: string;
  contato_responsavel_id?: string;
  contato_solicitante_id?: string;
  created_at?: string;
  updated_at?: string;
  responsavel_nome?: string;
  origem_config_id?: string;
  origem_modulo?: string;
  origem_registro_id?: string;
  etiquetas: Etiqueta[];
}

interface TagFilters {
  comTags?: string[];
  semTags?: string[];
}

export const useAgendaV2List = (filters?: TagFilters) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: agendas, isLoading, error } = useQuery({
    queryKey: ["agendas-v2", filters],
    queryFn: async () => {
      console.log("📥 Buscando agendas V2 com filtros:", filters);
      
      if (!user) throw new Error("Usuário não autenticado");

      // Buscar agendas
      const { data: agendasData, error: agendasError } = await supabase
        .from("vw_agendas_grid")
        .select("*")
        .order("data_inicio", { ascending: false });

      if (agendasError) {
        console.error("❌ Erro ao buscar agendas:", agendasError);
        throw agendasError;
      }
      
      if (!agendasData?.length) {
        console.log("📭 Nenhuma agenda encontrada");
        return [];
      }

      // Buscar etiquetas para todas as agendas usando etiqueta_vinculos
      const agendaIds = agendasData.map(a => a.id);
      const { data: vinculosData, error: vinculosError } = await supabase
        .from("etiqueta_vinculos")
        .select(`
          referencia_id,
          etiquetas!inner (
            id,
            nome,
            cor,
            icone
          )
        `)
        .eq("referencia_tipo", "agendas")
        .in("referencia_id", agendaIds);

      if (vinculosError) {
        console.error("⚠️ Erro ao buscar etiquetas:", vinculosError);
      }

      // Mapear etiquetas para cada agenda
      let agendasComEtiquetas = agendasData.map(agenda => ({
        ...agenda,
        etiquetas: vinculosData
          ?.filter((v: any) => v.referencia_id === agenda.id)
          .map((v: any) => v.etiquetas)
          .filter(Boolean) || []
      }));

      // Aplicar filtros de etiquetas
      if (filters?.comTags && filters.comTags.length > 0) {
        agendasComEtiquetas = agendasComEtiquetas.filter(agenda =>
          filters.comTags!.every(tagId =>
            agenda.etiquetas.some((etiqueta: Etiqueta) => etiqueta.id === tagId)
          )
        );
      }

      if (filters?.semTags && filters.semTags.length > 0) {
        agendasComEtiquetas = agendasComEtiquetas.filter(agenda =>
          !filters.semTags!.some(tagId =>
            agenda.etiquetas.some((etiqueta: Etiqueta) => etiqueta.id === tagId)
          )
        );
      }

      console.log("✅ Agendas carregadas:", agendasComEtiquetas.length);
      
      return agendasComEtiquetas as AgendaEvent[];
    },
    enabled: !!user,
  });

  const invalidateAgendas = () => {
    queryClient.invalidateQueries({ queryKey: ["agendas-v2"] });
  };

  return {
    agendas: agendas || [],
    isLoading,
    error,
    invalidateAgendas,
  };
};
