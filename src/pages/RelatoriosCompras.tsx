import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function RelatoriosCompras() {
  const { data: estoqueAtual } = useQuery({
    queryKey: ['relatorio_estoque'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_saldos')
        .select(`
          *,
          produto:produtos(descricao, codigo_interno),
          localizacao:estoque_localizacoes(nome)
        `);

      if (error) throw error;
      return data;
    },
  });

  const { data: movimentacoes } = useQuery({
    queryKey: ['relatorio_movimentacoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estoque_movimentacoes')
        .select(`
          *,
          produto:produtos(descricao, codigo_interno)
        `)
        .order('data_movimentacao', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const { data: comprasPorFornecedor } = useQuery({
    queryKey: ['relatorio_fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select(`
          valor_total,
          fornecedor:contatos_v2(nome_fantasia)
        `);

      if (error) throw error;

      // Agregar por fornecedor
      const agregado = data.reduce((acc: any, compra: any) => {
        const nome = compra.fornecedor?.nome_fantasia || 'Sem fornecedor';
        if (!acc[nome]) {
          acc[nome] = { nome, total: 0, quantidade: 0 };
        }
        acc[nome].total += compra.valor_total || 0;
        acc[nome].quantidade += 1;
        return acc;
      }, {});

      return Object.values(agregado).sort((a: any, b: any) => b.total - a.total);
    },
  });

  const { data: divergenciasFiscais } = useQuery({
    queryKey: ['relatorio_divergencias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_itens')
        .select(`
          *,
          compra:compras(numero_nfe, data_emissao)
        `);

      if (error) throw error;

      // Filtrar itens com problemas fiscais
      return data.filter((item: any) => {
        const ncmInvalido = !item.ncm || item.ncm.length !== 8;
        const cfopInvalido = !item.cfop || item.cfop.length < 4;
        return ncmInvalido || cfopInvalido;
      });
    },
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">📊 Relatórios de Compras</h1>
          <p className="text-muted-foreground mt-1">
            Análises e indicadores do módulo de compras e estoque
          </p>
        </div>

        <Tabs defaultValue="estoque" className="w-full">
          <TabsList>
            <TabsTrigger value="estoque">Estoque Atual</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
            <TabsTrigger value="fornecedores">Por Fornecedor</TabsTrigger>
            <TabsTrigger value="divergencias">
              Divergências Fiscais
              {divergenciasFiscais && divergenciasFiscais.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {divergenciasFiscais.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="estoque">
            <Card>
              <CardHeader>
                <CardTitle>Estoque Atual por Produto</CardTitle>
              </CardHeader>
              <CardContent>
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
                    {estoqueAtual?.map((item) => (
                      <TableRow key={`${item.produto_id}-${item.localizacao_id}`}>
                        <TableCell className="font-mono">
                          {item.produto?.codigo_interno || '-'}
                        </TableCell>
                        <TableCell>{item.produto?.descricao || '-'}</TableCell>
                        <TableCell>{item.localizacao?.nome || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movimentacoes">
            <Card>
              <CardHeader>
                <CardTitle>Últimas Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead>Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimentacoes?.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {new Date(mov.data_movimentacao).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              mov.tipo_movimentacao === 'entrada'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {mov.tipo_movimentacao}
                          </Badge>
                        </TableCell>
                        <TableCell>{mov.produto?.descricao || '-'}</TableCell>
                        <TableCell className="text-right">{mov.quantidade}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {mov.documento_origem || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fornecedores">
            <Card>
              <CardHeader>
                <CardTitle>Total de Compras por Fornecedor</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                      <TableHead className="text-right">Total Comprado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comprasPorFornecedor?.map((fornecedor: any) => (
                      <TableRow key={fornecedor.nome}>
                        <TableCell className="font-medium">{fornecedor.nome}</TableCell>
                        <TableCell className="text-right">
                          {fornecedor.quantidade} compras
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(fornecedor.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="divergencias">
            <Card>
              <CardHeader>
                <CardTitle>Divergências Fiscais (NCM/CFOP)</CardTitle>
              </CardHeader>
              <CardContent>
                {divergenciasFiscais && divergenciasFiscais.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>NF-e</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>NCM</TableHead>
                        <TableHead>CFOP</TableHead>
                        <TableHead>Problema</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {divergenciasFiscais.map((item: any) => (
                        <TableRow key={item.id} className="bg-red-50 dark:bg-red-900/20">
                          <TableCell className="font-mono">
                            {item.compra?.numero_nfe || '-'}
                          </TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>
                            {item.ncm || (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Ausente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.cfop || (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Ausente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-red-600 dark:text-red-400">
                              {!item.ncm && 'NCM não informado'}
                              {!item.cfop && ' CFOP não informado'}
                              {item.ncm && item.ncm.length !== 8 && 'NCM inválido'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <p className="font-medium text-green-600 dark:text-green-400">
                      Nenhuma divergência fiscal encontrada
                    </p>
                    <p className="text-sm mt-1">Todos os itens estão com NCM e CFOP válidos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
