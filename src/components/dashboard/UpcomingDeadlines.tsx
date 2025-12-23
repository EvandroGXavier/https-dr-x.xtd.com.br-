import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const getUrgencyConfig = (urgency: string) => {
  switch (urgency) {
    case "critical":
      return {
        color: "bg-destructive/10 text-destructive",
        icon: AlertCircle,
        label: "Crítico"
      };
    case "high":
      return {
        color: "bg-warning/10 text-warning",
        icon: Clock,
        label: "Alto"
      };
    case "medium":
      return {
        color: "bg-primary/10 text-primary",
        icon: Clock,
        label: "Médio"
      };
    case "low":
      return {
        color: "bg-success/10 text-success",
        icon: CheckCircle2,
        label: "Baixo"
      };
    default:
      return {
        color: "bg-muted/10 text-muted-foreground",
        icon: Clock,
        label: "Normal"
      };
  }
};

const getDeadlineUrgency = (dataInicio: string) => {
  const now = new Date();
  const deadline = new Date(dataInicio);
  const hoursUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntil <= 24) return "critical";
  if (hoursUntil <= 48) return "high";
  if (hoursUntil <= 168) return "medium"; // 7 days
  return "low";
};

export const UpcomingDeadlines = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: deadlines, isLoading } = useQuery({
    queryKey: ["dashboard-deadlines"],
    queryFn: async () => {
      const hoje = new Date();
      const proximosMes = addDays(hoje, 30);

      const { data: agendas } = await supabase
        .from("agendas")
        .select("*")
        .eq("user_id", user?.id)
        .gte("data_inicio", hoje.toISOString())
        .lte("data_inicio", proximosMes.toISOString())
        .neq("status", "feito")
        .order("data_inicio", { ascending: true })
        .limit(4);

      return agendas?.map(agenda => ({
        id: agenda.id,
        title: agenda.titulo,
        description: agenda.descricao,
        date: agenda.data_inicio,
        urgency: getDeadlineUrgency(agenda.data_inicio),
        status: agenda.status,
        prioridade: agenda.prioridade
      })) || [];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Próximos Prazos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-warning" />
          Próximos Prazos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deadlines?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
              <p className="text-muted-foreground">Nenhum prazo próximo!</p>
              <p className="text-sm text-muted-foreground mt-2">
                Você está em dia com suas obrigações.
              </p>
            </div>
          ) : (
            deadlines?.map((deadline) => {
              const urgencyConfig = getUrgencyConfig(deadline.urgency);
              const IconComponent = urgencyConfig.icon;
              
              return (
                <div key={deadline.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-secondary/50 transition-smooth">
                  <div className={`p-2 rounded-lg ${urgencyConfig.color.replace('text-', 'bg-').replace('/10', '/20')}`}>
                    <IconComponent className={`h-4 w-4 ${urgencyConfig.color.split(' ')[1]}`} />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{deadline.title}</h4>
                      <Badge className={urgencyConfig.color}>
                        {urgencyConfig.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {deadline.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="font-medium">
                        {format(new Date(deadline.date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span>
                        {format(new Date(deadline.date), "HH:mm", { locale: ptBR })}
                      </span>
                      <Badge variant="outline">
                        {deadline.prioridade}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline">
                    Ver Detalhes
                  </Button>
                </div>
              );
            })
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="outline" className="w-full" onClick={() => navigate('/agenda')}>
            Ver Toda a Agenda
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};