import { useDroppable } from '@dnd-kit/core';
import { StatusProcesso, Processo } from '@/types/processos';
import { ProcessoCard } from './ProcessoCard';
import { Badge } from '@/components/ui/badge';

interface KanbanColumnProps {
  status: StatusProcesso;
  processos: Processo[];
  titulo?: string; // Título personalizado para modo funil
  cor?: string; // Cor personalizada para modo funil
}

const STATUS_COLORS: Record<StatusProcesso, string> = {
  'Oportunidade': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'Em Análise': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'Aguardando Cliente': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'Ativo': 'bg-green-500/10 text-green-700 dark:text-green-400',
  'Suspenso': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  'Encerrado': 'bg-slate-500/10 text-slate-700 dark:text-slate-400',
  'Recusado': 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export function KanbanColumn({ status, processos, titulo, cor }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const displayTitulo = titulo || status;
  const displayCor = cor ? { backgroundColor: `${cor}20`, borderColor: cor, color: cor } : undefined;

  return (
    <div className="flex-shrink-0 w-80">
      <div className="flex flex-col h-full bg-muted/30 rounded-lg">
        {/* Header da coluna */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{displayTitulo}</h3>
            <Badge 
              variant="secondary" 
              className="ml-2"
              style={displayCor}
            >
              {processos.length}
            </Badge>
          </div>
        </div>

        {/* Área de drop */}
        <div
          ref={setNodeRef}
          className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px] transition-colors ${
            isOver ? 'bg-primary/5 ring-2 ring-primary ring-inset' : ''
          }`}
        >
          {processos.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Nenhum processo
            </div>
          ) : (
            processos.map(processo => (
              <ProcessoCard key={processo.id} processo={processo} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
