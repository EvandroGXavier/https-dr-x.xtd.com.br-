import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface TimelineEvent {
  id: string;
  date: string;
  type: 'movimentacao' | 'contrato' | 'documento' | 'agenda' | 'desdobramento';
  title: string;
  description?: string;
  metadata?: any;
}

export function useProcessoTimeline(processoId: string) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["processo-timeline", processoId],
    queryFn: async () => {
      const events: TimelineEvent[] = [];

      // Fetch movimentações
      const { data: movimentacoes } = await supabase
        .from("processo_movimentacoes")
        .select("*")
        .eq("processo_id", processoId)
        .order("data_movimentacao", { ascending: false });

      if (movimentacoes) {
        events.push(...movimentacoes.map(mov => ({
          id: mov.id,
          date: mov.data_movimentacao,
          type: 'movimentacao' as const,
          title: mov.titulo,
          description: mov.descricao,
          metadata: { tipo: mov.tipo }
        })));
      }

      // Fetch contratos
      const { data: contratos } = await supabase
        .from("processo_contratos")
        .select("*")
        .eq("processo_id", processoId)
        .order("created_at", { ascending: false });

      if (contratos) {
        events.push(...contratos.map(contrato => ({
          id: contrato.id,
          date: contrato.created_at,
          type: 'contrato' as const,
          title: `Contrato: ${contrato.titulo}`,
          description: contrato.descricao,
          metadata: { status: contrato.status, tipo: contrato.tipo }
        })));
      }

      // TODO: Reativar quando tabela documento_vinculos for criada
      // Documentos temporariamente desabilitados

      // Fetch agendas relacionadas
      const { data: agendas } = await supabase
        .from("etiqueta_vinculos")
        .select(`
          *,
          agendas(*)
        `)
        .eq("referencia_id", processoId)
        .eq("referencia_tipo", "processo")
        .order("created_at", { ascending: false });

      // Fetch desdobramentos
      const { data: desdobramentos } = await supabase
        .from("processo_desdobramentos")
        .select("*")
        .eq("processo_principal_id", processoId)
        .order("created_at", { ascending: false });

      if (desdobramentos) {
        events.push(...desdobramentos.map(desdobramento => ({
          id: desdobramento.id,
          date: desdobramento.created_at,
          type: 'desdobramento' as const,
          title: `Desdobramento: ${desdobramento.numero_processo}`,
          description: desdobramento.descricao,
          metadata: { tipo: desdobramento.tipo }
        })));
      }

      // Sort by date descending
      return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!processoId,
  });

  return {
    events: events || [],
    isLoading,
  };
}