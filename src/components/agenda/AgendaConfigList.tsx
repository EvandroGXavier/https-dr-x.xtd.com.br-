import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import { useAgendaConfig, AgendaConfig } from '@/hooks/useAgendaConfig';
import AgendaConfigForm from './AgendaConfigForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgendaConfigList() {
  const { configs, isLoading, createConfig, updateConfig, deleteConfig, toggleConfig } =
    useAgendaConfig();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AgendaConfig | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingConfig(null);
    setIsFormOpen(true);
  };

  const handleEdit = (config: AgendaConfig) => {
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const handleSubmit = async (values: any) => {
    if (editingConfig) {
      await updateConfig.mutateAsync({ id: editingConfig.id, ...values });
    } else {
      await createConfig.mutateAsync(values);
    }
    setIsFormOpen(false);
    setEditingConfig(null);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    await toggleConfig.mutateAsync({ id, ativo: !currentStatus });
  };

  const handleDelete = async () => {
    if (deletingId) {
      await deleteConfig.mutateAsync(deletingId);
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Configurações de Agendas Automáticas</CardTitle>
              <CardDescription>
                Configure fluxos de agendas que serão criadas automaticamente
              </CardDescription>
            </div>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Fluxo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhum fluxo configurado ainda
              </p>
              <Button onClick={handleCreate} variant="outline">
                Criar primeiro fluxo
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Fluxo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Gatilho</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">
                        {config.nome_fluxo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{config.tipo}</Badge>
                      </TableCell>
                      <TableCell>{config.modulo_origem}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{config.gatilho}</Badge>
                      </TableCell>
                      <TableCell>{config.prazo_padrao_minutos}min</TableCell>
                      <TableCell>
                        {config.ativo ? (
                          <Badge variant="default">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggle(config.id, config.ativo)}
                            title={config.ativo ? 'Desativar' : 'Ativar'}
                          >
                            <Power
                              className={`h-4 w-4 ${
                                config.ativo
                                  ? 'text-green-600'
                                  : 'text-gray-400'
                              }`}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(config)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(config.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
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
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? 'Editar Fluxo' : 'Novo Fluxo de Agenda'}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros do fluxo de agenda automática
            </DialogDescription>
          </DialogHeader>
          <AgendaConfigForm
            config={editingConfig || undefined}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={createConfig.isPending || updateConfig.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O fluxo será excluído permanentemente.
              As agendas já criadas por este fluxo não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
