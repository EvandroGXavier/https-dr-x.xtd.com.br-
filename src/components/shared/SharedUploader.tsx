import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Camera, 
  Bot,
  Loader2,
  File,
  Image
} from "lucide-react";

export type UploaderContext = 'documentos' | 'contatos-anexos';

interface SharedUploaderProps {
  context: UploaderContext;
  entityId: string;
  accept?: string[];
  maxSizeMB?: number;
  onSuccess?: (payload: any) => void;
  disabled?: boolean;
}

export function SharedUploader({
  context,
  entityId,
  accept = ['image/*', 'application/pdf', '.doc', '.docx'],
  maxSizeMB = 25,
  onSuccess,
  disabled = false
}: SharedUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getContextConfig = () => {
    switch (context) {
      case 'documentos':
        return {
          title: 'Upload Inteligente de Documentos',
          subtitle: '📸 Use a câmera para análise automática de CNPJs e cadastro de contatos, ou faça upload tradicional',
          uploadUrl: `/api/documentos/${entityId}/upload`,
          allowCamera: true,
          allowIA: true
        };
      case 'contatos-anexos':
        return {
          title: 'Enviar Anexos',
          subtitle: 'Faça upload de documentos, imagens e outros arquivos relacionados ao contato',
          uploadUrl: `/api/contatos/${entityId}/anexos`,
          allowCamera: true,
          allowIA: false
        };
      default:
        return {
          title: 'Upload de Arquivos',
          subtitle: 'Faça upload dos seus arquivos',
          uploadUrl: `/api/upload`,
          allowCamera: false,
          allowIA: false
        };
    }
  };

  const config = getContextConfig();

  const validateFile = (file: File): string | null => {
    // Validar tamanho
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo ${maxSizeMB}MB permitido.`;
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado: ${file.type}`;
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validar todos os arquivos
      for (let i = 0; i < files.length; i++) {
        const error = validateFile(files[i]);
        if (error) {
          toast({
            title: "Erro",
            description: error,
            variant: "destructive",
          });
          return;
        }
      }
      setSelectedFiles(files);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
        return;
      }
      
      // Para câmera, criar um FileList com apenas este arquivo
      const dt = new DataTransfer();
      dt.items.add(file);
      setSelectedFiles(dt.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      // Validar arquivos arrastados
      for (let i = 0; i < files.length; i++) {
        const error = validateFile(files[i]);
        if (error) {
          toast({
            title: "Erro",
            description: error,
            variant: "destructive",
          });
          return;
        }
      }
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Nenhum arquivo selecionado",
        description: "Selecione pelo menos um arquivo para enviar.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    
    try {
      // Se é apenas um arquivo, usar upload individual para melhor feedback
      if (selectedFiles.length === 1) {
        const file = selectedFiles[0];
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(config.uploadUrl, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Erro no upload: ${response.status}`);
        }
        
        const result = await response.json();
        
        toast({
          title: "Sucesso",
          description: `Arquivo ${file.name} enviado com sucesso`,
        });

        onSuccess?.(result);
      } else {
        // Upload múltiplo
        const uploadPromises = Array.from(selectedFiles).map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(config.uploadUrl, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Erro no upload de ${file.name}: ${response.status}`);
          }
          
          return { success: true, file: file.name, data: await response.json() };
        });

        const results = await Promise.all(uploadPromises);
        const successful = results.filter(r => r.success);

        toast({
          title: `${successful.length} arquivo(s) enviado(s) com sucesso`,
          description: successful.map(r => r.file).join(', ')
        });

        onSuccess?.(results);
      }

      // Reset
      setSelectedFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar arquivo(s)",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {config.title}
          {config.allowIA && (
            <Badge variant="secondary" className="ml-2">
              <Bot className="h-3 w-3 mr-1" />
              IA Integrada
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {config.subtitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Botões de captura */}
          {config.allowCamera && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                className="h-16 flex flex-col items-center gap-1 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
                disabled={uploading || disabled}
              >
                <Camera className="h-6 w-6 text-blue-600" />
                <span className="text-xs font-medium">📸 Câmera</span>
                {config.allowIA && <span className="text-xs text-green-600">IA Automática</span>}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-16 flex flex-col items-center gap-1 border-2 border-dashed hover:border-gray-500 hover:bg-gray-50"
                disabled={uploading || disabled}
              >
                <Upload className="h-6 w-6 text-gray-600" />
                <span className="text-xs font-medium">📁 Arquivos</span>
                <span className="text-xs text-gray-500">Upload Normal</span>
              </Button>
            </div>
          )}
          
          {/* Área de drag and drop */}
          <div 
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onDragOver={!disabled ? handleDragOver : undefined}
            onDragLeave={!disabled ? handleDragLeave : undefined}
            onDrop={!disabled ? handleDrop : undefined}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <div className="space-y-1 text-center">
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-600">Enviando arquivos...</p>
                    <p className="text-sm text-gray-500">Aguarde a conclusão</p>
                  </div>
                </div>
              ) : selectedFiles && selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} arquivo(s) selecionado(s):
                  </div>
                  {Array.from(selectedFiles).map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      {getFileIcon(file)}
                      <span className="font-medium">{file.name}</span>
                      <span className="text-gray-400">({formatFileSize(file.size)})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500">
                      Faça upload de arquivo(s)
                    </span>
                    <span className="pl-1">ou arraste e solte aqui</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Tipos aceitos: {accept.join(', ')} - até {maxSizeMB}MB
                  </p>
                </>
              )}
              
              {/* Input de arquivo regular */}
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                onChange={handleFileSelect}
                accept={accept.join(',')}
                multiple
                disabled={disabled}
              />
              
              {/* Input de câmera */}
              {config.allowCamera && (
                <input
                  ref={cameraInputRef}
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraCapture}
                  disabled={disabled}
                />
              )}
            </div>
          </div>

          {/* Botão de upload */}
          {selectedFiles && selectedFiles.length > 0 && (
            <Button 
              onClick={handleUpload} 
              disabled={uploading || disabled}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar {selectedFiles.length > 1 ? `${selectedFiles.length} Arquivos` : 'Arquivo'}
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}