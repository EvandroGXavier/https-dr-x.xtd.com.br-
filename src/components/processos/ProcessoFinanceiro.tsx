import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, TrendingDown, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ProcessoFinanceiroProps {
  processoId: string;
}

export function ProcessoFinanceiro({ processoId }: ProcessoFinanceiroProps) {
  const navigate = useNavigate();

  const { data: resumoFinanceiro, isLoading } = useQuery({
    queryKey: ["processo-financeiro", processoId],
    queryFn: async () => {
      // Buscar transações vinculadas aos contratos do processo
      const { data: contratos } = await supabase
        .from("processo_contratos")
        .select("id, titulo, valor_total, status")
        .eq("processo_id", processoId);

      // Buscar transações financeiras relacionadas ao processo através de etiquetas ou outras vinculações
      const { data: transacoes } = await supabase
        .from("transacoes_financeiras")
        .select("*")
        .or(`historico.ilike.%${processoId}%,observacoes.ilike.%${processoId}%`)
        .order("data_emissao", { ascending: false })
        .limit(10);

      let totalReceitas = 0;
      let totalDespesas = 0;
      let pendentes = 0;

      const transacoesProcessadas = transacoes?.map(transacao => {
        if (transacao.tipo === 'receber') {
          if (transacao.situacao === 'recebida') {
            totalReceitas += Number(transacao.valor_recebido || 0);
          } else {
            pendentes += Number(transacao.valor_documento || 0);
          }
        } else {
          if (transacao.situacao === 'paga') {
            totalDespesas += Number(transacao.valor_recebido || 0);
          } else {
            pendentes += Number(transacao.valor_documento || 0);
          }
        }
        return transacao;
      }) || [];

      const valorContratos = contratos?.reduce((acc, contrato) => {
        if (contrato.status === 'assinado' || contrato.status === 'aprovado') {
          return acc + Number(contrato.valor_total || 0);
        }
        return acc;
      }, 0) || 0;

      return {
        contratos: contratos || [],
        transacoes: transacoesProcessadas,
        totalReceitas,
        totalDespesas,
        pendentes,
        valorContratos,
        saldo: totalReceitas - totalDespesas,
      };
    },
    enabled: !!processoId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Receitas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(resumoFinanceiro?.totalReceitas || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Despesas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(resumoFinanceiro?.totalDespesas || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">
              {formatCurrency(resumoFinanceiro?.pendentes || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Saldo</span>
            </div>
            <p className={`text-2xl font-bold ${(resumoFinanceiro?.saldo || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(resumoFinanceiro?.saldo || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contratos do Processo</span>
            <span className="text-lg font-semibold">
              {formatCurrency(resumoFinanceiro?.valorContratos || 0)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!resumoFinanceiro?.contratos?.length ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum contrato vinculado a este processo.
            </p>
          ) : (
            <div className="space-y-2">
              {resumoFinanceiro.contratos.map((contrato) => (
                <div key={contrato.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{contrato.titulo}</p>
                    <Badge variant={contrato.status === 'assinado' ? 'default' : 'secondary'}>
                      {contrato.status}
                    </Badge>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(Number(contrato.valor_total || 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transações Relacionadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transações Relacionadas</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/financeiro')}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!resumoFinanceiro?.transacoes?.length ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma transação relacionada encontrada.
            </p>
          ) : (
            <div className="space-y-2">
              {resumoFinanceiro.transacoes.map((transacao) => (
                <div key={transacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{transacao.historico}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={transacao.tipo === 'receber' ? 'default' : 'secondary'}>
                        {transacao.tipo === 'receber' ? 'Receita' : 'Despesa'}
                      </Badge>
                      <Badge variant={transacao.situacao === 'recebida' || transacao.situacao === 'paga' ? 'default' : 'outline'}>
                        {transacao.situacao}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {format(new Date(transacao.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <p className={`font-semibold ${transacao.tipo === 'receber' ? 'text-green-600' : 'text-red-600'}`}>
                    {transacao.tipo === 'receber' ? '+' : '-'}
                    {formatCurrency(Number(transacao.valor_documento || 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}