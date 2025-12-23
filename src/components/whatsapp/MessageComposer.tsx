import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Send, 
  Paperclip, 
  Image, 
  FileText, 
  X, 
  Upload,
  Loader2,
  Smile,
  Mic,
  Square
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import MicRecorder from 'mic-recorder-to-mp3';

interface MessageComposerProps {
  onSendMessage: (message: {
    type: 'text' | 'document' | 'image' | 'audio' | 'video';
    body?: string;
    media_url?: string;
    media_mime?: string;
    caption?: string;
  }) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export interface MessageComposerHandle {
  focus: () => void;
}

export const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(({ 
  onSendMessage, 
  disabled = false,
  placeholder = "Digite sua mensagem..."
}, ref) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [recorder, setRecorder] = useState<MicRecorder | null>(null);
  const [usingWebm, setUsingWebm] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // MicRecorder disabled to avoid 'Lame is not defined'; fallback uses MediaRecorder (WebM)
    setRecorder(null);
  }, []);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleSendText = async () => {
    if (!message.trim() || isSending || isRecording) return;

    setIsSending(true);
    try {
      await onSendMessage({
        type: 'text',
        body: message.trim()
      });
      setMessage('');
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (usingWebm) {
        try {
          mediaRecorderRef.current?.stop();
        } catch (e) {
          console.error('Error stopping MediaRecorder:', e);
          toast({
            title: 'Erro de Gravação',
            description: 'Não foi possível finalizar a gravação.',
            variant: 'destructive'
          });
          setIsRecording(false);
          setUsingWebm(false);
        }
        return;
      }

      try {
        const [buffer, blob] = await recorder!.stop().getMp3();
        const file = new File(buffer, 'voice-message.mp3', {
          type: blob.type,
          lastModified: Date.now(),
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('wa-midia')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('wa-midia')
          .getPublicUrl(filePath);

        await onSendMessage({
          type: 'audio',
          body: 'Mensagem de voz',
          media_url: publicUrl,
          media_mime: 'audio/mpeg'
        });

        setIsRecording(false);
      } catch (error) {
        console.error('Recording error:', error);
        toast({
          title: 'Erro de Gravação',
          description: 'Não foi possível gravar o áudio.',
          variant: 'destructive'
        });
        setIsRecording(false);
      }
    } else {
      try {
        await recorder!.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Could not start recording (MP3). Falling back to MediaRecorder:', error);
        // Fallback to native MediaRecorder (WebM)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = mr;
          mediaChunksRef.current = [];

          mr.ondataavailable = (e: BlobEvent) => {
            if (e.data && e.data.size > 0) mediaChunksRef.current.push(e.data);
          };

          mr.onstop = async () => {
            try {
              const blob = new Blob(mediaChunksRef.current, { type: 'audio/webm' });
              const file = new File([blob], 'voice-message.webm', {
                type: 'audio/webm',
                lastModified: Date.now(),
              });

              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Usuário não autenticado');

              const fileName = `${Date.now()}_${file.name}`;
              const filePath = `${user.id}/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('wa-midia')
                .upload(filePath, file, {
                  contentType: file.type,
                  upsert: false
                });

              if (uploadError) throw uploadError;

              const { data: { publicUrl } } = supabase.storage
                .from('wa-midia')
                .getPublicUrl(filePath);

              await onSendMessage({
                type: 'audio',
                body: 'Mensagem de voz',
                media_url: publicUrl,
                media_mime: 'audio/webm'
              });
            } catch (err) {
              console.error('WebM recording error:', err);
              toast({
                title: 'Erro de Gravação',
                description: 'Não foi possível gravar o áudio.',
                variant: 'destructive'
              });
            } finally {
              mediaStreamRef.current?.getTracks().forEach(t => t.stop());
              mediaRecorderRef.current = null;
              setUsingWebm(false);
              setIsRecording(false);
            }
          };

          mr.start();
          setUsingWebm(true);
          setIsRecording(true);
        } catch (err) {
          console.error('MediaRecorder fallback failed:', err);
          toast({
            title: 'Erro de permissão',
            description: 'Permissão para usar o microfone é necessária.',
            variant: 'destructive'
          });
        }
      }
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = message.substring(0, start) + emoji.native + message.substring(end);
      setMessage(newText);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.native.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 16MB)
      if (file.size > 16 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 16MB.",
          variant: "destructive"
        });
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de arquivo não suportado",
          description: "Apenas imagens, PDFs e documentos Office são permitidos.",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSendFile = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload directly to Supabase Storage
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('wa-midia')
        .upload(filePath, selectedFile, {
          contentType: selectedFile.type,
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wa-midia')
        .getPublicUrl(filePath);

      // Determine message type
      let messageType: 'text' | 'image' | 'document' | 'video' | 'audio' = 'document';
      if (selectedFile.type.startsWith('image/')) messageType = 'image';
      else if (selectedFile.type.startsWith('video/')) messageType = 'video';
      else if (selectedFile.type.startsWith('audio/')) messageType = 'audio';

      await onSendMessage({
        type: messageType,
        body: selectedFile.name,
        media_url: publicUrl,
        media_mime: selectedFile.type
      });

      setSelectedFile(null);
      setShowAttachDialog(false);
      
      toast({
        title: "Arquivo enviado",
        description: `${selectedFile.name} foi enviado com sucesso.`
      });

    } catch (error) {
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  return (
    <Card className="border-t flex-shrink-0">
      <CardContent className="p-4">
        <div className="flex items-end space-x-2">
          {/* Emoji picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={disabled || isRecording}
                className="flex-shrink-0"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>

          {/* Attachment button */}
          <Dialog open={showAttachDialog} onOpenChange={setShowAttachDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={disabled || isRecording}
                className="flex-shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Arquivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = 'image/*';
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex-col h-20 w-20"
                  >
                    <Image className="h-6 w-6 mb-1" />
                    <span className="text-xs">Imagem</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.txt';
                        fileInputRef.current.click();
                      }
                    }}
                    className="flex-col h-20 w-20"
                  >
                    <FileText className="h-6 w-6 mb-1" />
                    <span className="text-xs">Documento</span>
                  </Button>
                </div>

                <Input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {selectedFile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {selectedFile.type.startsWith('image/') ? (
                          <Image className="h-5 w-5" />
                        ) : (
                          <FileText className="h-5 w-5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <Button
                      className="w-full mt-3"
                      onClick={handleSendFile}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Enviar Arquivo
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Message input */}
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isRecording ? 'Gravando áudio...' : placeholder}
              disabled={disabled || isRecording}
              className="min-h-[60px] max-h-[120px] resize-none"
              rows={2}
            />
          </div>

          {/* Send or Record button */}
          {message.trim() && !isRecording ? (
            <Button
              onClick={handleSendText}
              disabled={disabled || isSending}
              size="icon"
              className="flex-shrink-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleToggleRecording}
              disabled={disabled || isUploading}
              size="icon"
              variant={isRecording ? "destructive" : "default"}
              className="flex-shrink-0"
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

MessageComposer.displayName = 'MessageComposer';