import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContatoCompleto } from '@/types/contatos';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import FinanceiroLink from '@/components/contatos/FinanceiroLink';
import { FEATURES } from '@/config/features';

interface TransacaoFinanceira {
  id: string;
  tipo: string;
  historico: string;
  numero_documento: string;
  data_vencimento: string;
  valor_documento: number;
  valor_recebido?: number;
  situacao: string;
  categoria: string;
}

interface TotaisFinanceiros {
  total_aberto: number;
  total_vencido: number;
  total_pago: number;
  count_aberto: number;
  count_vencido: number;
  count_pago: number;
}

interface FinanceiroTabProps {
  contato: ContatoCompleto;
  onUpdate: (contato: ContatoCompleto) => void;
  isEditing?: boolean;
}

export function FinanceiroTab({ contato }: FinanceiroTabProps) {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [totais, setTotais] = useState<TotaisFinanceiros>({
    total_aberto: 0,
    total_vencido: 0,
    total_pago: 0,
    count_aberto: 0,
    count_vencido: 0,
    count_pago: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransacoes();
  }, [contato.id]);

  const loadTransacoes = async () => {
    setLoading(true);
    try {
      // Buscar transações vinculadas ao contato
      const { data: transacoesData, error } = await supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('contato_id', contato.id)
        .order('data_vencimento', { ascending: false })
        .limit(20);

      if (error) throw error;

      setTransacoes(transacoesData || []);
      calcularTotais(transacoesData || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularTotais = (transacoes: TransacaoFinanceira[]) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const totais = transacoes.reduce(
      (acc, t) => {
        const vencimento = new Date(t.data_vencimento);
        const valor = t.valor_recebido || t.valor_documento;
        
        if (t.situacao === 'aberta') {
          acc.total_aberto += valor;
          acc.count_aberto++;
          
          if (vencimento < hoje) {
            acc.total_vencido += valor;
            acc.count_vencido++;
          }
        } else if (['paga', 'recebida'].includes(t.situacao)) {
          acc.total_pago += valor;
          acc.count_pago++;
        }
        
        return acc;
      },
      {
        total_aberto: 0,
        total_vencido: 0,
        total_pago: 0,
        count_aberto: 0,
        count_vencido: 0,
        count_pago: 0,
      }
    );

    setTotais(totais);
  };

  const getSituacaoBadge = (transacao: TransacaoFinanceira) => {
    const hoje = new Date();
    const vencimento = new Date(transacao.data_vencimento);
    
    if (transacao.situacao === 'aberta') {
      if (vencimento < hoje) {
        return <Badge variant="destructive">Vencido</Badge>;
      }
      return <Badge variant="secondary">Aberto</Badge>;
    }
    
    if (['paga', 'recebida'].includes(transacao.situacao)) {
      return <Badge variant="default">Pago</Badge>;
    }
    
    return <Badge variant="outline">{transacao.situacao}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'receber' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
        Receber
      </Badge>
    ) : (
      <Badge variant="default" className="bg-red-100 text-red-800 hover:bg-red-200">
        Pagar
      </Badge>
    );
  };

  const abrirNoModuloFinanceiro = (transacao: TransacaoFinanceira) => {
    // Navegar para o módulo financeiro com filtro pela transação
    const url = `/financeiro?transacao=${transacao.id}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Em Aberto</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(totais.total_aberto)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totais.count_aberto} título(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vencido</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totais.total_vencido)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totais.count_vencido} título(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pago</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totais.total_pago)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {totais.count_pago} título(s)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Financeiras (Últimas 20)</CardTitle>
        </CardHeader>
        <CardContent>
          {transacoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma movimentação financeira encontrada para este contato.
            </p>
          ) : (
            <div className="space-y-3">
              {transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {getTipoBadge(transacao.tipo)}
                      {getSituacaoBadge(transacao)}
                      <Badge variant="outline">{transacao.categoria}</Badge>
                    </div>
                    
                    <p className="font-medium truncate">{transacao.historico}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>Doc: {transacao.numero_documento}</span>
                      <span>Venc: {new Date(transacao.data_vencimento).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold">
                        {formatCurrency(transacao.valor_recebido || transacao.valor_documento)}
                      </p>
                      {transacao.valor_recebido && transacao.valor_recebido !== transacao.valor_documento && (
                        <p className="text-xs text-muted-foreground">
                          Original: {formatCurrency(transacao.valor_documento)}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirNoModuloFinanceiro(transacao)}
                      title="Abrir no módulo Financeiro"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Links para o módulo Financeiro */}
      {FEATURES.LINK_FINANCEIRO_EM_CONTATOS && (
        <Card>
          <CardContent className="p-4">
            <FinanceiroLink
              contatoId={contato?.id}
              disabled={!contato?.id}
              className="justify-center"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}