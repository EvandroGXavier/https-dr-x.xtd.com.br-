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
import { CompraEditor } from '@/components/compras/CompraEditor';

export default function CompraDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: compra, isLoading, refetch } = useQuery({
    queryKey: ['compra', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras')
        .select(`
          *,
          fornecedor:contatos_v2(nome_fantasia, cpf_cnpj)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: itens } = useQuery({
    queryKey: ['compras_itens', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_itens')
        .select('*')
        .eq('compra_id', id);

      if (error) throw error;
      return data;
    },
  });

  const { data: parcelas } = useQuery({
    queryKey: ['compras_parcelas', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_parcelas')
        .select('*')
        .eq('compra_id', id)
        .order('numero_parcela');

      if (error) throw error;
      return data;
    },
  });

  const { data: logs } = useQuery({
    queryKey: ['audit_logs', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .contains('metadata', { compra_id: id })
        .order('created_at', { ascending: false });

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

  if (!compra) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Compra não encontrada</p>
          <Button onClick={() => navigate('/compras')} className="mt-4">
            Voltar
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isAprovada = compra.status === 'aprovada';

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/compras')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Compra #{compra.numero_nfe || id.slice(0, 8)}</h1>
            <p className="text-muted-foreground mt-1">
              {compra.fornecedor?.nome_fantasia || 'Fornecedor não informado'}
            </p>
          </div>
        </div>

        <CompraEditor compra={compra} onUpdate={refetch} />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(compra.valor_total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Data Emissão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {compra.data_emissao
                  ? format(new Date(compra.data_emissao), 'dd/MM/yyyy', { locale: ptBR })
                  : '-'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Chave NF-e</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono break-all">
                {compra.chave_nfe || 'Não informada'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="itens" className="w-full">
          <TabsList>
            <TabsTrigger value="itens">Itens ({itens?.length || 0})</TabsTrigger>
            <TabsTrigger value="parcelas">Parcelas ({parcelas?.length || 0})</TabsTrigger>
            <TabsTrigger value="auditoria">Auditoria ({logs?.length || 0})</TabsTrigger>
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

          <TabsContent value="auditoria">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {logs?.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{log.event_description}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.event_type} • {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!logs || logs.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum log de auditoria
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </AppLayout>
  );
}
