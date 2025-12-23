import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle, XCircle, Loader2, Phone } from 'lucide-react';

interface ConfigValidation {
  valid: boolean;
  errors: string[];
  config?: any;
}

export function WhatsAppConfigTest() {
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<ConfigValidation | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const validateConfig = async () => {
    setIsValidating(true);
    try {
      // First check if configuration is complete
      const errors: string[] = [];
      
      if (!apiKey.trim()) errors.push('API Key é obrigatória');
      if (!apiEndpoint.trim()) errors.push('API Endpoint é obrigatório');
      if (!instanceName.trim()) errors.push('Nome da instância é obrigatório');
      
      // Check URL format
      if (apiEndpoint.trim() && !apiEndpoint.match(/^https?:\/\/.*/)) {
        errors.push('API Endpoint deve ser uma URL válida (http:// ou https://)');
      }

      const result: ConfigValidation = {
        valid: errors.length === 0,
        errors,
        config: errors.length === 0 ? { apiEndpoint, apiKey, instanceName } : null
      };

      setValidation(result);

      if (result.valid) {
        toast({
          title: "Configuração válida",
          description: "Todos os campos estão preenchidos corretamente",
        });
      } else {
        toast({
          title: "Configuração inválida",
          description: `${result.errors.length} problema(s) encontrado(s)`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Erro",
        description: "Erro ao validar configuração",
        variant: "destructive",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const testConnection = async () => {
    if (!validation?.valid) {
      toast({
        title: "Erro",
        description: "Valide a configuração primeiro",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus(null);

    try {
      // Call the edge function to test connection
      const { data, error } = await supabase.functions.invoke('test-whatsapp-connection', {
        body: {
          api_endpoint: apiEndpoint,
          api_key: apiKey,
          instance_name: instanceName
        }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        setConnectionStatus('success');
        toast({
          title: "Conexão bem-sucedida",
          description: `Status da instância: ${data.instance_status || 'Conectado'}`,
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Falha na conexão",
          description: data.error || "Não foi possível conectar com a API",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      setConnectionStatus('error');
      toast({
        title: "Erro de conexão",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfig = async () => {
    if (!validation?.valid) {
      toast({
        title: "Erro",
        description: "Valide a configuração primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('wa_contas')
        .upsert({
          user_id: user.id,
          nome_instancia: instanceName,
          status: connectionStatus === 'success' ? 'connected' : 'disconnected'
        });

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "Configuração WhatsApp salva com sucesso",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar configuração",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Teste de Configuração WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">API Endpoint</label>
              <Input
                placeholder="https://sua-api-evolution.com"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">API Key</label>
              <Input
                type="password"
                placeholder="Sua API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Instância</label>
              <Input
                placeholder="minha-instancia"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={validateConfig} 
              disabled={isValidating}
              variant="outline"
            >
              {isValidating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Validar Configuração
            </Button>
            
            <Button 
              onClick={testConnection} 
              disabled={!validation?.valid || isTestingConnection}
            >
              {isTestingConnection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Testar Conexão
            </Button>
            
            <Button 
              onClick={saveConfig} 
              disabled={!validation?.valid || connectionStatus !== 'success'}
              variant="default"
            >
              Salvar Configuração
            </Button>
          </div>

          {validation && (
            <Alert className={validation.valid ? 'border-green-200' : 'border-red-200'}>
              <div className="flex items-center gap-2">
                {validation.valid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  {validation.valid ? (
                    "Configuração válida"
                  ) : (
                    <div>
                      <p className="font-medium mb-1">Problemas encontrados:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {connectionStatus && (
            <Alert className={connectionStatus === 'success' ? 'border-green-200' : 'border-red-200'}>
              <div className="flex items-center gap-2">
                {connectionStatus === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
                <AlertDescription>
                  {connectionStatus === 'success' ? (
                    "Conexão com Evolution API estabelecida com sucesso"
                  ) : (
                    "Falha ao conectar com a Evolution API. Verifique os dados e tente novamente."
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex gap-2">
            <Badge variant={validation?.valid ? "default" : "secondary"}>
              Configuração: {validation?.valid ? "Válida" : "Pendente"}
            </Badge>
            
            <Badge variant={
              connectionStatus === 'success' ? "default" : 
              connectionStatus === 'error' ? "destructive" : "secondary"
            }>
              API: {
                connectionStatus === 'success' ? "Conectada" :
                connectionStatus === 'error' ? "Erro" : "Não testada"
              }
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}