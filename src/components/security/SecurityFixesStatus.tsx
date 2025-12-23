import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Shield, ExternalLink, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityStatus {
  rls_coverage: number;
  tables_with_rls: number;
  total_tables: number;
  functions_without_search_path: number;
  security_score: string;
  timestamp: number;
}

interface SecurityFix {
  id: string;
  title: string;
  status: 'completed' | 'pending' | 'manual_required';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action?: string;
  link?: string;
}

export function SecurityFixesStatus() {
  const { user, isAdmin } = useAuth();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const securityFixes: SecurityFix[] = [
    {
      id: 'rls_recursion',
      title: 'RLS Infinite Recursion Fix',
      status: 'completed',
      description: 'Created secure has_role_secure() function to prevent infinite recursion in RLS policies',
      priority: 'critical'
    },
    {
      id: 'function_search_path',
      title: 'Database Function Security',
      status: 'completed',
      description: 'Added SET search_path = public to all SECURITY DEFINER functions',
      priority: 'high'
    },
    {
      id: 'rls_policies_update',
      title: 'RLS Policy Updates',
      status: 'completed',
      description: 'Updated all RLS policies to use the new secure function',
      priority: 'critical'
    },
    {
      id: 'otp_configuration',
      title: 'OTP Expiry Configuration',
      status: 'manual_required',
      description: 'Configure OTP expiry times in Supabase Dashboard (Email: 1 hour, SMS: 10 minutes)',
      priority: 'high',
      action: 'Configure in Supabase Dashboard',
      link: 'https://studio.dr-x.xtd.com.br/project/default/auth/providers'
    },
    {
      id: 'password_protection',
      title: 'Leaked Password Protection',
      status: 'manual_required',
      description: 'Enable password protection against leaked passwords in Authentication settings',
      priority: 'high',
      action: 'Enable in Supabase Dashboard',
      link: 'https://studio.dr-x.xtd.com.br/project/default/auth/providers'
    },
    {
      id: 'security_constraints',
      title: 'Security Constraints',
      status: 'completed',
      description: 'Added database constraints to ensure data integrity and security',
      priority: 'medium'
    },
    {
      id: 'security_monitoring',
      title: 'Enhanced Security Monitoring',
      status: 'completed',
      description: 'Implemented RLS failure logging and security health checks',
      priority: 'medium'
    }
  ];

  const runSecurityHealthCheck = async () => {
    if (!user || !isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('security_health_check');
      
      if (error) {
        console.error('Security health check error:', error);
        toast({
          title: "Erro",
          description: "Erro ao executar verificação de segurança",
          variant: "destructive"
        });
        return;
      }

      // Type assertion for the RPC result
      const securityData = data as unknown as SecurityStatus;
      setSecurityStatus(securityData);
      toast({
        title: "Verificação Concluída",
        description: `Score de segurança: ${securityData.security_score}`,
      });
    } catch (error) {
      console.error('Health check error:', error);
      toast({
        title: "Erro",
        description: "Erro ao executar verificação de segurança",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      runSecurityHealthCheck();
    }
  }, [user, isAdmin]);

  if (!user || !isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Acesso restrito a administradores.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: SecurityFix['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>;
      case 'manual_required':
        return <Badge variant="destructive" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Ação Manual</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const getPriorityColor = (priority: SecurityFix['priority']) => {
    switch (priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-green-500';
    }
  };

  const completedFixes = securityFixes.filter(fix => fix.status === 'completed').length;
  const totalFixes = securityFixes.length;
  const manualRequired = securityFixes.filter(fix => fix.status === 'manual_required').length;

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Status de Segurança do Sistema
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso das correções de segurança implementadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedFixes}</div>
              <div className="text-sm text-muted-foreground">Correções Implementadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{manualRequired}</div>
              <div className="text-sm text-muted-foreground">Ações Manuais Necessárias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round((completedFixes / totalFixes) * 100)}%</div>
              <div className="text-sm text-muted-foreground">Progresso Total</div>
            </div>
          </div>

          {securityStatus && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Verificação de Segurança</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runSecurityHealthCheck}
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Verificar
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Score</div>
                  <div className={`font-bold ${
                    securityStatus.security_score === 'EXCELLENT' ? 'text-green-600' :
                    securityStatus.security_score === 'GOOD' ? 'text-blue-600' :
                    securityStatus.security_score === 'FAIR' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {securityStatus.security_score}
                  </div>
                </div>
                <div>
                  <div className="font-medium">Cobertura RLS</div>
                  <div className="font-bold">{securityStatus.rls_coverage}%</div>
                </div>
                <div>
                  <div className="font-medium">Tabelas com RLS</div>
                  <div className="font-bold">{securityStatus.tables_with_rls}/{securityStatus.total_tables}</div>
                </div>
                <div>
                  <div className="font-medium">Funções Inseguras</div>
                  <div className={`font-bold ${securityStatus.functions_without_search_path === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {securityStatus.functions_without_search_path}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Fixes List */}
      <Card>
        <CardHeader>
          <CardTitle>Correções de Segurança Implementadas</CardTitle>
          <CardDescription>
            Detalhes de todas as correções de segurança aplicadas ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityFixes.map((fix) => (
              <div 
                key={fix.id} 
                className={`border-l-4 ${getPriorityColor(fix.priority)} pl-4 py-3 bg-muted/30 rounded-r-lg`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{fix.title}</h4>
                      {getStatusBadge(fix.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{fix.description}</p>
                    {fix.action && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-orange-600">Ação necessária:</span>
                        <span className="text-xs">{fix.action}</span>
                        {fix.link && (
                          <a 
                            href={fix.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            Abrir Dashboard <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Manual Actions Required */}
      {manualRequired > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Ações manuais necessárias:</strong> {manualRequired} configurações precisam ser ajustadas no Dashboard do Supabase para completar a segurança do sistema.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}