import { useSaasData } from "../hooks/useSaasData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function EmpresasGrid() {
  const { empresas, loading } = useSaasData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Carregando empresas...</p>
      </div>
    );
  }

  if (!empresas || empresas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Nenhuma empresa cadastrada no sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ATIVA':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'INADIMPLENTE':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'CANCELADA':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {empresas.map((empresa) => (
          <Card key={empresa.empresa_uuid} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium">
                {empresa.razao_social}
              </CardTitle>
              {empresa.nome_fantasia && empresa.nome_fantasia !== empresa.razao_social && (
                <p className="text-sm text-muted-foreground">
                  {empresa.nome_fantasia}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Plano:</span>
                <span className="text-sm">{empresa.plano}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Valor:</span>
                <span className="text-sm font-mono">
                  {formatCurrency(empresa.valor)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vencimento:</span>
                <span className="text-sm">Dia {empresa.dia_vencimento}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge className={getStatusColor(empresa.status)}>
                  {empresa.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                <span>Atualizado:</span>
                <span>
                  {format(new Date(empresa.updated_at), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}