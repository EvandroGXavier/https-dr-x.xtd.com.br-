import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clipboard, 
  Upload, 
  Camera, 
  Mic, 
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';

import { AidPasteZone, PasteContent } from './AidPasteZone';
import { AidUploader } from './AidUploader';
import { useAid } from '@/hooks/useAid';

interface AidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceModule: string;
  sourceRefId?: string;
  contactoId?: string;
  onAnalysisComplete?: (jobId: string) => void;
}

export function AidDialog({
  open,
  onOpenChange,
  sourceModule,
  sourceRefId,
  contactoId,
  onAnalysisComplete
}: AidDialogProps) {
  const [activeTab, setActiveTab] = useState('paste');
  const [error, setError] = useState<string | null>(null);
  const { createAnalysisJob, isAnalyzing } = useAid();

  const handlePaste = async (content: PasteContent) => {
    setError(null);
    
    try {
      const jobId = await createAnalysisJob({
        content: content.type === 'text' ? content.content : undefined,
        file: content.file,
        source_module: sourceModule,
        source_ref_id: sourceRefId,
        contato_id: contactoId
      });

      if (jobId) {
        onAnalysisComplete?.(jobId);
        onOpenChange(false);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    
    try {
      const jobId = await createAnalysisJob({
        file,
        source_module: sourceModule,
        source_ref_id: sourceRefId,
        contato_id: contactoId
      });

      if (jobId) {
        onAnalysisComplete?.(jobId);
        onOpenChange(false);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🤖 Análise Inteligente de Documentos
            {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            Cole, envie ou capture conteúdo para análise automática com IA. 
            Os dados extraídos podem ser aplicados diretamente aos seus registros.
          </DialogDescription>
        </DialogHeader>

        {/* Status e erro */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={clearError}>
              ×
            </Button>
          </div>
        )}

        {/* Navegação principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <Clipboard className="h-4 w-4" />
              <span className="hidden sm:inline">Colar</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2" disabled>
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Câmera</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2" disabled>
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Áudio</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[60vh] overflow-y-auto">
            <TabsContent value="paste" className="mt-0">
              <AidPasteZone
                onPaste={handlePaste}
                onError={handleError}
                disabled={isAnalyzing}
                placeholder="Pressione Ctrl+V para colar texto ou imagem"
              />
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <AidUploader
                onUpload={handleUpload}
                onError={handleError}
                disabled={isAnalyzing}
                maxSize={25 * 1024 * 1024} // 25MB
                accept={['image/*', 'application/pdf', 'text/*']}
              />
            </TabsContent>

            <TabsContent value="camera" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Captura por câmera será implementada em breve</p>
              </div>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <div className="text-center py-12 text-muted-foreground">
                <Mic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Transcrição de áudio será implementada em breve</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <Separator />

        {/* Rodapé com informações */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              OCR Automático
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Extração de Dados BR
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Deduplicação
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              Aplicação Assistida
            </Badge>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p>
              Os dados extraídos serão apresentados para revisão antes de qualquer aplicação. 
              Nenhuma informação é salva automaticamente sem sua confirmação.
            </p>
          </div>

          {isAnalyzing && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando documento... Isso pode levar alguns segundos.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}