import { AppLayout } from '@/components/layout/AppLayout';
import { ProcessoKanbanView } from '@/components/processos/kanban/ProcessoKanbanView';
import { Button } from '@/components/ui/button';
import { List, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FunilAtendimento() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Funil de Atendimento</h1>
              <p className="text-sm text-muted-foreground">Gerencie as fases de captação e atendimento</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/etiquetas')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Configurar Fases
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/processos')}
              >
                <List className="mr-2 h-4 w-4" />
                Visão em Lista
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ProcessoKanbanView isFunilMode={true} />
        </div>
      </div>
    </AppLayout>
  );
}
