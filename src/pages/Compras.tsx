import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompras } from '@/hooks/useCompras';
import { formatCurrency } from '@/lib/formatters';
import { Plus, FileText, CheckCircle, Upload, BarChart, Trash2 } from 'lucide-react';
import { ImportarNfeDialog } from '@/components/compras/ImportarNfeDialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Compras() {
  const navigate = useNavigate();
  const { compras, isLoading, aprovarCompra, isApproving, deletarCompra, isDeleting } = useCompras();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [compraToDelete, setCompraToDelete] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: 'secondary', label: 'Pendente' },
      aprovada: { variant: 'default', label: 'Aprovada' },
      cancelada: { variant: 'destructive', label: 'Cancelada' },
    };
    return variants[status] || variants.pendente;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Compras / Entradas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas notas fiscais de entrada e compras
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/relatorios/estoque')}>
              <BarChart className="h-4 w-4 mr-2" />
              Estoque
            </Button>
            <Button variant="outline" onClick={() => navigate('/relatorios/compras')}>
              <BarChart className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Importar NF-e
            </Button>
            <Button onClick={() => navigate('/compras/nova')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Compra
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Compras Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : !compras || compras.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma compra registrada
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NF-e</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {compras.map((compra) => {
                    const statusInfo = getStatusBadge(compra.status);
                    return (
                      <TableRow 
                        key={compra.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onDoubleClick={() => navigate(`/compras/${compra.id}`)}
                      >
                        <TableCell className="font-mono">
                          {compra.numero_nfe || '-'}
                        </TableCell>
                        <TableCell>
                          {compra.data_emissao
                            ? format(
                                new Date(compra.data_emissao),
                                'dd/MM/yyyy',
                                { locale: ptBR }
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {compra.fornecedor?.nome_fantasia || '-'}
                        </TableCell>
                        <TableCell className="capitalize">
                          {compra.tipo}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(compra.valor_total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/compras/${compra.id}`);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {compra.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                aprovarCompra(compra.id);
                              }}
                              disabled={isApproving}
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompraToDelete(compra.id);
                            }}
                            disabled={isDeleting}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <ImportarNfeDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onSuccess={() => window.location.reload()}
        />

        <AlertDialog open={!!compraToDelete} onOpenChange={() => setCompraToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta compra? Esta ação não pode ser desfeita.
                Todos os itens e parcelas associados também serão excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (compraToDelete) {
                    deletarCompra(compraToDelete);
                    setCompraToDelete(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
