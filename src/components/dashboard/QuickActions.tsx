import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Users, Calendar, DollarSign, Gavel, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    icon: Gavel,
    title: "Novo Processo",
    description: "Cadastrar novo processo judicial",
    color: "primary",
    route: "/processos/novo"
  },
  {
    icon: Users,
    title: "Novo Cliente",
    description: "Adicionar cliente ao sistema",
    color: "success",
    route: "/contatos"
  },
  {
    icon: Calendar,
    title: "Agendar Compromisso",
    description: "Marcar reunião ou audiência",
    color: "warning",
    route: "/agenda"
  },
  {
    icon: FileText,
    title: "Criar Documento",
    description: "Gerar petição ou contrato",
    color: "accent",
    route: "/documentos"
  },
  {
    icon: DollarSign,
    title: "Lançar Honorário",
    description: "Registrar recebimento",
    color: "success",
    route: "/financeiro"
  },
  {
    icon: MessageSquare,
    title: "Nova Etiqueta",
    description: "Organizar processos",
    color: "primary",
    route: "/etiquetas"
  }
];

export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const IconComponent = action.icon;
            
            return (
              <Button
                key={action.title}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-secondary/50 transition-smooth"
                onClick={() => navigate(action.route)}
              >
                <div className={`p-2 rounded-lg bg-${action.color}/10`}>
                  <IconComponent className={`h-5 w-5 text-${action.color}`} />
                </div>
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};