import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AgendaGrid } from "@/components/agenda/AgendaGrid";
import { AppLayout } from "@/components/layout/AppLayout";
import { TagFilter } from "@/components/etiquetas/TagFilter";
import { useAgendaV2List } from "@/hooks/useAgendaV2List";
import { useHasRole } from "@/hooks/useHasRole";

export default function Agenda() {
  const navigate = useNavigate();
  const [comTags, setComTags] = useState<string[]>([]);
  const [semTags, setSemTags] = useState<string[]>([]);
  const { hasRole } = useHasRole('admin');
  
  const { agendas, isLoading } = useAgendaV2List({ 
    comTags, 
    semTags 
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agendas</h1>
            <p className="text-muted-foreground">
              Gerencie suas tarefas e compromissos
            </p>
          </div>
          <div className="flex gap-2">
            {hasRole && (
              <Button
                variant="outline"
                onClick={() => navigate("/agenda/config")}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </Button>
            )}
            <Button onClick={() => navigate("/agenda/v2/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Nova Agenda</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>

        <TagFilter
          value=""
          onChange={() => {}}
          comTags={comTags}
          semTags={semTags}
          onComTagsChange={setComTags}
          onSemTagsChange={setSemTags}
        />

        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p>Carregando agendas...</p>
            </CardContent>
          </Card>
        ) : (
          <AgendaGrid data={agendas} />
        )}
      </div>
    </AppLayout>
  );
}