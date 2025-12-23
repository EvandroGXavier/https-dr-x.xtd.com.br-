import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Building2, Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { useContasFinanceiras, ContaFinanceira } from "@/hooks/useContasFinanceiras";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContasFinanceirasTableProps {
  contas: ContaFinanceira[];
  loading: boolean;
  onEdit: (conta: ContaFinanceira) => void;
}

export function ContasFinanceirasTable({
  contas,
  loading,
  onEdit,
}: ContasFinanceirasTableProps) {
  const { deleteConta } = useContasFinanceiras();

  const getIconForTipo = (tipo: string) => {
    switch (tipo) {
      case "Conta Corrente":
      case "Conta Poupança":
        return <Building2 className="h-4 w-4" />;
      case "Caixa Físico":
        return <Wallet className="h-4 w-4" />;
      case "Investimento":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <PiggyBank className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando contas...</div>;
  }

  if (contas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma conta cadastrada. Clique em "Nova Conta" para começar.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Banco</TableHead>
          <TableHead className="text-right">Saldo Inicial</TableHead>
          <TableHead className="text-right">Saldo Atual</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contas.map((conta) => (
          <TableRow key={conta.id}>
            <TableCell className="font-medium">{conta.nome}</TableCell>
            <TableCell>
              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                {getIconForTipo(conta.tipo)}
                {conta.tipo}
              </Badge>
            </TableCell>
            <TableCell>{conta.banco || "-"}</TableCell>
            <TableCell className="text-right">
              R$ {conta.saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </TableCell>
            <TableCell className={`text-right font-semibold ${
              conta.saldo_atual >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              R$ {conta.saldo_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(conta)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a conta "{conta.nome}"?
                        Esta ação não pode ser desfeita e só será permitida se
                        não houver transações vinculadas a esta conta.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteConta(conta.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
