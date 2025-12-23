import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, FileText, HandshakeIcon, Calendar, DollarSign, GitBranch, Clock, Gavel } from "lucide-react";
import { useProcesso } from "@/hooks/useProcessos";
import ProcessoFormulario from "@/components/processos/ProcessoFormulario";
import { useToast } from "@/hooks/use-toast";
import { ProcessoPartes } from "@/components/processos/ProcessoPartes";
import { ProcessoMovimentacoes } from "@/components/processos/ProcessoMovimentacoes";
import { ProcessoContratos } from "@/components/processos/ProcessoContratos";
import { ProcessoHonorarios } from "@/components/processos/ProcessoHonorarios";
import { DocsList } from "@/components/docs/DocsList";
import { ProcessoAgenda } from "@/components/processos/ProcessoAgenda";
import { ProcessoFinanceiro } from "@/components/processos/ProcessoFinanceiro";
import { ProcessoDesdobramentos } from "@/components/processos/ProcessoDesdobramentos";
import { ProcessoTimeline } from "@/components/processos/ProcessoTimeline";
import { ProcessoTjTab } from "@/components/processos/ProcessoTjTab";
import { AnaliseEstrategicaView } from "@/components/processos/detalhes/AnaliseEstrategicaView";
import { AppLayout } from "@/components/layout/AppLayout";
import { STATUS_PROCESSO, Processo } from "@/types/processos";

// Cores para status do Kanban
const statusColors: Record<string, string> = {
  'Oportunidade': "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  'Em Análise': "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20", 
  'Aguardando Cliente': "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  'Ativo': "bg-success/10 text-success hover:bg-success/20",
  'Suspenso': "bg-warning/10 text-warning hover:bg-warning/20",
  'Encerrado': "bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20",
  'Recusado': "bg-destructive/10 text-destructive hover:bg-destructive/20",
};

export default function ProcessoDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("principal");
  const modoNovo = id === 'novo';
  const { processo, isLoading } = useProcesso(modoNovo ? undefined : id);
  const { toast } = useToast();

  if (isLoading && !modoNovo) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (!modoNovo && !processo?.processo_data) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Processo não encontrado.</p>
            <Link to="/processos">
              <Button className="mt-4">Voltar para Processos</Button>
            </Link>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Para modo novo, usar valores default
  const processoData = modoNovo 
    ? { titulo: '', descricao: '', local: '', status: 'Oportunidade' }
    : processo!.processo_data as Processo;

  // Verificar se deve mostrar a view de análise estratégica (somente para processos existentes em estágio inicial)
  const isEstagioInicial = !modoNovo && (
    processoData.status === STATUS_PROCESSO.OPORTUNIDADE || 
    processoData.status === STATUS_PROCESSO.EM_ANALISE
  );

  // Se for estágio inicial, mostrar view de análise
  if (isEstagioInicial && !modoNovo) {
    return (
      <AppLayout>
        <AnaliseEstrategicaView processo={processoData as Processo} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/processos">
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">
                  {modoNovo ? "Novo Caso" : processoData.titulo || "Sem título"}
                </h1>
                {!modoNovo && processoData.status && (
                  <Badge className={statusColors[processoData.status] || "bg-muted text-muted-foreground"}>
                    {processoData.status}
                  </Badge>
                )}
              </div>
              {!modoNovo && processoData.descricao && (
                <p className="text-muted-foreground line-clamp-1">
                  {processoData.descricao.replace(/<[^>]*>/g, '').substring(0, 100)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
            <TabsTrigger value="principal" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Principal</span>
            </TabsTrigger>
            <TabsTrigger value="partes" className="gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Partes</span>
            </TabsTrigger>
            <TabsTrigger value="judicial" className="gap-1">
              <Gavel className="h-4 w-4" />
              <span className="hidden sm:inline">TJ</span>
            </TabsTrigger>
            <TabsTrigger value="movimentacoes" className="gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Movimentações</span>
            </TabsTrigger>
            <TabsTrigger value="contratos" className="gap-1">
              <HandshakeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Contratos</span>
            </TabsTrigger>
            <TabsTrigger value="honorarios" className="gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Honorários</span>
            </TabsTrigger>
            <TabsTrigger value="anexos" className="gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Anexos</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="desdobramentos" className="gap-1">
              <GitBranch className="h-4 w-4" />
              <span className="hidden sm:inline">Desdobramentos</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>

          {/* Aba Principal - Formulário com os 4 campos */}
          <TabsContent value="principal">
            <Card>
              <CardContent className="p-6">
                <ProcessoFormulario
                  mode={modoNovo ? "create" : "edit"}
                  initialData={modoNovo ? undefined : {
                    id,
                    titulo: processoData.titulo,
                    descricao: processoData.descricao,
                    local: processoData.local,
                    status: processoData.status,
                  }}
                  onSubmitOk={(newId) => {
                    if (modoNovo && newId) {
                      navigate(`/processos/${newId}`);
                    } else {
                      toast({
                        title: "Sucesso",
                        description: "Processo atualizado com sucesso!",
                      });
                    }
                  }}
                  onCancel={() => navigate('/processos')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Demais abas - Tabelas Satélites */}
          <TabsContent value="partes">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoPartes processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="judicial">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoTjTab processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="movimentacoes">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoMovimentacoes processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="contratos">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoContratos processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="honorarios">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoHonorarios processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="anexos">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <DocsList vinculoTipo="processo" vinculoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="agenda">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoAgenda processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="financeiro">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoFinanceiro processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="desdobramentos">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoDesdobramentos processoId={id!} />
            )}
          </TabsContent>

          <TabsContent value="timeline">
            {modoNovo ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground">Salve o processo primeiro</CardContent></Card>
            ) : (
              <ProcessoTimeline processoId={id!} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}