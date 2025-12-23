import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FinanceStats {
  contasReceber: {
    abertas: { count: number; value: number };
    recebidas: { count: number; value: number };
    vencidas: { count: number; value: number };
  };
  contasPagar: {
    abertas: { count: number; value: number };
    pagas: { count: number; value: number };
    vencidas: { count: number; value: number };
  };
  saldoRealizar: {
    totalReceber: number;
    totalPagar: number;
    saldo: number;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function FinanceiroStats({ onFilterClick }: { onFilterClick?: (filters: any) => void }) {
  const [stats, setStats] = useState<FinanceStats>({
    contasReceber: {
      abertas: { count: 0, value: 0 },
      recebidas: { count: 0, value: 0 },
      vencidas: { count: 0, value: 0 }
    },
    contasPagar: {
      abertas: { count: 0, value: 0 },
      pagas: { count: 0, value: 0 },
      vencidas: { count: 0, value: 0 }
    },
    saldoRealizar: {
      totalReceber: 0,
      totalPagar: 0,
      saldo: 0
    }
  });

  const fetchStats = async () => {
    try {
      const [transacoesResult, saldoResult] = await Promise.all([
        supabase
          .from('transacoes_financeiras')
          .select('tipo, situacao, valor_documento, data_vencimento'),
        supabase.rpc('get_financeiro_saldo_a_realizar')
      ]);

      if (transacoesResult.error) throw transacoesResult.error;
      if (saldoResult.error) throw saldoResult.error;

      const now = new Date();
      const statsData: FinanceStats = {
        contasReceber: {
          abertas: { count: 0, value: 0 },
          recebidas: { count: 0, value: 0 },
          vencidas: { count: 0, value: 0 }
        },
        contasPagar: {
          abertas: { count: 0, value: 0 },
          pagas: { count: 0, value: 0 },
          vencidas: { count: 0, value: 0 }
        },
        saldoRealizar: {
          totalReceber: Number(saldoResult.data?.[0]?.total_a_receber || 0),
          totalPagar: Number(saldoResult.data?.[0]?.total_a_pagar || 0),
          saldo: Number(saldoResult.data?.[0]?.saldo_a_realizar || 0)
        }
      };

      transacoesResult.data?.forEach(transacao => {
        const valor = Number(transacao.valor_documento);
        const isVencida = transacao.situacao === 'aberta' && new Date(transacao.data_vencimento) < now;
        
        if (transacao.tipo === 'receber') {
          if (transacao.situacao === 'recebida') {
            statsData.contasReceber.recebidas.count++;
            statsData.contasReceber.recebidas.value += valor;
          } else if (isVencida) {
            statsData.contasReceber.vencidas.count++;
            statsData.contasReceber.vencidas.value += valor;
          } else if (transacao.situacao === 'aberta') {
            statsData.contasReceber.abertas.count++;
            statsData.contasReceber.abertas.value += valor;
          }
        } else if (transacao.tipo === 'pagar') {
          if (transacao.situacao === 'paga') {
            statsData.contasPagar.pagas.count++;
            statsData.contasPagar.pagas.value += valor;
          } else if (isVencida) {
            statsData.contasPagar.vencidas.count++;
            statsData.contasPagar.vencidas.value += valor;
          } else if (transacao.situacao === 'aberta') {
            statsData.contasPagar.abertas.count++;
            statsData.contasPagar.abertas.value += valor;
          }
        }
      });

      setStats(statsData);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transacoes_financeiras'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCardClick = (filterType: string) => {
    if (!onFilterClick) return;
    
    switch (filterType) {
      case 'cr-abertas':
        onFilterClick({ tipo: 'a-receber' });
        break;
      case 'cr-recebidas':
        onFilterClick({ tipo: 'recebidas' });
        break;
      case 'cr-vencidas':
        onFilterClick({ tipo: 'a-receber', vencidas: true });
        break;
      case 'cp-abertas':
        onFilterClick({ tipo: 'a-pagar' });
        break;
      case 'cp-pagas':
        onFilterClick({ tipo: 'pagas' });
        break;
      case 'cp-vencidas':
        onFilterClick({ tipo: 'a-pagar', vencidas: true });
        break;
      case 'saldo-realizar':
        onFilterClick({ tipo: 'todas', saldoRealizar: true });
        break;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
      {/* Saldo a Realizar */}
      <Card 
        className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('saldo-realizar')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Saldo a Realizar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.saldoRealizar.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(stats.saldoRealizar.saldo)}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            <div>A Receber: {formatCurrency(stats.saldoRealizar.totalReceber)}</div>
            <div>A Pagar: {formatCurrency(stats.saldoRealizar.totalPagar)}</div>
          </div>
        </CardContent>
      </Card>

      {/* Contas a Receber */}
      <Card 
        className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('cr-abertas')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            CR Abertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(stats.contasReceber.abertas.value)}
          </div>
          <Badge variant="secondary" className="mt-1 text-xs bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
            {stats.contasReceber.abertas.count} contas
          </Badge>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('cr-recebidas')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            CR Recebidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(stats.contasReceber.recebidas.value)}
          </div>
          <Badge variant="secondary" className="mt-1 text-xs bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
            {stats.contasReceber.recebidas.count} contas
          </Badge>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('cr-vencidas')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            CR Vencidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-900 dark:text-red-100">
            {formatCurrency(stats.contasReceber.vencidas.value)}
          </div>
          <Badge variant="secondary" className="mt-1 text-xs bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200">
            {stats.contasReceber.vencidas.count} contas
          </Badge>
        </CardContent>
      </Card>

      {/* Contas a Pagar */}
      <Card 
        className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('cp-abertas')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            CP Abertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {formatCurrency(stats.contasPagar.abertas.value)}
          </div>
          <Badge variant="secondary" className="mt-1 text-xs bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200">
            {stats.contasPagar.abertas.count} contas
          </Badge>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('cp-pagas')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            CP Pagas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {formatCurrency(stats.contasPagar.pagas.value)}
          </div>
          <Badge variant="secondary" className="mt-1 text-xs bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200">
            {stats.contasPagar.pagas.count} contas
          </Badge>
        </CardContent>
      </Card>

      <Card 
        className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => handleCardClick('cp-vencidas')}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-pink-700 dark:text-pink-300 flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            CP Vencidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
            {formatCurrency(stats.contasPagar.vencidas.value)}
          </div>
          <Badge variant="secondary" className="mt-1 text-xs bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200">
            {stats.contasPagar.vencidas.count} contas
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}