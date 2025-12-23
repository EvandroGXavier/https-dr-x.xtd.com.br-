import { AppLayout } from '@/components/layout/AppLayout';
import { ProcessoKanbanView } from '@/components/processos/kanban/ProcessoKanbanView';
import { Button } from '@/components/ui/button';
import { Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProcessos } from '@/hooks/useProcessos';
import { toast } from 'sonner';

export default function ProcessosKanbanPage() {
  const navigate = useNavigate();
  const { createMinimalProcesso, isCreatingMinimal } = useProcessos();

  const handleNovoProcesso = async () => {
    try {
      const novoProcesso = await createMinimalProcesso();
      navigate(`/processos/${novoProcesso.id}`);
      toast.success('Processo criado! Preencha os dados principais.');
    } catch (error) {
      console.error('Erro ao criar processo:', error);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fluxo de Processos</h1>
              <p className="text-sm text-muted-foreground">Gerencie seus casos de forma visual</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/processos')}
              >
                <List className="mr-2 h-4 w-4" />
                Visão em Lista
              </Button>
              <Button onClick={handleNovoProcesso} disabled={isCreatingMinimal}>
                <Plus className="mr-2 h-4 w-4" />
                {isCreatingMinimal ? 'Criando...' : 'Novo Caso'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ProcessoKanbanView />
        </div>
      </div>
    </AppLayout>
  );
}
