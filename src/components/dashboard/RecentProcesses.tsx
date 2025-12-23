import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProcessos } from "@/hooks/useProcessos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getStatusColor = (status: string) => {
  switch (status) {
    case "ativo":
      return "bg-primary/10 text-primary";
    case "suspenso":
      return "bg-warning/10 text-warning";
    case "finalizado":
      return "bg-success/10 text-success";
    case "arquivado":
      return "bg-muted/10 text-muted-foreground";
    default:
      return "bg-muted/10 text-muted-foreground";
  }
};

  const getInstanciaColor = (instancia: string) => {
    switch (instancia) {
      case "primeira":
        return "bg-blue/10 text-blue";
      case "segunda":
        return "bg-purple/10 text-purple";
      case "superior":
        return "bg-orange/10 text-orange";
      case "supremo":
        return "bg-red/10 text-red";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  // Função para extrair texto limpo do HTML
  const stripHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

export const RecentProcesses = () => {
  const navigate = useNavigate();
  const { processos, isLoading } = useProcessos();

  if (isLoading) {
    return (
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Processos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentProcesses = processos?.slice(0, 4) || [];

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Processos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentProcesses.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum processo encontrado.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Cadastre seu primeiro processo para começar.
              </p>
            </div>
          ) : (
            recentProcesses.map((processo) => (
              <div 
                key={processo.id} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer"
                onClick={() => navigate(`/processos/${processo.id}`)}
              >
                <div className="flex-1 space-y-2">
                  <div>
                    <h4 className="font-semibold text-sm">{processo.titulo}</h4>
                    {processo.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {stripHtml(processo.descricao)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <Badge variant="outline">{processo.status}</Badge>
                    <span>Atualizado {format(new Date(processo.updated_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <Badge className={getStatusColor(processo.status)}>
                    {processo.status}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/processos/${processo.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/processos/${processo.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 text-center">
          <Button variant="outline" className="w-full" onClick={() => navigate('/processos')}>
            Ver Todos os Processos
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};