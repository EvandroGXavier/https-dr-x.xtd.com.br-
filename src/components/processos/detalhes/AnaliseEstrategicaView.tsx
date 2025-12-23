import { Processo, STATUS_PROCESSO } from '@/types/processos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Scale,
  FileSearch
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProcessos } from '@/hooks/useProcessos';
import { useToast } from '@/hooks/use-toast';
import { ResumoIA } from '../analise/ResumoIA';
import { TimelineIA } from '../analise/TimelineIA';
import { PontosAtencaoIA } from '../analise/PontosAtencaoIA';

interface AnaliseEstrategicaViewProps {
  processo: Processo;
}

export function AnaliseEstrategicaView({ processo }: AnaliseEstrategicaViewProps) {
  const navigate = useNavigate();
  const { updateProcesso } = useProcessos();
  const { toast } = useToast();

  const handleAvancarStatus = async () => {
    const proximoStatus: any = processo.status === STATUS_PROCESSO.OPORTUNIDADE 
      ? STATUS_PROCESSO.EM_ANALISE 
      : STATUS_PROCESSO.ATIVO;

    try {
      await updateProcesso({
        id: processo.id,
        status: proximoStatus,
      });

      toast({
        title: 'Status atualizado',
        description: `Processo movido para "${proximoStatus}"`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  };

  const handleRecusar = async () => {
    try {
      await updateProcesso({
        id: processo.id,
        status: STATUS_PROCESSO.RECUSADO as any,
      });

      toast({
        title: 'Caso recusado',
        description: 'O caso foi marcado como recusado.',
      });
      
      navigate('/processos/kanban');
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível recusar o caso.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {processo.status}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {processo.titulo || 'Novo Caso'}
          </h1>
          {processo.descricao && (
            <p className="text-muted-foreground">{processo.descricao}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRecusar}>
            Recusar Caso
          </Button>
          <Button onClick={handleAvancarStatus}>
            {processo.status === STATUS_PROCESSO.OPORTUNIDADE ? 'Iniciar Análise' : 'Ativar Caso'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumo">
            <Sparkles className="mr-2 h-4 w-4" />
            Resumo IA
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="mr-2 h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="partes">
            <Users className="mr-2 h-4 w-4" />
            Partes
          </TabsTrigger>
          <TabsTrigger value="estrategia">
            <Scale className="mr-2 h-4 w-4" />
            Estratégia
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumo IA */}
        <TabsContent value="resumo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Análise Automática
              </CardTitle>
              <CardDescription>
                Resumo gerado automaticamente a partir dos documentos capturados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {processo.descricao ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {processo.descricao}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSearch className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhuma descrição disponível ainda.</p>
                  <p className="text-sm">Aguardando análise dos documentos...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cards de análise rápida */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pontos Fortes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-muted-foreground">Documentação completa</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-muted-foreground">Prazo adequado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pontos de Atenção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span className="text-muted-foreground">Verificar competência</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                    <span className="text-muted-foreground">Confirmar valores</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Próximos Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-muted-foreground">Contatar cliente</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    <span className="text-muted-foreground">Definir honorários</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Capturados</CardTitle>
              <CardDescription>
                Arquivos e textos enviados durante a captura do caso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Visualização de documentos em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Partes */}
        <TabsContent value="partes">
          <Card>
            <CardHeader>
              <CardTitle>Partes Envolvidas</CardTitle>
              <CardDescription>
                Identificação das partes detectadas nos documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma parte cadastrada ainda</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate(`/processos/${processo.id}`)}>
                  Gerenciar Partes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estratégia */}
        <TabsContent value="estrategia">
          <Card>
            <CardHeader>
              <CardTitle>Estratégia Sugerida</CardTitle>
              <CardDescription>
                Recomendações baseadas na análise do caso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Scale className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Análise estratégica em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
