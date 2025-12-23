import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, AlertTriangle, Users, Activity, Eye, RefreshCw, CheckCircle2, XCircle, ExternalLink, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityMonitoring, DataRetention } from '@/lib/dataSecurity';
import { SecurityFixesStatus } from '@/components/security/SecurityFixesStatus';

interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_description: string;
  metadata: any;
  created_at: string;
}

interface SecurityOverview {
  recentSuspiciousActivity: number;
  failedAuthAttempts: number;
  sensitiveDataAccesses: number;
  securityScore: number;
}

interface RetentionCompliance {
  compliant: boolean;
  issues: string[];
}

interface SecurityConfigIssue {
  id: string;
  name: string;
  description: string;
  level: 'warn' | 'error' | 'info';
  status: 'requires_manual_config' | 'resolved';
  dashboardUrl?: string;
  documentationUrl?: string;
}

export function SecurityDashboard() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [configIssues, setConfigIssues] = useState<SecurityConfigIssue[]>([]);
  const [overview, setOverview] = useState<SecurityOverview>({
    recentSuspiciousActivity: 0,
    failedAuthAttempts: 0,
    sensitiveDataAccesses: 0,
    securityScore: 100
  });
  const [retention, setRetention] = useState<RetentionCompliance>({
    compliant: true,
    issues: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAllSecurityData();
    }
  }, [isAdmin]);

  const fetchAllSecurityData = async () => {
    setLoading(true);
    try {
      const [eventsResult, securityOverview, retentionCompliance] = await Promise.all([
        supabase
          .from('security_audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50),
        SecurityMonitoring.getSecurityOverview(),
        DataRetention.checkRetentionCompliance()
      ]);

      if (eventsResult.error) throw eventsResult.error;
      
      setSecurityEvents(eventsResult.data || []);
      setOverview(securityOverview);
      setRetention(retentionCompliance);

      // Load known configuration issues (these require manual Supabase dashboard config)
      const knownIssues: SecurityConfigIssue[] = [
        {
          id: 'otp_expiry',
          name: 'Configuração de Expiração OTP',
          description: 'Os tempos de expiração OTP excedem os limites recomendados. Configure no Dashboard do Supabase → Authentication → Settings.',
          level: 'warn',
          status: 'requires_manual_config',
          dashboardUrl: 'https://studio.dr-x.xtd.com.br/project/default/auth/providers',
          documentationUrl: 'https://supabase.com/docs/guides/platform/going-into-prod#security'
        },
        {
          id: 'leaked_password_protection',
          name: 'Proteção contra Senhas Vazadas',
          description: 'A proteção contra senhas vazadas está desabilitada. Habilite no Dashboard do Supabase → Authentication → Settings.',
          level: 'warn', 
          status: 'requires_manual_config',
          dashboardUrl: 'https://studio.dr-x.xtd.com.br/project/default/auth/providers',
          documentationUrl: 'https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection'
        }
      ];
      
      setConfigIssues(knownIssues);
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de segurança.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      await DataRetention.scheduleCleanup();
      toast({
        title: "Sucesso",
        description: "Limpeza de dados agendada com sucesso"
      });
      await fetchAllSecurityData(); // Refresh data
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao executar limpeza de dados",
        variant: "destructive"
      });
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'login_failed':
      case 'signup_failed':
      case 'suspicious_activity':
      case 'suspicious_bulk_access':
        return 'destructive';
      case 'role_change':
      case 'admin_created':
        return 'outline';
      case 'login_success':
      case 'signup_success':
        return 'default';
      case 'sensitive_data_access':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'login_failed':
      case 'signup_failed':
      case 'suspicious_activity':
      case 'suspicious_bulk_access':
        return <AlertTriangle className="h-4 w-4" />;
      case 'role_change':
      case 'admin_created':
        return <Users className="h-4 w-4" />;
      case 'sensitive_data_access':
        return <Eye className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getIssueIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const getIssueBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Apenas administradores podem acessar o painel de segurança.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Dashboard de Segurança</h2>
        </div>
        <Button onClick={fetchAllSecurityData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="fixes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fixes">Correções de Segurança</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fixes" className="space-y-6">
          <SecurityFixesStatus />
        </TabsContent>
        
        <TabsContent value="monitoring" className="space-y-6">

      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Pontuação de Segurança
          </CardTitle>
          <CardDescription>
            Avaliação geral da segurança do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`text-4xl font-bold ${getScoreColor(overview.securityScore)}`}>
              {overview.securityScore}/100
            </div>
            <Badge variant={getScoreBadgeVariant(overview.securityScore)}>
              {overview.securityScore >= 80 ? 'Excelente' : 
               overview.securityScore >= 60 ? 'Bom' : 'Atenção Necessária'}
            </Badge>
            {configIssues.length > 0 && (
              <div className="ml-auto">
                <Badge variant="secondary">{configIssues.length} configuração(ões) pendente(s)</Badge>
              </div>
            )}
          </div>
          {overview.securityScore < 80 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                A pontuação de segurança está abaixo do recomendado. Verifique as atividades suspeitas e configurações pendentes.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Atividades Suspeitas (24h)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overview.recentSuspiciousActivity}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview.recentSuspiciousActivity === 0 ? 'Nenhuma atividade suspeita' : 'Requer atenção'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Acessos a Dados Sensíveis (24h)
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.sensitiveDataAccesses}
            </div>
            <p className="text-xs text-muted-foreground">
              Acessos monitorados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tentativas de Login Falhadas
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityEvents.filter(e => e.event_type === 'login_failed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Eventos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {securityEvents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 50 eventos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Issues Section */}
      {configIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações de Segurança Pendentes
              <Badge variant="secondary">{configIssues.length}</Badge>
            </CardTitle>
            <CardDescription>
              Configurações que requerem ação manual no dashboard do Supabase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {configIssues.map((issue) => (
                <Alert key={issue.id}>
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.level)}
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {issue.name}
                        <Badge variant={getIssueBadgeVariant(issue.level)}>
                          {issue.level === 'warn' ? 'Aviso' : 'Erro'}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        {issue.description}
                      </AlertDescription>
                      <div className="flex gap-2 mt-3">
                        {issue.dashboardUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(issue.dashboardUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Abrir Dashboard
                          </Button>
                        )}
                        {issue.documentationUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(issue.documentationUrl, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Documentação
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Retention Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Conformidade de Retenção de Dados
          </CardTitle>
          <CardDescription>
            Status da conformidade com políticas de retenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {retention.compliant ? (
                <Badge variant="default">Conforme</Badge>
              ) : (
                <Badge variant="destructive">Não Conforme</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {retention.compliant ? 
                  'Todos os dados estão em conformidade' : 
                  'Ações necessárias para conformidade'}
              </span>
            </div>
            {!retention.compliant && (
              <Button onClick={handleCleanup} variant="outline">
                Executar Limpeza
              </Button>
            )}
          </div>
          
          {retention.issues.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium">Problemas Identificados:</h4>
              {retention.issues.map((issue, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de Eventos de Segurança</CardTitle>
          <CardDescription>
            Monitoramento em tempo real das atividades de segurança do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-4">
                <div className="text-muted-foreground">Carregando eventos...</div>
              </div>
            ) : securityEvents.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-muted-foreground">Nenhum evento encontrado</div>
              </div>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventIcon(event.event_type)}
                    <div>
                      <div className="font-medium">{event.event_description}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant={getEventTypeColor(event.event_type)}>
                    {event.event_type}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Status de Implementações de Segurança</CardTitle>
          <CardDescription>
            Visão geral das medidas de segurança implementadas e configurações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">✅ Monitoramento de Segurança Implementado</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema de auditoria, logging de eventos e detecção de atividades suspeitas ativo
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">✅ Proteção de Dados Sensíveis</h4>
                <p className="text-sm text-muted-foreground">
                  Mascaramento de CPF/CNPJ, email e telefone, controle de acesso RLS
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">✅ Rate Limiting e Validação</h4>
                <p className="text-sm text-muted-foreground">
                  Rate limiting para forms e auth, validação e sanitização de inputs
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">✅ Row Level Security (RLS)</h4>
                <p className="text-sm text-muted-foreground">
                  Políticas RLS robustas implementadas em todas as tabelas principais
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">✅ Gestão de Senhas Segura</h4>
                <p className="text-sm text-muted-foreground">
                  Validação de força de senha, geração de senhas seguras implementada
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}