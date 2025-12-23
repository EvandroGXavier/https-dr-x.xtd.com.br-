import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProcessosDataTable } from "@/components/processos/ProcessosDataTable";
import { TagFilter } from "@/components/etiquetas/TagFilter";
import { ProcessoKanbanView } from "@/components/processos/kanban/ProcessoKanbanView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, List, LayoutDashboard, Settings } from "lucide-react";

export default function Processos() {
  const navigate = useNavigate();
  const [comTags, setComTags] = useState<string[]>([]);
  const [semTags, setSemTags] = useState<string[]>([]);

  // Dr. X-EPR: Fluxo alterado para "Fill-First". Navegação direta sem criar rascunho.
  const handleCreateNew = () => {
    navigate("/processos/novo");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Processos</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate('/processos/configuracoes')}
              title="Configurações de Processos"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Processo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista" className="gap-2">
              <List className="h-4 w-4" />
              Lista
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="lista" className="space-y-4">
            <TagFilter
              value=""
              onChange={() => {}}
              comTags={comTags}
              semTags={semTags}
              onComTagsChange={setComTags}
              onSemTagsChange={setSemTags}
            />
            <ProcessosDataTable 
              onCreateNew={handleCreateNew} 
              tagFilters={{ comTags, semTags }}
            />
          </TabsContent>
          
          <TabsContent value="kanban">
            <ProcessoKanbanView />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
