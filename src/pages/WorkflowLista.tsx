import { useEffect, useState } from "react";
import { useWorkflowModelos, WorkflowModelo } from "@/hooks/useWorkflowModelos";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WorkflowLista() {
  const navigate = useNavigate();
  const { listarModelos, excluirModelo } = useWorkflowModelos();
  const [modelos, setModelos] = useState<WorkflowModelo[]>([]);
  const [modeloParaExcluir, setModeloParaExcluir] = useState<string | null>(null);

  const carregarModelos = async () => {
    try {
      const data = await listarModelos();
      setModelos(data);
    } catch (error) {
      console.error("Erro ao carregar workflows:", error);
      toast.error("Erro ao carregar workflows");
    }
  };

  useEffect(() => {
    carregarModelos();
  }, []);

  const handleExcluir = async () => {
    if (!modeloParaExcluir) return;

    try {
      await excluirModelo(modeloParaExcluir);
      toast.success("Workflow excluído com sucesso");
      setModeloParaExcluir(null);
      carregarModelos();
    } catch (error) {
      console.error("Erro ao excluir workflow:", error);
      toast.error("Erro ao excluir workflow");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Workflows Automáticos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure ações automáticas por tipo de processo
            </p>
          </div>
          <Button onClick={() => navigate("/workflow/novo")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Workflow
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modelos.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{m.nome}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.codigo}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {m.gatilho}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {m.descricao || "Sem descrição."}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/workflow/editar/${m.id}`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModeloParaExcluir(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {modelos.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Nenhum workflow configurado ainda</p>
            <Button onClick={() => navigate("/workflow/novo")}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Workflow
            </Button>
          </Card>
        )}
      </div>

      <AlertDialog open={!!modeloParaExcluir} onOpenChange={() => setModeloParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este workflow? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
