import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  Database, 
  Key, 
  Users,
  Activity,
  Lock,
  Eye,
  Download
} from 'lucide-react';

interface SecurityMetadata {
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  alert_level?: 'low' | 'medium' | 'high' | 'critical';
  success?: boolean;
  auto_action?: string;
  [key: string]: any;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  event_description: string;
  metadata: SecurityMetadata | null;
  created_at: string;
  user_id?: string;
}

interface ExportLimitResponse {
  allowed: boolean;
  remaining_exports: number;
  daily_limit: number;
  message: string;
}

interface SecurityMetrics {
  total_events: number;
  high_risk_events: number;
  data_exports_today: number;
  failed_auth_attempts: number;
  suspicious_activities: number;
}

export function SecurityMonitoringDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_events: 0,
    high_risk_events: 0,
    data_exports_today: 0,
    failed_auth_attempts: 0,
    suspicious_activities: 0
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (user) {
      loadSecurityData();
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    // ✅ Verificação segura via RPC
    const { data, error } = await supabase.rpc('has_role', {
      _role: 'admin'
    });
    
    if (error) {
      console.error('Erro ao verificar role:', error);
      setUserRole('user');
    } else {
      setUserRole(data ? 'admin' : 'user');
    }
  };

  const loadSecurityData = async () => {
    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    try {
      // Load recent security events
      const { data: eventsData, error: eventsError } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (eventsError) throw eventsError;
      
      // Transform the data to match our interface
      const transformedEvents: SecurityEvent[] = (eventsData || []).map(event => ({
        id: event.id,
        event_type: event.event_type,
        event_description: event.event_description || '',
        metadata: event.metadata as SecurityMetadata | null,
        created_at: event.created_at || '',
        user_id: event.user_id || undefined
      }));
      
      setEvents(transformedEvents);

      // Calculate metrics
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const todayEvents = eventsData?.filter(event => 
        event.created_at?.startsWith(today)
      ) || [];

      const highRiskEvents = transformedEvents.filter(event => 
        event.metadata?.risk_level === 'high' || 
        event.metadata?.risk_level === 'critical'
      );

      const dataExports = transformedEvents.filter(event => 
        event.event_type === 'data_export' &&
        event.created_at.startsWith(today)
      );

      const failedAuth = transformedEvents.filter(event => 
        event.event_type?.includes('auth') && 
        event.metadata?.success === false
      );

      const suspiciousActivities = transformedEvents.filter(event => 
        event.event_type?.includes('suspicious') ||
        event.metadata?.alert_level === 'high' ||
        event.metadata?.alert_level === 'critical'
      );

      setMetrics({
        total_events: eventsData?.length || 0,
        high_risk_events: highRiskEvents.length,
        data_exports_today: dataExports.length,
        failed_auth_attempts: failedAuth.length,
        suspicious_activities: suspiciousActivities.length
      });

    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de segurança",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testDataExportLimit = async () => {
    try {
      const { data, error } = await supabase.rpc('monitor_data_export', {
        export_type: 'test',
        record_count: 10,
        table_names: ['contatos']
      });

      if (error) throw error;

      // Type cast the response to our interface
      const response = data as unknown as ExportLimitResponse;

      toast({
        title: "Teste de Export",
        description: `Status: ${response.allowed ? 'Permitido' : 'Bloqueado'}. Limite restante: ${response.remaining_exports}`,
        variant: response.allowed ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Error testing export limit:', error);
      toast({
        title: "Erro",
        description: "Falha ao testar limite de exportação",
        variant: "destructive"
      });
    }
  };

  const triggerDataCleanup = async () => {
    try {
      const { error } = await supabase.rpc('apply_data_retention_policies');
      if (error) throw error;

      toast({
        title: "Limpeza Executada",
        description: "Políticas de retenção de dados aplicadas com sucesso"
      });
      
      loadSecurityData();
    } catch (error) {
      console.error('Error triggering cleanup:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar limpeza de dados",
        variant: "destructive"
      });
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Acesso restrito a administradores</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 animate-spin" />
            <span>Carregando dados de segurança...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Monitoramento de Segurança</h2>
          <p className="text-muted-foreground">
            Painel de controle para monitoramento e auditoria de segurança
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={testDataExportLimit}>
            <Download className="h-4 w-4 mr-2" />
            Testar Limite Export
          </Button>
          <Button variant="outline" onClick={triggerDataCleanup}>
            <Database className="h-4 w-4 mr-2" />
            Executar Limpeza
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Eventos</p>
                <p className="text-2xl font-bold">{metrics.total_events}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alto Risco</p>
                <p className="text-2xl font-bold">{metrics.high_risk_events}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Exports Hoje</p>
                <p className="text-2xl font-bold">{metrics.data_exports_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Falhas Auth</p>
                <p className="text-2xl font-bold">{metrics.failed_auth_attempts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Atividades Suspeitas</p>
                <p className="text-2xl font-bold">{metrics.suspicious_activities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      {metrics.high_risk_events > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Alerta de Segurança</AlertTitle>
          <AlertDescription>
            {metrics.high_risk_events} evento(s) de alto risco detectado(s). 
            Recomenda-se revisão imediata dos logs de auditoria.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">Eventos Recentes</TabsTrigger>
          <TabsTrigger value="alerts">Alertas Críticos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Recentes</CardTitle>
              <CardDescription>
                Últimos 50 eventos registrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getRiskBadgeVariant(event.metadata?.risk_level || 'low')}>
                            {event.metadata?.risk_level || 'low'}
                          </Badge>
                          <span className="font-medium">{event.event_type}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatEventTime(event.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.event_description}
                        </p>
                        {event.metadata && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-blue-600">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum evento de segurança registrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Críticos</CardTitle>
              <CardDescription>
                Eventos que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {events
                  .filter(event => 
                    event.metadata?.risk_level === 'critical' || 
                    event.metadata?.alert_level === 'critical'
                  )
                  .map((event) => (
                    <Alert key={event.id} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>
                        {event.event_type} - {formatEventTime(event.created_at)}
                      </AlertTitle>
                      <AlertDescription>
                        {event.event_description}
                        {event.metadata?.auto_action && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                            <strong>Ação Automática:</strong> {event.metadata.auto_action}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                {events.filter(event => 
                  event.metadata?.risk_level === 'critical' || 
                  event.metadata?.alert_level === 'critical'
                ).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum alerta crítico no momento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}