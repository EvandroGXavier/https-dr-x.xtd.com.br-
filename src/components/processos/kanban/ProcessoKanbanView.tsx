import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useProcessos } from '@/hooks/useProcessos';
import { useEtiquetas } from '@/hooks/useEtiquetas';
import { KANBAN_COLUMNS, StatusProcesso, Processo } from '@/types/processos';
import { KanbanColumn } from './KanbanColumn';
import { ProcessoCard } from './ProcessoCard';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FEATURES } from '@/config/features';
import { Skeleton } from '@/components/ui/skeleton';

interface ProcessoKanbanViewProps {
  isFunilMode?: boolean;
}

export function ProcessoKanbanView({ isFunilMode = false }: ProcessoKanbanViewProps) {
  const { processos, isLoading, updateProcesso } = useProcessos();
  const { etiquetas, isLoading: isLoadingEtiquetas, trocarEtiquetaDeGrupo } = useEtiquetas();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Obter etiquetas do funil (grupo "Fase do Processo")
  const funilEtiquetas = useMemo(() => {
    if (!FEATURES.PROCESSO_FUNIL_V1 || !isFunilMode || !etiquetas) return [];
    return etiquetas.filter(e => e.grupo === 'Fase do Processo').sort((a, b) => a.nome.localeCompare(b.nome));
  }, [isFunilMode, etiquetas]);

  // Determinar as colunas: funil ou status padrão
  const colunas = isFunilMode ? funilEtiquetas : KANBAN_COLUMNS;

  // Agrupar processos por coluna
  const processosPorColuna = useMemo(() => {
    const grupos: Record<string, Processo[]> = {};
    
    if (isFunilMode) {
      // Modo funil: agrupar por etiqueta
      funilEtiquetas.forEach(etiqueta => {
        grupos[etiqueta.id] = [];
      });

      processos?.forEach(processo => {
        // Encontrar a etiqueta do funil que este processo possui
        const etiquetaFunil = processo.etiquetas?.find(e => 
          funilEtiquetas.some(fe => fe.id === e.id)
        );
        
        if (etiquetaFunil && grupos[etiquetaFunil.id]) {
          grupos[etiquetaFunil.id].push(processo as any);
        }
      });
    } else {
      // Modo normal: agrupar por status
      KANBAN_COLUMNS.forEach(status => {
        grupos[status] = [];
      });

      processos?.forEach(processo => {
        const status = processo.status as any;
        if (grupos[status]) {
          grupos[status].push(processo as any);
        }
      });
    }

    return grupos;
  }, [processos, isFunilMode, funilEtiquetas]);

  const activeProcesso = useMemo(() => {
    if (!activeId) return null;
    return processos?.find(p => p.id === activeId);
  }, [activeId, processos]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const processoId = active.id as string;
    const destinoId = over.id as string;

    try {
      if (isFunilMode && FEATURES.PROCESSO_FUNIL_V1) {
        // Modo funil: trocar etiqueta de grupo
        await trocarEtiquetaDeGrupo.mutateAsync({
          itemId: processoId,
          modulo: 'processos',
          etiquetaAdicionarId: destinoId,
          grupo: 'Fase do Processo',
        });
      } else {
        // Modo normal: atualizar status
        const novoStatus = destinoId as StatusProcesso;
        const processo = processos?.find(p => p.id === processoId);
        
        if (processo && processo.status !== novoStatus as any) {
          await updateProcesso({
            id: processoId,
            status: novoStatus as any,
          });

          toast({
            title: 'Status atualizado',
            description: `Processo movido para "${novoStatus}"`,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o processo.',
        variant: 'destructive',
      });
    } finally {
      setActiveId(null);
    }
  };

  if (isLoading || (isFunilMode && isLoadingEtiquetas)) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isFunilMode && funilEtiquetas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Nenhuma fase configurada</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure as fases do funil criando etiquetas com o grupo "Fase do Processo"
        </p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full overflow-x-auto">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {isFunilMode ? (
            funilEtiquetas.map(etiqueta => (
              <KanbanColumn
                key={etiqueta.id}
                status={etiqueta.nome as any}
                titulo={etiqueta.nome}
                cor={etiqueta.cor}
                processos={processosPorColuna[etiqueta.id] || []}
              />
            ))
          ) : (
            KANBAN_COLUMNS.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                processos={processosPorColuna[status] || []}
              />
            ))
          )}
        </div>
      </div>

      <DragOverlay>
        {activeProcesso ? (
          <div className="rotate-3 opacity-80">
            <ProcessoCard processo={activeProcesso as any} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
