import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Gavel, Users, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const StatsCards = () => {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [processos, contatos, transacoes, agendas] = await Promise.all([
        // Processos ativos
        supabase
          .from("processos")
          .select("*")
          .eq("status", "ativo")
          .eq("user_id", user?.id),
        
        // Contatos ativos - usa view de compatibilidade
        supabase
          .from("vw_contatos_compat")
          .select("*")
          .eq("user_id", user?.id),
        
        // Transações do mês atual
        supabase
          .from("transacoes_financeiras")
          .select("*")
          .eq("user_id", user?.id)
          .eq("tipo", "receber")
          .eq("situacao", "recebida")
          .gte("data_emissao", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
          .lte("data_emissao", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()),
        
        // Agendas de hoje
        supabase
          .from("agendas")
          .select("*")
          .eq("user_id", user?.id)
          .gte("data_inicio", new Date().toISOString().split('T')[0])
          .lt("data_inicio", new Date(Date.now() + 86400000).toISOString().split('T')[0])
      ]);

      const totalReceitas = transacoes.data?.reduce((acc, t) => acc + Number(t.valor_recebido || 0), 0) || 0;
      
      return {
        processosAtivos: processos.data?.length || 0,
        clientesAtivos: contatos.data?.length || 0,
        receitaMensal: totalReceitas,
        prazosHoje: agendas.data?.length || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-soft">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Processos Ativos",
      value: stats?.processosAtivos?.toString() || "0",
      change: "+12%",
      trend: "up",
      icon: Gavel,
      color: "primary"
    },
    {
      title: "Clientes Ativos",
      value: stats?.clientesAtivos?.toString() || "0",
      change: "+5%",
      trend: "up",
      icon: Users,
      color: "success"
    },
    {
      title: "Receita Mensal",
      value: new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(stats?.receitaMensal || 0),
      change: "+18%",
      trend: "up",
      icon: DollarSign,
      color: "accent"
    },
    {
      title: "Prazos Hoje",
      value: stats?.prazosHoje?.toString() || "0",
      change: "-3",
      trend: "down",
      icon: Calendar,
      color: "warning"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat) => {
        const IconComponent = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
        
        return (
          <Card key={stat.title} className="shadow-soft hover:shadow-elegant transition-smooth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg bg-${stat.color}/10`}>
                <IconComponent className={`h-4 w-4 text-${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stat.value}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <TrendIcon className={`h-3 w-3 mr-1 ${
                  stat.trend === "up" ? "text-success" : "text-destructive"
                }`} />
                <span className={
                  stat.trend === "up" ? "text-success" : "text-destructive"
                }>
                  {stat.change}
                </span>
                <span className="ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};