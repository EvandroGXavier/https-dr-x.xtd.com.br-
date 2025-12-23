import { useDraggable } from '@dnd-kit/core';
import { Processo } from '@/types/processos';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Scale, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface ProcessoCardProps {
  processo: Processo;
  isDragging?: boolean;
}

const TIPO_COLORS: Record<string, string> = {
  'civel': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'criminal': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'trabalhista': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'tributario': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'outros': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export function ProcessoCard({ processo, isDragging = false }: ProcessoCardProps) {
  const navigate = useNavigate();
  
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingLocal } = useDraggable({
    id: processo.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = () => {
    if (!isDraggingLocal) {
      navigate(`/processos/${processo.id}`);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-move transition-shadow hover:shadow-md ${
        isDragging || isDraggingLocal ? 'opacity-50' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm line-clamp-2 mb-1">
              {processo.titulo || 'Sem título'}
            </h4>
            {processo.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {processo.descricao}
              </p>
            )}
          </div>
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0 space-y-2">
        {/* Status Badge */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary">
            <Scale className="mr-1 h-3 w-3" />
            {processo.status}
          </Badge>
        </div>

        {/* Informações adicionais */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              {format(new Date(processo.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Etiquetas */}
        {processo.etiquetas && processo.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {processo.etiquetas.slice(0, 2).map(etiqueta => (
              <Badge
                key={etiqueta.id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: etiqueta.cor, color: etiqueta.cor }}
              >
                {etiqueta.icone} {etiqueta.nome}
              </Badge>
            ))}
            {processo.etiquetas.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{processo.etiquetas.length - 2}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
