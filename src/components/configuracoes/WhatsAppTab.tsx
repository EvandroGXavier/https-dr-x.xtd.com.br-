import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useWhatsappV2 } from '@/hooks/useWhatsappV2';
import { useToast } from '@/hooks/use-toast';
import { useUserTenant } from '@/hooks/useUserTenant';
import { MessageCircle, Zap, Bot, Copy, ExternalLink, Activity } from 'lucide-react';
import { WhatsAppMonitor } from '@/components/whatsapp/WhatsAppMonitor';
import { WhatsAppDiagnostic } from '@/components/whatsapp/WhatsAppDiagnostic';
import { supabase } from '@/integrations/supabase/client';

export default function WhatsAppTab() {
  const { config, quickReplies, loading, saveConfig, loadQuickReplies, saveQuickReply } = useWhatsappV2();
  const { toast } = useToast();
  const { tenantId, isLoading: tenantLoading, error: tenantError } = useUserTenant();

  const [formData, setFormData] = useState({
    instance_name: '',
    api_endpoint: '',
    api_key: '',
    ia_enabled: false,
    ia_api_key: ''
  });

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    if (config) {
      setFormData({
        instance_name: config.instance_name || '',
        api_endpoint: config.api_endpoint || '',
        api_key: config.api_key || '',
        ia_enabled: config.ia_enabled || false,
        ia_api_key: config.ia_api_key || ''
      });
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await saveConfig({
        ...formData,
        is_active: true
      });
      await refreshConnectionStatus();
      toast({
        title: 'Sucesso',
        description: 'Configuração salva com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configuração',
        variant: 'destructive',
      });
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getWebhookUrl = () => {
    // Extrai o project ID dinamicamente do cliente Supabase
    const projectId = 'dr-x.xtd.com.br'; // Temporário até implementar extração dinâmica
    return `https://${projectId}.supabase.co/functions/v1/wa-evolution-webhook`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'URL copiada para a área de transferência',
    });
  };

  const openApiUrl = () => {
    if (formData.api_endpoint) {
      window.open(formData.api_endpoint, '_blank');
    }
  };

  const handleHealthcheck = async () => {
    try {
      toast({
        title: 'Verificando...',
        description: 'Checando status de todas as instâncias WhatsApp',
      });

      const { data, error } = await supabase.functions.invoke('wa-healthcheck');

      if (error) {
        console.error('Healthcheck error:', error);
        toast({
          title: 'Erro no Healthcheck',
          description: error.message || 'Falha ao verificar status',
          variant: 'destructive',
        });
        return;
      }

      const { status, online_count, total_instances, checks } = data;

      if (status === 'healthy') {
        toast({
          title: '✅ Sistema Saudável',
          description: `Todas as ${total_instances} instância(s) estão online`,
        });
      } else if (status === 'degraded') {
        toast({
          title: '⚠️ Sistema Degradado',
          description: `${online_count} de ${total_instances} instâncias online`,
          variant: 'destructive',
        });
      } else if (status === 'no_configs') {
        toast({
          title: 'ℹ️ Sem Configurações',
          description: 'Nenhuma configuração WhatsApp ativa encontrada',
        });
      }

      console.log('Healthcheck details:', checks);
    } catch (e) {
      console.error('Healthcheck exception:', e);
      toast({
        title: 'Erro',
        description: 'Falha ao executar healthcheck',
        variant: 'destructive',
      });
    }
  };

  const refreshConnectionStatus = async () => {
    // Requer URL, API key e nome da instância preenchidos
    if (!formData.instance_name || !formData.api_endpoint || !formData.api_key) {
      setConnectionStatus('disconnected');
      return;
    }
    setConnectionStatus('connecting');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        console.error('❌ No session token');
        setConnectionStatus('disconnected');
        return;
      }
      
      console.log('🔍 Testing connection for instance:', formData.instance_name);
      
      // Use a função 'test-whatsapp-connection' com os dados do formulário
      const { data, error } = await supabase.functions.invoke('test-whatsapp-connection', {
        body: {
          api_endpoint: formData.api_endpoint,
          api_key: formData.api_key,
          instance_name: formData.instance_name,
        }
      });

      console.log('📡 Connection test response status:', error ? 'ERROR' : 'OK');

      if (error || !data?.success) {
        const errorDetails = data?.details || error?.message || 'Erro desconhecido';
        console.error('❌ Connection test failed:', errorDetails);
        toast({
          title: 'Erro de Conexão',
          description: `Falha ao testar conexão: ${errorDetails}`,
          variant: 'destructive'
        });
        setConnectionStatus('disconnected');
        return;
      }

      const state = data.instance_state;
      console.log('📋 Connection state response:', data);
      if (state === 'open') {
        setConnectionStatus('connected');
        toast({
          title: 'Conectado!',
          description: 'WhatsApp conectado com sucesso'
        });
      } else if (state === 'connecting') {
        setConnectionStatus('connecting');
        toast({
          title: 'Conectando...',
          description: 'WhatsApp está conectando'
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: 'Desconectado',
          description: `Estado da instância: ${state || 'indefinido'}`,
          variant: 'destructive'
        });
      }
    } catch (e) {
      console.error('❌ Connection test error:', e);
      toast({
        title: 'Erro',
        description: `Falha ao testar conexão: ${e instanceof Error ? e.message : 'Erro desconhecido'}`,
        variant: 'destructive'
      });
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    // Atualiza status ao alterar campos relevantes
    refreshConnectionStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.instance_name, formData.api_endpoint, formData.api_key]);

  // Se está carregando os dados do tenant, mostrar loading
  if (tenantLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Configurações WhatsApp
            </CardTitle>
            <CardDescription>
              Carregando dados da empresa...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Se há erro ou não há tenant, mostrar mensagem
  if (tenantError || !tenantId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Configurações WhatsApp
            </CardTitle>
            <CardDescription>
              {tenantError || 'Usuário não possui empresa atribuída'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Diagnóstico WhatsApp */}
      <WhatsAppDiagnostic />

      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Status da Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Configure sua integração com WhatsApp Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <p className="font-medium">
                  {connectionStatus === 'connected' ? 'Conectado' :
                   connectionStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                </p>
                {config?.instance_name && (
                  <p className="text-sm text-muted-foreground">
                    Instância: {config.instance_name}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus === 'connected' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Configurações da Evolution API
          </CardTitle>
          <CardDescription>
            Configure os parâmetros de conexão com a Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância</Label>
              <Input
                id="instance_name"
                value={formData.instance_name}
                onChange={(e) => handleFieldChange('instance_name', e.target.value)}
                placeholder="minha-instancia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_endpoint">URL da API</Label>
              <div className="flex gap-2">
                <Input
                  id="api_endpoint"
                  value={formData.api_endpoint}
                  onChange={(e) => handleFieldChange('api_endpoint', e.target.value)}
                  placeholder="https://api.evolutionapi.com"
                />
                {formData.api_endpoint && config?.is_active && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={openApiUrl}
                    title="Abrir URL da API"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api_key">Chave da API</Label>
            <Input
              id="api_key"
              type="password"
              value={formData.api_key}
              onChange={(e) => handleFieldChange('api_key', e.target.value)}
              placeholder="Sua chave da Evolution API"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                id="webhook_url"
                value={getWebhookUrl()}
                readOnly
                className="bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(getWebhookUrl())}
                title="Copiar URL do Webhook"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure esta URL no webhook da Evolution API para receber mensagens
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button 
              variant="outline" 
              onClick={refreshConnectionStatus}
              disabled={!formData.instance_name || !formData.api_endpoint || !formData.api_key}
              title="Testar conexão com Evolution API"
            >
              <Activity className="w-4 h-4 mr-2" />
              Testar Conexão
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleHealthcheck}
              title="Verificar status de todas as instâncias"
            >
              <Activity className="w-4 h-4 mr-2" />
              Healthcheck
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* IA Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Assistente de IA
          </CardTitle>
          <CardDescription>
            Configure o assistente de IA para respostas automáticas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ia_enabled">Habilitar IA</Label>
              <p className="text-sm text-muted-foreground">
                Ative o assistente de IA para respostas automáticas
              </p>
            </div>
            <Switch
              id="ia_enabled"
              checked={formData.ia_enabled}
              onCheckedChange={(checked) => handleFieldChange('ia_enabled', checked)}
            />
          </div>
          
          {formData.ia_enabled && (
            <div className="space-y-2">
              <Label htmlFor="ia_api_key">Chave da API de IA</Label>
              <Input
                id="ia_api_key"
                type="password"
                value={formData.ia_api_key}
                onChange={(e) => handleFieldChange('ia_api_key', e.target.value)}
                placeholder="Chave da API OpenAI ou similar"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitor em Tempo Real */}
      {connectionStatus === 'connected' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Monitor de Mensagens
            </CardTitle>
            <CardDescription>
              Acompanhe em tempo real as mensagens enviadas e recebidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WhatsAppMonitor />
          </CardContent>
        </Card>
      )}

      {/* Respostas Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Respostas Rápidas</CardTitle>
          <CardDescription>
            Configure respostas rápidas para uso frequente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {quickReplies?.map((reply) => (
              <div key={reply.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{reply.shortcut}</p>
                  <p className="text-sm text-muted-foreground">
                    {reply.message.length > 50 ? `${reply.message.slice(0, 50)}...` : reply.message}
                  </p>
                </div>
              </div>
            ))}
            {quickReplies?.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma resposta rápida configurada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}