import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ProcessoAgendaProps {
  processoId: string;
}

const statusColors = {
  analise: "bg-yellow-500",
  a_fazer: "bg-gray-500",
  fazendo: "bg-blue-500",
  feito: "bg-green-500",
};

const statusLabels = {
  analise: "Em Análise",
  a_fazer: "A Fazer",
  fazendo: "Em Andamento",
  feito: "Concluído",
};

export function ProcessoAgenda({ processoId }: ProcessoAgendaProps) {
  const navigate = useNavigate();

  const { data: agendas, isLoading } = useQuery({
    queryKey: ["processo-agenda", processoId],
    queryFn: async () => {
      // Buscar agendas que possam estar diretamente relacionadas
      const { data: agendasDiretas } = await supabase
        .from("agendas")
        .select("*")
        .or(`titulo.ilike.%${processoId}%,descricao.ilike.%${processoId}%,observacoes.ilike.%${processoId}%`)
        .order("data_inicio", { ascending: true });

      const todasAgendas = agendasDiretas || [];

      const hoje = new Date();
      const proximosPrazos = todasAgendas.filter(agenda => {
        const dataInicio = new Date(agenda.data_inicio);
        return isAfter(dataInicio, hoje) && isBefore(dataInicio, addDays(hoje, 30));
      });

      const atrasados = todasAgendas.filter(agenda => {
        const dataInicio = new Date(agenda.data_inicio);
        return isBefore(dataInicio, hoje) && agenda.status !== 'feito';
      });

      return {
        todas: todasAgendas,
        proximosPrazos,
        atrasados,
      };
    },
    enabled: !!processoId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agenda do Processo
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

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Próximos Prazos</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {agendas?.proximosPrazos?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Atrasados</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {agendas?.atrasados?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Requer atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {agendas?.todas?.length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Todas as agendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Prazos */}
      {agendas?.proximosPrazos && agendas.proximosPrazos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Próximos Prazos (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agendas.proximosPrazos.slice(0, 5).map((agenda) => (
                <div key={agenda.id} className="flex items-center justify-between p-3 border rounded-lg border-orange-200 bg-orange-50">
                  <div>
                    <p className="font-medium">{agenda.titulo}</p>
                    <p className="text-sm text-muted-foreground">{agenda.descricao}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={statusColors[agenda.status as keyof typeof statusColors]}>
                        {statusLabels[agenda.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant="outline">{agenda.prioridade}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">
                      {format(new Date(agenda.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(agenda.data_inicio), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Atrasados */}
      {agendas?.atrasados && agendas.atrasados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-500" />
              Agendas Atrasadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {agendas.atrasados.map((agenda) => (
                <div key={agenda.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
                  <div>
                    <p className="font-medium">{agenda.titulo}</p>
                    <p className="text-sm text-muted-foreground">{agenda.descricao}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={statusColors[agenda.status as keyof typeof statusColors]}>
                        {statusLabels[agenda.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant="outline">{agenda.prioridade}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">
                      {format(new Date(agenda.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(agenda.data_inicio), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todas as Agendas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Todas as Agendas Relacionadas
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/agenda')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Agenda Completa
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/agenda')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Agenda
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!agendas?.todas?.length ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma agenda relacionada a este processo.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Crie uma nova agenda para gerenciar audiências, prazos e eventos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agendas.todas.map((agenda) => (
                <div key={agenda.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{agenda.titulo}</p>
                    <p className="text-sm text-muted-foreground">{agenda.descricao}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge className={statusColors[agenda.status as keyof typeof statusColors]}>
                        {statusLabels[agenda.status as keyof typeof statusLabels]}
                      </Badge>
                      <Badge variant="outline">{agenda.prioridade}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {format(new Date(agenda.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(agenda.data_inicio), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}