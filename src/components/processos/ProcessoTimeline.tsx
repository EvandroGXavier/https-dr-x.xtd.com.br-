import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, Calendar, Gavel, GitBranch, DollarSign } from "lucide-react";
import { useProcessoTimeline } from "@/hooks/useProcessoTimeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoTimelineProps {
  processoId: string;
}

const typeIcons = {
  movimentacao: Gavel,
  contrato: DollarSign,
  documento: FileText,
  agenda: Calendar,
  desdobramento: GitBranch,
};

const typeLabels = {
  movimentacao: "Movimentação",
  contrato: "Contrato",
  documento: "Documento",
  agenda: "Agenda",
  desdobramento: "Desdobramento",
};

const typeColors = {
  movimentacao: "bg-blue-500",
  contrato: "bg-green-500",
  documento: "bg-purple-500",
  agenda: "bg-orange-500",
  desdobramento: "bg-gray-500",
};

export function ProcessoTimeline({ processoId }: ProcessoTimelineProps) {
  const { events, isLoading } = useProcessoTimeline(processoId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum evento encontrado para este processo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline do Processo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => {
            const Icon = typeIcons[event.type];
            return (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full ${typeColors[event.type]} flex items-center justify-center text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {index < events.length - 1 && (
                    <div className="w-0.5 h-16 bg-border mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-8">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary">
                      {typeLabels[event.type]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(event.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <h4 className="font-medium">{event.title}</h4>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.description}
                    </p>
                  )}
                  {event.metadata && (
                    <div className="flex gap-1 mt-2">
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}