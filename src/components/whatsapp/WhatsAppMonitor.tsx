import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowUpRight, ArrowDownLeft, Trash2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MonitorMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: string;
  content: any;
  created_at: string;
  wa_contact: {
    profile_name: string;
    wa_phone_formatted: string;
  } | null;
}

export function WhatsAppMonitor() {
  const [messages, setMessages] = useState<MonitorMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wa_messages')
        .select(`
          *,
          wa_atendimentos!inner(
            wa_contacts(profile_name, wa_phone_formatted)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const formattedMessages = data?.map(msg => ({
        id: msg.id,
        direction: msg.direction as 'INBOUND' | 'OUTBOUND',
        message_type: msg.message_type,
        content: msg.content,
        created_at: msg.created_at,
        wa_contact: msg.wa_atendimentos?.wa_contacts ? {
          profile_name: msg.wa_atendimentos.wa_contacts.profile_name,
          wa_phone_formatted: msg.wa_atendimentos.wa_contacts.wa_phone_formatted
        } : null
      })) || [];
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  useEffect(() => {
    loadMessages();

    // Setup realtime subscription
    const channel = supabase
      .channel('wa-messages-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wa_messages'
        },
        async (payload) => {
          // Fetch the complete message with contact info
          const { data: messageData } = await supabase
            .from('wa_messages')
            .select(`
              *,
              wa_atendimentos!inner(
                wa_contacts(profile_name, wa_phone_formatted)
              )
            `)
            .eq('id', payload.new.id)
            .single();
          
          if (messageData) {
            const formattedMessage: MonitorMessage = {
              id: messageData.id,
              direction: messageData.direction as 'INBOUND' | 'OUTBOUND',
              message_type: messageData.message_type,
              content: messageData.content,
              created_at: messageData.created_at,
              wa_contact: messageData.wa_atendimentos?.wa_contacts ? {
                profile_name: messageData.wa_atendimentos.wa_contacts.profile_name,
                wa_phone_formatted: messageData.wa_atendimentos.wa_contacts.wa_phone_formatted
              } : null
            };
            setMessages(prev => [formattedMessage, ...prev.slice(0, 49)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadMessages, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getMessageContent = (message: MonitorMessage) => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    
    if (message.content && typeof message.content === 'object') {
      if (message.content.text) return message.content.text;
      if (message.content.body) return message.content.body;
      if (message.content.caption) return message.content.caption;
      
      // For media messages
      if (message.message_type !== 'text') {
        return `[${message.message_type.toUpperCase()}] ${message.content.filename || 'Arquivo de mídia'}`;
      }
    }
    
    return 'Conteúdo não disponível';
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'INBOUND' ? 
      <ArrowDownLeft className="w-4 h-4 text-blue-500" /> : 
      <ArrowUpRight className="w-4 h-4 text-green-500" />;
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'INBOUND' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {messages.length} mensagens
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-green-600' : 'text-gray-500'}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadMessages} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={clearMessages}>
            <Trash2 className="w-4 h-4 mr-1" />
            Limpar
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96 border rounded-lg p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-3 rounded-lg border ${getDirectionColor(message.direction)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getDirectionIcon(message.direction)}
                  <Badge variant="secondary" className="text-xs">
                    {message.message_type}
                  </Badge>
                  <span className="text-sm font-medium">
                    {message.wa_contact?.profile_name || 'Contato'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {message.wa_contact?.wa_phone_formatted}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(message.created_at), {
                    addSuffix: true,
                    locale: ptBR
                  })}
                </span>
              </div>
              <div className="text-sm">
                {getMessageContent(message)}
              </div>
            </div>
          ))}
          
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem encontrada
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}