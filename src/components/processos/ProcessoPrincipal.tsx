import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Scale, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcessoPrincipalProps {
  processo: any;
}

const tipoLabels = {
  civel: "Cível",
  criminal: "Criminal",
  trabalhista: "Trabalhista",
  tributario: "Tributário",
  previdenciario: "Previdenciário",
  administrativo: "Administrativo",
  outros: "Outros"
};

const instanciaLabels = {
  primeira: "Primeira Instância",
  segunda: "Segunda Instância", 
  superior: "Superior",
  supremo: "Supremo"
};

export function ProcessoPrincipal({ processo }: ProcessoPrincipalProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Informações do Processo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Número do Processo</label>
                <p className="text-lg font-mono">{processo.numero_processo}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Assunto Principal</label>
                <p className="text-base">{processo.assunto_principal}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Processo</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    {tipoLabels[processo.tipo as keyof typeof tipoLabels]}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Instância</label>
                <p className="text-base">{instanciaLabels[processo.instancia as keyof typeof instanciaLabels]}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status Atual</label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={
                    processo.status === "ativo" ? "bg-success/10 text-success" :
                    processo.status === "suspenso" ? "bg-warning/10 text-warning" :
                    processo.status === "arquivado" ? "bg-muted-foreground/10 text-muted-foreground" :
                    "bg-primary/10 text-primary"
                  }>
                    {processo.status}
                  </Badge>
                </div>
              </div>

              {processo.valor_causa && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor da Causa</label>
                  <p className="text-lg font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(processo.valor_causa)}
                  </p>
                </div>
              )}

              {processo.data_distribuicao && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Distribuição</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">
                      {new Date(processo.data_distribuicao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Criado</label>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(processo.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização Processual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Tribunal</label>
              <p className="text-base font-medium">{processo.tribunal}</p>
            </div>
            
            {processo.comarca && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comarca</label>
                <p className="text-base">{processo.comarca}</p>
              </div>
            )}

            {processo.vara && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Vara</label>
                <p className="text-base">{processo.vara}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {processo.observacoes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {processo.observacoes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}