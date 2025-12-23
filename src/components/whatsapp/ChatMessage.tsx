import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Download, 
  FileText, 
  Image, 
  Volume2, 
  Video,
  ExternalLink,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video';
  content: {
    type: string;
    text?: string;
    media_url?: string;
    storage_path?: string;
    mime?: string;
    file_name?: string;
    size?: number;
    duration?: number;
    caption?: string;
  };
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | null;
  timestamp: string;
  quoted_message?: {
    id: string;
    body?: string;
    type: string;
    direction: 'INBOUND' | 'OUTBOUND';
  };
}

interface ChatMessageProps {
  message: WhatsAppMessage;
  onMediaDownload?: (url: string, filename: string) => void;
}

export const ChatMessage = ({ message, onMediaDownload }: ChatMessageProps) => {
  const [imageError, setImageError] = useState(false);
  
  const isIncoming = message.direction === 'INBOUND';
  const messageTime = formatDistanceToNow(new Date(message.timestamp), {
    locale: ptBR,
    addSuffix: false
  });

  const getStatusIcon = () => {
    if (isIncoming) return null;
    
    switch (message.status) {
      case 'QUEUED':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'SENT':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'DELIVERED':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'READ':
        return <CheckCheck className="h-3 w-3 text-blue-600" />;
      case 'FAILED':
        return <Clock className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getMediaIcon = () => {
    switch (message.message_type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'audio':
        return <Volume2 className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const handleMediaDownload = () => {
    if (message.content.media_url && onMediaDownload) {
      const filename = `media_${message.id}.${message.content.mime?.split('/')[1] || 'bin'}`;
      onMediaDownload(message.content.media_url, filename);
    }
  };

  const renderMediaContent = () => {
    if (!message.content.media_url) return null;

    switch (message.message_type) {
      case 'image':
        return (
          <div className="mt-2">
            {!imageError ? (
              <img
                src={message.content.media_url}
                alt={message.content.caption || "Imagem enviada"}
                className="max-w-64 max-h-64 rounded-lg cursor-pointer"
                onError={() => setImageError(true)}
                onClick={() => window.open(message.content.media_url, '_blank')}
              />
            ) : (
              <div className="w-64 h-32 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Imagem não disponível</p>
                  {message.content.media_url && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={handleMediaDownload}
                      className="mt-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'document':
        return (
          <div className="mt-2 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{message.content.file_name || 'Documento'}</p>
                  <p className="text-xs text-muted-foreground">
                    {message.content.mime || 'Arquivo'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMediaDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="mt-2">
            {message.content.media_url && (
              <audio 
                controls 
                preload="metadata"
                className="w-full max-w-xs rounded-md"
                onError={async (e) => {
                  console.error('❌ Erro ao reproduzir áudio, tentando renovar URL...');
                  try {
                    const { data, error } = await supabase.functions.invoke('wa-refresh-media-url', {
                      body: { 
                        message_id: message.id,
                        storage_path: message.content.storage_path 
                      }
                    });
                    if (!error && data?.media_url) {
                      // Forçar reload atualizando o src
                      const audioEl = e.currentTarget as HTMLAudioElement;
                      audioEl.src = data.media_url;
                      audioEl.load();
                      console.log('✅ URL renovada, tentando reproduzir novamente');
                    }
                  } catch (err) {
                    console.error('❌ Falha ao renovar URL:', err);
                  }
                }}
              >
                <source src={message.content.media_url} type={message.content.mime || 'audio/ogg'} />
                Seu navegador não suporta áudio.
              </audio>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="mt-2">
            {message.content.media_url && (
              <video controls className="max-w-xs rounded-lg">
                <source src={message.content.media_url} type={message.content.mime || 'video/mp4'} />
                Seu navegador não suporta vídeo.
              </video>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex ${isIncoming ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md ${isIncoming ? 'mr-auto' : 'ml-auto'}`}>
        {/* Quoted message if present */}
        {message.quoted_message && (
          <div className="mb-2 p-2 bg-muted/50 rounded-t-lg border-l-4 border-primary">
            <div className="flex items-center space-x-1 mb-1">
              {getMediaIcon()}
              <span className="text-xs text-muted-foreground">
                {message.quoted_message.direction === 'INBOUND' ? 'Contato' : 'Você'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {message.quoted_message.body || `Mensagem ${message.quoted_message.type}`}
            </p>
          </div>
        )}

        <Card className={`p-3 ${
          isIncoming 
            ? 'bg-card border-border' 
            : 'bg-primary text-primary-foreground border-primary'
        } ${message.quoted_message ? 'rounded-t-none' : ''}`}>
          {/* Message content */}
          {message.content.text && (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content.text}
            </p>
          )}

          {/* Media content */}
          {renderMediaContent()}

          {/* Message footer */}
          <div className={`flex items-center justify-between mt-2 pt-1 ${
            message.content.text || message.content.media_url ? 'border-t border-border/20' : ''
          }`}>
            <div className="flex items-center space-x-1">
              {message.status === 'FAILED' && (
                <Badge variant="destructive" className="text-xs">
                  Falha no envio
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`text-xs ${
                isIncoming ? 'text-muted-foreground' : 'text-primary-foreground/70'
              }`}>
                {messageTime}
              </span>
              {getStatusIcon()}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};