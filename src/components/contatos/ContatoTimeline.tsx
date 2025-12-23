import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageSquare, Mail, Calendar, FileText, Scale } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InteracaoContato } from '@/hooks/useContatoInteracoes';
import { cn } from '@/lib/utils';

interface ContatoTimelineProps {
  interacoes: InteracaoContato[];
  loading?: boolean;
}

const tipoConfig = {
  whatsapp: {
    icon: MessageSquare,
    color: 'bg-green-500',
    label: 'WhatsApp',
    textColor: 'text-green-700'
  },
  email: {
    icon: Mail,
    color: 'bg-blue-500',
    label: 'E-mail',
    textColor: 'text-blue-700'
  },
  agenda: {
    icon: Calendar,
    color: 'bg-purple-500',
    label: 'Agenda',
    textColor: 'text-purple-700'
  },
  processo: {
    icon: Scale,
    color: 'bg-orange-500',
    label: 'Processo',
    textColor: 'text-orange-700'
  },
  documento: {
    icon: FileText,
    color: 'bg-slate-500',
    label: 'Documento',
    textColor: 'text-slate-700'
  }
};

const statusColors: Record<string, string> = {
  'concluido': 'bg-green-100 text-green-800',
  'em_andamento': 'bg-blue-100 text-blue-800',
  'pendente': 'bg-yellow-100 text-yellow-800',
  'cancelado': 'bg-red-100 text-red-800',
  'sent': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
  'queued': 'bg-blue-100 text-blue-800'
};

export function ContatoTimeline({ interacoes, loading }: ContatoTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!interacoes || interacoes.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Nenhuma interação registrada com este contato
        </CardContent>
      </Card>
    );
  }

  // Agrupar por data
  const groupedByDate = interacoes.reduce((acc, interacao) => {
    const dateKey = format(new Date(interacao.data), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(interacao);
    return acc;
  }, {} as Record<string, InteracaoContato[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              {format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
          </div>
          
          <div className="space-y-3 relative before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-1rem)] before:w-0.5 before:bg-border">
            {items.map((interacao, idx) => {
              const config = tipoConfig[interacao.tipo];
              const Icon = config.icon;
              
              return (
                <Card key={interacao.id} className="ml-8 relative">
                  <div className={cn(
                    "absolute -left-[43px] top-4 rounded-full p-1.5",
                    config.color
                  )}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={config.textColor}>
                            {config.label}
                          </Badge>
                          {interacao.status && (
                            <Badge 
                              variant="secondary" 
                              className={statusColors[interacao.status] || 'bg-slate-100 text-slate-800'}
                            >
                              {interacao.status}
                            </Badge>
                          )}
                          {interacao.prioridade && (
                            <Badge variant="destructive">
                              {interacao.prioridade}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-sm">{interacao.titulo}</h4>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(interacao.data), 'HH:mm')}
                      </span>
                    </div>
                    
                    {interacao.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {interacao.descricao}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
