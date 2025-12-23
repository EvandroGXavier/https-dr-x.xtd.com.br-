import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export function WhatsAppDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostic = async () => {
    setLoading(true);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // 1. Verificar autenticação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        diagnosticResults.push({
          test: 'Autenticação',
          status: 'error',
          message: 'Usuário não autenticado',
        });
        setResults(diagnosticResults);
        setLoading(false);
        return;
      }

      diagnosticResults.push({
        test: 'Autenticação',
        status: 'success',
        message: 'Usuário autenticado',
        details: user.email
      });

      // 2. Verificar configuração do WhatsApp
      const { data: config, error: configError } = await supabase
        .from('wa_configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (configError) {
        diagnosticResults.push({
          test: 'Configuração WhatsApp',
          status: 'error',
          message: 'Erro ao buscar configuração',
          details: configError.message
        });
      } else if (!config) {
        diagnosticResults.push({
          test: 'Configuração WhatsApp',
          status: 'warning',
          message: 'Configuração não encontrada',
          details: 'Configure suas credenciais da Evolution API'
        });
      } else {
        // Verificar se todos os campos obrigatórios estão preenchidos
        const missingFields = [];
        if (!config.instance_name) missingFields.push('Nome da Instância');
        if (!config.api_endpoint) missingFields.push('API Endpoint');
        if (!config.api_key) missingFields.push('API Key');

        if (missingFields.length > 0) {
          diagnosticResults.push({
            test: 'Configuração WhatsApp',
            status: 'warning',
            message: 'Configuração incompleta',
            details: `Campos faltando: ${missingFields.join(', ')}`
          });
        } else {
          diagnosticResults.push({
            test: 'Configuração WhatsApp',
            status: 'success',
            message: 'Configuração encontrada',
            details: `Instância: ${config.instance_name}`
          });

          // 3. Testar conexão com Evolution API
          try {
            const { data: testResult, error: testError } = await supabase.functions.invoke('test-whatsapp-connection', {
              body: {
                api_endpoint: config.api_endpoint,
                api_key: config.api_key,
                instance_name: config.instance_name
              }
            });

            if (testError) {
              diagnosticResults.push({
                test: 'Conexão Evolution API',
                status: 'error',
                message: 'Erro ao testar conexão',
                details: testError.message
              });
            } else if (testResult?.success) {
              diagnosticResults.push({
                test: 'Conexão Evolution API',
                status: 'success',
                message: 'Conexão bem-sucedida',
                details: testResult.message
              });
            } else {
              diagnosticResults.push({
                test: 'Conexão Evolution API',
                status: 'warning',
                message: testResult?.error || 'Falha na conexão',
                details: testResult?.details
              });
            }
          } catch (apiError) {
            diagnosticResults.push({
              test: 'Conexão Evolution API',
              status: 'error',
              message: 'Erro interno ao testar conexão',
              details: apiError instanceof Error ? apiError.message : String(apiError)
            });
          }
        }
      }

      // 4. Verificar conta WhatsApp
      const { data: account, error: accountError } = await supabase
        .from('wa_contas')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (accountError) {
        diagnosticResults.push({
          test: 'Conta WhatsApp',
          status: 'error',
          message: 'Erro ao buscar conta',
          details: accountError.message
        });
      } else if (!account) {
        diagnosticResults.push({
          test: 'Conta WhatsApp',
          status: 'warning',
          message: 'Conta não encontrada',
          details: 'Será criada automaticamente na primeira conversa'
        });
      } else {
        diagnosticResults.push({
          test: 'Conta WhatsApp',
          status: 'success',
          message: 'Conta encontrada',
          details: `Status: ${account.status}, Instância: ${account.nome_instancia}`
        });
      }

      // 5. Verificar estrutura das tabelas
      const { data: threadCount } = await supabase
        .from('wa_atendimentos')
        .select('id', { count: 'exact', head: true });

      const { data: messageCount } = await supabase
        .from('wa_messages')
        .select('id', { count: 'exact', head: true });

      diagnosticResults.push({
        test: 'Estrutura do Banco',
        status: 'success',
        message: 'Tabelas acessíveis',
        details: `${threadCount?.length || 0} conversas, ${messageCount?.length || 0} mensagens`
      });

    } catch (error) {
      diagnosticResults.push({
        test: 'Diagnóstico Geral',
        status: 'error',
        message: 'Erro durante diagnóstico',
        details: error instanceof Error ? error.message : String(error)
      });
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: 'success' | 'error' | 'warning') => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Diagnóstico WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Verifica a configuração e conectividade do WhatsApp
          </p>
          <Button
            onClick={runDiagnostic}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? 'Diagnosticando...' : 'Executar Diagnóstico'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Alert key={index} className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.test}</span>
                    <Badge variant={getStatusColor(result.status)} className="h-5">
                      {result.status === 'success' ? 'OK' : 
                       result.status === 'error' ? 'ERRO' : 'ATENÇÃO'}
                    </Badge>
                  </div>
                  <AlertDescription>
                    {result.message}
                    {result.details && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.details}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Clique em "Executar Diagnóstico" para verificar a configuração do WhatsApp.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}