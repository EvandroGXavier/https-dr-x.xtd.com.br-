import { Badge } from '@/components/ui/badge';
import { useEstoque } from '@/hooks/useEstoque';
import { formatCurrency } from '@/lib/formatters';
import { Package, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MovimentacoesGrid() {
  const { movimentacoes, saldos, isLoadingMovimentacoes, isLoadingSaldos } = useEstoque();

  const getMovimentacaoIcon = (tipo: string) => {
    const icons: Record<string, any> = {
      entrada: <TrendingUp className="h-4 w-4 text-green-600" />,
      saida: <TrendingDown className="h-4 w-4 text-red-600" />,
      ajuste: <Package className="h-4 w-4 text-blue-600" />,
      transferencia: <Package className="h-4 w-4 text-purple-600" />,
    };
    return icons[tipo] || icons.ajuste;
  };

  const getMovimentacaoBadge = (tipo: string) => {
    const variants: Record<string, any> = {
      entrada: { variant: 'default', label: 'Entrada' },
      saida: { variant: 'destructive', label: 'Saída' },
      ajuste: { variant: 'secondary', label: 'Ajuste' },
      transferencia: { variant: 'outline', label: 'Transferência' },
    };
    return variants[tipo] || variants.ajuste;
  };

  return (
    <Tabs defaultValue="saldos" className="space-y-4">
      <TabsList>
        <TabsTrigger value="saldos">Estoque Atual</TabsTrigger>
        <TabsTrigger value="movimentacoes">Histórico de Movimentações</TabsTrigger>
      </TabsList>

      <TabsContent value="saldos">
        {isLoadingSaldos ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : !saldos || saldos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            Nenhum saldo em estoque
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
              {saldos.map((saldo) => (
                <TableRow key={`${saldo.produto_id}-${saldo.localizacao_id}`}>
                  <TableCell className="font-mono">
                    {saldo.produto?.codigo_interno || '-'}
                  </TableCell>
                  <TableCell>{saldo.produto?.descricao || '-'}</TableCell>
                  <TableCell>{saldo.localizacao?.nome || '-'}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {saldo.quantidade.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(saldo.custo_medio)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(saldo.quantidade * saldo.custo_medio)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="movimentacoes">
        {isLoadingMovimentacoes ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : !movimentacoes || movimentacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma movimentação registrada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Valor Unit.</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead>Documento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movimentacoes.map((mov) => {
                const badgeInfo = getMovimentacaoBadge(mov.tipo_movimentacao);
                return (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {format(
                        new Date(mov.data_movimentacao),
                        'dd/MM/yyyy HH:mm',
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovimentacaoIcon(mov.tipo_movimentacao)}
                        <span>{mov.produto?.descricao || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeInfo.variant}>
                        {badgeInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {mov.quantidade.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {mov.valor_unitario
                        ? formatCurrency(mov.valor_unitario)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {mov.valor_total ? formatCurrency(mov.valor_total) : '-'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {mov.documento_origem || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  );
}
