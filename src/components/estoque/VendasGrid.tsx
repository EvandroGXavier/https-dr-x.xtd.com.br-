import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVendas } from '@/hooks/useVendas';
import { formatCurrency } from '@/lib/formatters';
import { Plus, FileText, CheckCircle, BarChart, Trash2 } from 'lucide-react';
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

export function VendasGrid() {
  const navigate = useNavigate();
  const { vendas, isLoading, aprovarVenda, isApproving, deletarVenda, isDeleting } = useVendas();
  const [vendaToDelete, setVendaToDelete] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: 'secondary', label: 'Pendente' },
      aprovada: { variant: 'default', label: 'Aprovada' },
      cancelada: { variant: 'destructive', label: 'Cancelada' },
    };
    return variants[status] || variants.pendente;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Vendas Recentes</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/relatorios/vendas')}>
            <BarChart className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
          <Button size="sm" onClick={() => navigate('/vendas/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando...
        </div>
      ) : !vendas || vendas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhuma venda registrada
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>NF-e</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendas.map((venda) => {
              const statusInfo = getStatusBadge(venda.status);
              return (
                <TableRow 
                  key={venda.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onDoubleClick={() => navigate(`/vendas/${venda.id}`)}
                >
                  <TableCell className="font-mono">
                    {venda.numero_nfe || '-'}
                  </TableCell>
                  <TableCell>
                    {venda.data_emissao
                      ? format(
                          new Date(venda.data_emissao),
                          'dd/MM/yyyy',
                          { locale: ptBR }
                        )
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {venda.cliente?.nome_fantasia || '-'}
                  </TableCell>
                  <TableCell className="capitalize">
                    {venda.tipo}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(venda.valor_total)}
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
                        navigate(`/vendas/${venda.id}`);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    {venda.status === 'pendente' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          aprovarVenda(venda.id);
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
                        setVendaToDelete(venda.id);
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

      <AlertDialog open={!!vendaToDelete} onOpenChange={() => setVendaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
              Todos os itens e parcelas associados também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (vendaToDelete) {
                  deletarVenda(vendaToDelete);
                  setVendaToDelete(null);
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
  );
}
