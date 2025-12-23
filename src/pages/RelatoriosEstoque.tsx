import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/formatters';
import { Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function RelatoriosEstoque() {
  const { data: estoqueAtual, isLoading } = useQuery({
    queryKey: ['relatorio_estoque_completo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_saldos')
        .select(`
          *,
          produto:produtos(descricao, codigo_interno),
          localizacao:estoque_localizacoes(nome)
        `)
        .order('produto(descricao)');

      if (error) throw error;
      return data;
    },
  });

  const exportarCSV = () => {
    if (!estoqueAtual || estoqueAtual.length === 0) {
      toast({
        title: "Erro ao exportar relatório",
        description: "Nenhum dado disponível para exportação",
        variant: "destructive",
      });
      return;
    }

    const header = ["Código", "Produto", "Localização", "Quantidade", "Custo Médio", "Valor Total"];
    const rows = estoqueAtual.map((item: any) => [
      item.produto?.codigo_interno || '-',
      item.produto?.descricao || '-',
      item.localizacao?.nome || '-',
      item.quantidade || 0,
      (item.custo_medio || 0).toFixed(2),
      ((item.quantidade || 0) * (item.custo_medio || 0)).toFixed(2),
    ]);

    const csv = [header, ...rows].map((line) => line.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Relatório exportado com sucesso ✅",
      description: "O arquivo CSV foi baixado",
    });
  };

  const valorTotal = estoqueAtual?.reduce(
    (acc, item) => acc + (item.quantidade * item.custo_medio || 0),
    0
  ) || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">📦 Relatório de Estoque Atual</h1>
            <p className="text-muted-foreground mt-1">
              Saldo atual de produtos em estoque, com custo médio e valor total
            </p>
          </div>
          <Button
            onClick={exportarCSV}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading || !estoqueAtual?.length}
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Estoque por Produto e Localização</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor Total do Estoque</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(valorTotal)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando relatório...
              </div>
            ) : !estoqueAtual || estoqueAtual.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum produto em estoque encontrado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead className="text-right">Quantidade</TableHead>
                    <TableHead className="text-right">Custo Médio</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estoqueAtual.map((item) => (
                    <TableRow key={`${item.produto_id}-${item.localizacao_id}`}>
                      <TableCell className="font-mono">
                        {item.produto?.codigo_interno || '-'}
                      </TableCell>
                      <TableCell>{item.produto?.descricao || '-'}</TableCell>
                      <TableCell>{item.localizacao?.nome || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantidade}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.custo_medio)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.quantidade * item.custo_medio)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
