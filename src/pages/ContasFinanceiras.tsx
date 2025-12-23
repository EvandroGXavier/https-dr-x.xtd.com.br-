import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useContasFinanceiras } from "@/hooks/useContasFinanceiras";
import { ContaFinanceiraDialog } from "@/components/financeiro/ContaFinanceiraDialog";
import { ContasFinanceirasTable } from "@/components/financeiro/ContasFinanceirasTable";

export default function ContasFinanceiras() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const { contas, loading } = useContasFinanceiras();

  const handleEdit = (conta: any) => {
    setSelectedConta(conta);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedConta(null);
  };

  const totalSaldo = contas.reduce((sum, conta) => sum + (conta.saldo_atual || 0), 0);
  const saldoPositivo = contas
    .filter(c => (c.saldo_atual || 0) > 0)
    .reduce((sum, conta) => sum + conta.saldo_atual, 0);
  const saldoNegativo = contas
    .filter(c => (c.saldo_atual || 0) < 0)
    .reduce((sum, conta) => sum + Math.abs(conta.saldo_atual), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contas Financeiras</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas contas bancárias, caixas e investimentos
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totalSaldo >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {totalSaldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {contas.length} conta{contas.length !== 1 ? 's' : ''} ativa{contas.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldos Positivos</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {saldoPositivo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {contas.filter(c => (c.saldo_atual || 0) > 0).length} conta(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldos Negativos</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {saldoNegativo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {contas.filter(c => (c.saldo_atual || 0) < 0).length} conta(s)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Contas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Todas as Contas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ContasFinanceirasTable
              contas={contas}
              loading={loading}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>

        {/* Dialog para Criar/Editar */}
        <ContaFinanceiraDialog
          open={isDialogOpen}
          onOpenChange={handleCloseDialog}
          conta={selectedConta}
        />
      </div>
    </AppLayout>
  );
}
