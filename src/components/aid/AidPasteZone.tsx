import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clipboard, FileText, Image, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PasteContent {
  type: 'text' | 'image';
  content: string; // Para texto, conteúdo direto. Para imagem, data URL
  file?: File; // Para imagem
  size?: number;
}

interface AidPasteZoneProps {
  onPaste?: (content: PasteContent) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function AidPasteZone({ 
  onPaste, 
  onError, 
  className, 
  disabled,
  placeholder = "Cole aqui texto ou imagem (Ctrl+V)"
}: AidPasteZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastPaste, setLastPaste] = useState<PasteContent | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (disabled) return;

      e.preventDefault();
      
      try {
        const items = Array.from(e.clipboardData?.items || []);
        
        // Verificar se tem imagem
        const imageItem = items.find(item => item.type.startsWith('image/'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            // Validar tamanho (max 25MB)
            if (file.size > 25 * 1024 * 1024) {
              onError?.('Imagem muito grande. Máximo 25MB.');
              return;
            }

            const reader = new FileReader();
            reader.onload = () => {
              const content: PasteContent = {
                type: 'image',
                content: reader.result as string,
                file,
                size: file.size
              };
              setLastPaste(content);
              onPaste?.(content);
            };
            reader.readAsDataURL(file);
            return;
          }
        }

        // Verificar se tem texto
        const text = e.clipboardData?.getData('text/plain') || '';
        if (text.trim()) {
          const content: PasteContent = {
            type: 'text',
            content: text.trim()
          };
          setLastPaste(content);
          onPaste?.(content);
          
          // Mostrar no textarea se disponível
          if (textareaRef.current) {
            textareaRef.current.value = text.trim();
          }
          return;
        }

        onError?.('Nenhum conteúdo válido encontrado na área de transferência');
      } catch (error) {
        console.error('Erro ao processar colagem:', error);
        onError?.('Erro ao processar conteúdo colado');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        // Deixar o evento de paste ser disparado naturalmente
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPaste, onError, disabled]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Pegar apenas o primeiro arquivo
    
    // Validar tamanho
    if (file.size > 25 * 1024 * 1024) {
      onError?.('Arquivo muito grande. Máximo 25MB.');
      return;
    }

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const content: PasteContent = {
          type: 'image',
          content: reader.result as string,
          file,
          size: file.size
        };
        setLastPaste(content);
        onPaste?.(content);
      };
      reader.readAsDataURL(file);
    } else {
      onError?.('Apenas imagens são suportadas por drag & drop');
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.trim();
    if (text) {
      const content: PasteContent = {
        type: 'text',
        content: text
      };
      setLastPaste(content);
      onPaste?.(content);
    }
  };

  const handleClearPaste = () => {
    setLastPaste(null);
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Zona de colagem principal */}
      <Card 
        className={cn(
          "transition-all duration-200 border-2 border-dashed",
          isDragOver && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragOver && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-muted p-4">
              <Clipboard className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Cole ou arraste o conteúdo</h3>
              <p className="text-sm text-muted-foreground">
                {placeholder}
              </p>
            </div>

            <div className="flex gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Texto
              </span>
              <span className="flex items-center gap-1">
                <Image className="h-3 w-3" />
                Imagem (máx 25MB)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Área de texto opcional */}
      <Card>
        <CardContent className="p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Ou digite/cole texto aqui:
          </label>
          <textarea
            ref={textareaRef}
            className="w-full min-h-24 p-3 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Digite ou cole texto aqui..."
            disabled={disabled}
            onChange={handleTextareaChange}
          />
        </CardContent>
      </Card>

      {/* Preview do último conteúdo colado */}
      {lastPaste && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {lastPaste.type === 'image' ? (
                    <Image className="h-4 w-4 text-primary" />
                  ) : (
                    <FileText className="h-4 w-4 text-primary" />
                  )}
                  <span className="text-sm font-medium">
                    {lastPaste.type === 'image' ? 'Imagem colada' : 'Texto colado'}
                  </span>
                  {lastPaste.size && (
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(lastPaste.size)})
                    </span>
                  )}
                </div>
                
                {lastPaste.type === 'image' ? (
                  <img 
                    src={lastPaste.content} 
                    alt="Conteúdo colado" 
                    className="max-w-48 max-h-32 object-contain rounded border"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {lastPaste.content}
                  </p>
                )}
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClearPaste}
                disabled={disabled}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
        <p>
          Suporta imagens (JPG, PNG, WebP), texto simples e printscreens. 
          Máximo 25MB por arquivo. O conteúdo será analisado automaticamente.
        </p>
      </div>
    </div>
  );
}