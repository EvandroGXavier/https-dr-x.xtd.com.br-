import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/lib/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function VendaDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: venda, isLoading } = useQuery({
    queryKey: ['venda', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Buscar cliente
      if (data.fornecedor_id) {
        const { data: cliente } = await supabase
          .from('contatos_v2')
          .select('nome_fantasia, cpf_cnpj')
          .eq('id', data.fornecedor_id)
          .single();
        
        return { ...data, cliente };
      }
      
      return data;
    },
  });

  const { data: itens } = useQuery({
    queryKey: ['vendas_itens', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_itens')
        .select('*')
        .eq('venda_id', id);

      if (error) throw error;
      return data;
    },
  });

  const { data: parcelas } = useQuery({
    queryKey: ['vendas_parcelas', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendas_parcelas')
        .select('*')
        .eq('venda_id', id)
        .order('numero_parcela');

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!venda) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Venda não encontrada</p>
          <Button onClick={() => navigate('/vendas')} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/vendas')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Venda #{venda.numero_nfe || id.slice(0, 8)}</h1>
            <p className="text-muted-foreground mt-1">
              {(venda as any).cliente?.nome_fantasia || 'Cliente não informado'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(venda.valor_total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Data Emissão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {venda.data_emissao
                  ? format(new Date(venda.data_emissao), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={venda.status === 'aprovada' ? 'default' : 'secondary'}>
                {venda.status === 'aprovada' ? 'Aprovada' : venda.status === 'cancelada' ? 'Cancelada' : 'Pendente'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="itens" className="w-full">
          <TabsList>
            <TabsTrigger value="itens">Itens ({itens?.length || 0})</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas ({parcelas?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="itens">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>NCM</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono">{item.codigo_produto}</TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{item.ncm || '-'}</TableCell>
                        <TableCell className="text-right">{item.quantidade}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.valor_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parcelas">
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcela</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parcelas?.map((parcela) => (
                      <TableRow key={parcela.id}>
                        <TableCell>Parcela {parcela.numero_parcela}</TableCell>
                        <TableCell>
                          {format(new Date(parcela.data_vencimento), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(parcela.valor)}
                        </TableCell>
                        <TableCell>
                          {parcela.transacao_id ? (
                            <Badge variant="default">Gerada</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
