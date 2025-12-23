import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FaseTemplateDrawer } from "./FaseTemplateDrawer";
import { useFaseTemplates, FaseTemplate } from "@/hooks/useFaseTemplates";
import { useEtiquetas } from "@/hooks/useEtiquetas";
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

export function FaseTemplatesTab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FaseTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const { templates, isLoading, deleteTemplate } = useFaseTemplates();
  const { etiquetas } = useEtiquetas("processos");

  const handleEdit = (template: FaseTemplate) => {
    setEditingTemplate(template);
    setDrawerOpen(true);
  };

  const handleNew = () => {
    setEditingTemplate(null);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteTemplate.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const getEtiquetaNome = (etiquetaId: string) => {
    const etiqueta = etiquetas.find((e) => e.id === etiquetaId);
    return etiqueta?.nome || "Desconhecida";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Templates por Fase</CardTitle>
            <CardDescription>
              Configure ações automáticas ao mudar a fase de um processo
            </CardDescription>
          </div>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum template configurado. Clique em "Novo Template" para começar.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fase (Etiqueta)</TableHead>
                  <TableHead>Tarefa a Criar</TableHead>
                  <TableHead>Prazo (dias)</TableHead>
                  <TableHead>Etiqueta Adicional</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {getEtiquetaNome(template.etiqueta_fase_id)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {template.tarefa_descricao}
                    </TableCell>
                    <TableCell>
                      {template.alerta_dias ? `${template.alerta_dias} dias` : "-"}
                    </TableCell>
                    <TableCell>
                      {template.etiqueta_auto_id ? (
                        <Badge variant="secondary">
                          {getEtiquetaNome(template.etiqueta_auto_id)}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => template.id && handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <FaseTemplateDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        template={editingTemplate}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
