import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import ProcessoFormulario from "@/components/processos/ProcessoFormulario";
import { ErrorBoundaryLocal } from "@/components/common/ErrorBoundaryLocal";
import { useProcesso } from "@/hooks/useProcessos";
import { Card, CardContent } from "@/components/ui/card";
import { usePreenchimentoIAStore } from "@/store/preenchimento-ia";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function ProcessoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Dr. X-EPR: Lógica vital - Se for 'novo', não é edição.
  const isNew = id === 'novo';
  const isEditing = !!id && !isNew;
  
  // Só busca processo se for edição real
  const { processo, isLoading } = useProcesso(isEditing ? id! : '');
  
  const { consumirDados } = usePreenchimentoIAStore();
  const [dadosPreenchidosIA, setDadosPreenchidosIA] = useState(false);
  const [dadosIA, setDadosIA] = useState<any>(null);
  
  const title = isEditing ? "Editar Processo" : "Novo Processo";
  const subtitle = isEditing && processo
    ? `${(processo?.processo_data as any)?.titulo || 'Dados Básicos'}`
    : "Preencha os dados iniciais para criar a pasta do caso";

  // Consome dados da IA ao carregar a página (apenas para novo processo)
  useEffect(() => {
    if (isNew) {
      const dados = consumirDados();
      if (dados && dados.tipo === 'processo') {
        setDadosIA(dados.dados);
        setDadosPreenchidosIA(true);
        
        toast({
          title: 'IA Ativa',
          description: 'Os dados da petição foram pré-carregados. Revise antes de salvar.',
        });
      }
    }
  }, [isNew, consumirDados, toast]);

  // Dr. X-EPR: Callback fundamental para o fluxo "Save -> Edit"
  const handleSubmitOk = (processoId?: string) => {
    if (processoId) {
      // Redireciona para a visão DETALHADA (onde estão todas as abas)
      navigate(`/processos/${processoId}`);
    } else {
      navigate("/processos");
    }
  };

  if (isEditing && isLoading) {
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

  if (isEditing && !processo?.processo_data) {
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

  return (
    <AppLayout>
      <ErrorBoundaryLocal>
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={isEditing ? `/processos/${id}` : "/processos"}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {isEditing ? "Voltar ao Processo" : "Cancelar"}
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Alerta de preenchimento por IA */}
          {dadosPreenchidosIA && (
            <Alert className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 dark:from-purple-950/20 dark:to-pink-950/20">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800 dark:text-purple-200">
                Dados sugeridos pela IA. Por favor, revise as informações iniciais.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardContent className="p-6">
              <ProcessoFormulario
                mode={isEditing ? "edit" : "create"}
                initialData={isEditing ? {
                  id,
                  titulo: (processo?.processo_data as any)?.titulo,
                  descricao: (processo?.processo_data as any)?.descricao,
                  local: (processo?.processo_data as any)?.local,
                  status: (processo?.processo_data as any)?.status,
                } : dadosIA}
                onSubmitOk={handleSubmitOk}
                onCancel={() => navigate("/processos")}
              />
            </CardContent>
          </Card>
        </div>
      </ErrorBoundaryLocal>
    </AppLayout>
  );
}
