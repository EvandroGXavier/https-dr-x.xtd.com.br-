import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TimelineEvent = { data: string; descricao: string };

interface TimelineIAProps {
  eventos: TimelineEvent[] | null;
}

export function TimelineIA({ eventos }: TimelineIAProps) {
  if (!eventos || eventos.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarClock className="mr-2 h-5 w-5" />
          Linha do Tempo dos Fatos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6">
          <div className="absolute left-0 top-0 h-full w-0.5 bg-border -translate-x-1/2 ml-3"></div>
          {eventos.map((evento, index) => (
            <div key={index} className="relative mb-6">
              <div className="absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary"></div>
              <p className="font-bold text-primary text-sm">
                {format(new Date(evento.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">{evento.descricao}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
