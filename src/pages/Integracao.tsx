import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Database, Settings, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { useIntegracao } from "@/hooks/useIntegracao";
import { Link } from "react-router-dom";
import { FEATURES } from "@/config/features";

export default function Integracao() {
  const { jobs, credenciais, loading } = useIntegracao();

  if (!FEATURES.INTEGRACAO_JUDICIAL_V1) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Módulo em Desenvolvimento</h1>
          <p className="text-muted-foreground">
            O módulo de integração judiciária ainda não está disponível.
          </p>
        </div>
      </AppLayout>
    );
  }

  const jobsPendentes = jobs.filter(job => job.status === 'PENDENTE').length;
  const jobsErro = jobs.filter(job => job.status === 'FALHA').length;
  const credenciaisHabilitadas = credenciais.filter(c => c.homologado).length;

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integração Judiciária</h1>
            <p className="text-muted-foreground">
              Gerencie a integração com os sistemas judiciais brasileiros
            </p>
          </div>
          <Button asChild>
            <Link to="/integracao/configuracoes">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credenciais Ativas</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{credenciaisHabilitadas}</div>
              <p className="text-xs text-muted-foreground">
                +{credenciais.length - credenciaisHabilitadas} aguardando homologação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Pendentes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobsPendentes}</div>
              <p className="text-xs text-muted-foreground">
                na fila de processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhas</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{jobsErro}</div>
              <p className="text-xs text-muted-foreground">
                jobs com erro
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status Geral</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {credenciaisHabilitadas > 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">Operacional</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500">Configuração Necessária</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Conectores Disponíveis</CardTitle>
              <CardDescription>
                Sistemas judiciais suportados pelo XTD ERP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span>DataJud (CNJ)</span>
                <Badge variant="secondary">Consulta</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>PJe</span>
                <Badge variant="outline">Em breve</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>MNI (Peticionamento)</span>
                <Badge variant="outline">Em breve</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs Recentes</CardTitle>
              <CardDescription>
                Últimas atividades de sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              {jobs.slice(0, 5).map((job) => (
                <div key={job.id} className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{job.tipo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={
                    job.status === 'SUCESSO' ? 'default' :
                    job.status === 'FALHA' ? 'destructive' :
                    job.status === 'EM_EXECUCAO' ? 'secondary' : 'outline'
                  }>
                    {job.status}
                  </Badge>
                </div>
              ))}
              {jobs.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum job encontrado
                </p>
              )}
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/integracao/fila">Ver todos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}