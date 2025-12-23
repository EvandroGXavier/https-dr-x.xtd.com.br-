import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreHorizontal, Phone, Mail, MapPin, Eye, Edit, Trash2, FileText, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditarTransacaoDialog } from './EditarTransacaoDialog';
import { ItemEtiquetasInline } from '@/components/etiquetas/ItemEtiquetasInline';
import { useToast } from '@/hooks/use-toast';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { TransacaoFinanceira, FinanceiroFilters } from '@/types/financeiro';

interface FinanceiroTableProps {
  filters: FinanceiroFilters;
}

export function FinanceiroTable({ filters }: FinanceiroTableProps) {
  const [selectedTransacao, setSelectedTransacao] = useState<TransacaoFinanceira | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();
  
  const { transacoes, loading, error, updateTransacao, deleteTransacao, refetch } = useFinanceiro(filters);


  const getSituacaoBadge = (situacao: string) => {
    const variants = {
      'aberta': 'default',
      'recebida': 'default',
      'paga': 'default',
      'vencida': 'destructive',
      'cancelada': 'secondary'
    } as const;

    const labels = {
      'aberta': 'Aberta',
      'recebida': 'Recebida',
      'paga': 'Paga',
      'vencida': 'Atrasada',
      'cancelada': 'Cancelada'
    };

    return (
      <Badge variant={variants[situacao as keyof typeof variants]}>
        {labels[situacao as keyof typeof labels]}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleContactClick = (contato: TransacaoFinanceira['contato']) => {
    // Navigate to contact edit page
    window.open(`/contatos?edit=${contato.id}`, '_blank');
  };

  const handlePhoneClick = (telefone: string) => {
    window.open(`tel:${telefone}`);
  };

  const handleEmailClick = (email: string) => {
    window.open(`mailto:${email}`);
  };

  const handleEdit = (transacao: TransacaoFinanceira) => {
    toast({
      title: "Editar",
      description: `Editando transação: ${transacao.numero_documento}`,
    });
  };

  const handleDelete = async (transacao: TransacaoFinanceira) => {
    deleteTransacao(transacao.id);
  };

  const handleViewDetails = (transacao: TransacaoFinanceira) => {
    setSelectedTransacao(transacao);
    setShowDetails(true);
  };

  const handleEditTransaction = (transacao: TransacaoFinanceira) => {
    setSelectedTransacao(transacao);
    setShowEditDialog(true);
  };

  const handleTagsChange = () => {
    refetch();
  };

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Contato</TableHead>
                  <TableHead className="min-w-[200px]">Histórico</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Data Liquidação</TableHead>
                  <TableHead>Valor Documento</TableHead>
                  <TableHead>Valor Recebido</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Nº Documento</TableHead>
                  <TableHead>Nº Banco</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead>Conta Financeira</TableHead>
                  <TableHead>Forma Pagamento</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead className="w-[50px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-4">
                      Carregando transações...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-4">
                      <div className="text-destructive">
                        Erro ao carregar transações: {error.message || 'Verifique as permissões do banco de dados'}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : transacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-4">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  transacoes.map((transacao) => (
                    <TableRow 
                      key={transacao.id} 
                      className="hover:bg-muted/50 cursor-pointer"
                      onDoubleClick={() => handleEditTransaction(transacao)}
                    >
                      <TableCell>
                        <div 
                          className="space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleContactClick(transacao.contato)}
                            className="text-left hover:text-primary transition-colors block w-full"
                          >
                            <div className="font-medium">{transacao.contato.nome}</div>
                            <div className="text-xs text-muted-foreground">{transacao.contato.cpf_cnpj}</div>
                          </button>
                          <div className="flex items-center gap-1 flex-wrap">
                            {transacao.contato.telefone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePhoneClick(transacao.contato.telefone!);
                                }}
                                className="h-6 px-2 text-xs"
                                title={`Ligar para ${transacao.contato.telefone}`}
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                {transacao.contato.telefone}
                              </Button>
                            )}
                            {transacao.contato.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEmailClick(transacao.contato.email!);
                                }}
                                className="h-6 px-2 text-xs"
                                title={`Email para ${transacao.contato.email}`}
                              >
                                <Mail className="h-3 w-3 mr-1" />
                                {transacao.contato.email}
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={transacao.historico}>
                        {transacao.historico}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(transacao.data_emissao)}</TableCell>
                    <TableCell>{formatDate(transacao.data_vencimento)}</TableCell>
                    <TableCell>
                      {transacao.data_liquidacao ? formatDate(transacao.data_liquidacao) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transacao.valor_documento)}
                    </TableCell>
                    <TableCell>
                      {transacao.valor_recebido ? formatCurrency(transacao.valor_recebido) : '-'}
                    </TableCell>
                    <TableCell>{getSituacaoBadge(transacao.situacao)}</TableCell>
                    <TableCell className="font-mono">{transacao.numero_documento}</TableCell>
                    <TableCell className="font-mono">{transacao.numero_banco || '-'}</TableCell>
                    <TableCell>
                      <ItemEtiquetasInline
                        itemId={transacao.id}
                        itemType="transacoes"
                        itemTags={transacao.etiquetas.map(etiqueta => ({
                          nome: etiqueta.nome,
                          cor: etiqueta.cor,
                          icone: etiqueta.icone
                        }))}
                        onTagsChange={handleTagsChange}
                      />
                    </TableCell>
                    <TableCell>{transacao.conta_financeira}</TableCell>
                    <TableCell>{transacao.forma_pagamento}</TableCell>
                    <TableCell>
                      {transacao.origem_tipo === 'contrato' ? (
                        <Badge variant="secondary" className="text-xs">
                          Contrato
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{transacao.contato.cpf_cnpj}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(transacao)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditTransaction(transacao)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            Documentos
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Calendar className="mr-2 h-4 w-4" />
                            Agendar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Receber/Pagar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(transacao)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Transação</DialogTitle>
          </DialogHeader>
          {selectedTransacao && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">CONTATO</h3>
                  <p className="font-medium">{selectedTransacao.contato.nome}</p>
                  <p className="text-sm text-muted-foreground">{selectedTransacao.contato.cpf_cnpj}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">HISTÓRICO</h3>
                  <p>{selectedTransacao.historico}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">SITUAÇÃO</h3>
                  {getSituacaoBadge(selectedTransacao.situacao)}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">VALORES</h3>
                  <p>Documento: {formatCurrency(selectedTransacao.valor_documento)}</p>
                  {selectedTransacao.valor_recebido && (
                    <p>Recebido: {formatCurrency(selectedTransacao.valor_recebido)}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">DATAS</h3>
                  <p>Emissão: {formatDate(selectedTransacao.data_emissao)}</p>
                  <p>Vencimento: {formatDate(selectedTransacao.data_vencimento)}</p>
                  {selectedTransacao.data_liquidacao && (
                    <p>Liquidação: {formatDate(selectedTransacao.data_liquidacao)}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">PAGAMENTO</h3>
                  <p>Forma: {selectedTransacao.forma_pagamento}</p>
                  <p>Conta: {selectedTransacao.conta_financeira}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <EditarTransacaoDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        transacao={selectedTransacao}
        onTransacaoUpdated={() => refetch()}
      />
    </>
  );
}