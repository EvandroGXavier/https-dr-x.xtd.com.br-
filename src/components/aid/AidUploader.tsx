import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AidUploaderProps {
  onUpload?: (file: File) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
  accept?: string[];
  maxSize?: number; // em bytes
  disabled?: boolean;
  className?: string;
}

interface UploadFile extends File {
  id: string;
  progress?: number;
  error?: string;
  success?: boolean;
}

export function AidUploader({
  onUpload,
  onError,
  onProgress,
  accept = ['image/*', 'application/pdf', 'text/*'],
  maxSize = 25 * 1024 * 1024, // 25MB
  disabled,
  className
}: AidUploaderProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo ${formatFileSize(maxSize)}.`;
    }

    // Validar tipo MIME
    const acceptedTypes = accept.map(type => {
      if (type.endsWith('/*')) {
        return type.slice(0, -2);
      }
      return type;
    });

    const isAccepted = acceptedTypes.some(type => 
      file.type.startsWith(type) || file.type === type
    );

    if (!isAccepted) {
      return 'Tipo de arquivo não suportado.';
    }

    return null;
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Tratar arquivos rejeitados
    rejectedFiles.forEach(({ file, errors }) => {
      console.error('Arquivo rejeitado:', file.name, errors);
      onError?.(`Erro no arquivo ${file.name}: ${errors[0]?.message || 'Tipo não suportado'}`);
    });

    // Processar arquivos aceitos
    acceptedFiles.forEach(file => {
      const validationError = validateFile(file);
      if (validationError) {
        onError?.(validationError);
        return;
      }

      const uploadFile: UploadFile = {
        ...file,
        id: `${Date.now()}-${Math.random()}`,
        progress: 0
      };

      setUploadFiles(prev => [...prev, uploadFile]);

      // Simular progresso de upload
      simulateUpload(uploadFile.id, file);
    });
  }, [onUpload, onError, maxSize]);

  const simulateUpload = async (fileId: string, file: File) => {
    try {
      // Simular progresso
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          )
        );
        
        onProgress?.(progress);
      }

      // Marcar como sucesso
      setUploadFiles(prev => 
        prev.map(f => 
          f.id === fileId ? { ...f, success: true, progress: 100 } : f
        )
      );

      // Chamar callback
      onUpload?.(file);

    } catch (error: any) {
      console.error('Erro no upload:', error);
      
      setUploadFiles(prev => 
        prev.map(f => 
          f.id === fileId ? { ...f, error: error.message, progress: 0 } : f
        )
      );
      
      onError?.(error.message);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    disabled,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: UploadFile) => {
    if (file.type.startsWith('image/')) {
      return '🖼️';
    } else if (file.type === 'application/pdf') {
      return '📄';
    } else if (file.type.startsWith('text/')) {
      return '📝';
    }
    return '📎';
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de drop */}
      <Card 
        className={cn(
          "transition-all duration-200 border-2 border-dashed cursor-pointer",
          (isDragActive || dropzoneActive) && "border-primary bg-primary/5 scale-105",
          disabled && "opacity-50 cursor-not-allowed",
          !isDragActive && !dropzoneActive && "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <CardContent className="p-8" {...getRootProps()}>
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-muted p-4">
              <Upload className={cn(
                "h-8 w-8 transition-colors",
                (isDragActive || dropzoneActive) ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                {isDragActive ? 'Solte os arquivos aqui' : 'Envie seus arquivos'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Arraste e solte ou clique para selecionar
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
              <span>PDF</span>
              <span>•</span>
              <span>Imagens</span>
              <span>•</span>
              <span>Texto</span>
              <span>•</span>
              <span>Máx {formatFileSize(maxSize)}</span>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              disabled={disabled}
              className="mt-2"
            >
              Selecionar Arquivos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de arquivos */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Arquivos ({uploadFiles.length})</h4>
          
          {uploadFiles.map((file) => (
            <Card key={file.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getFileIcon(file)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => removeFile(file.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    
                    {/* Barra de progresso */}
                    {typeof file.progress === 'number' && !file.success && !file.error && (
                      <div className="mt-2">
                        <Progress value={file.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {file.progress}% enviado
                        </p>
                      </div>
                    )}
                    
                    {/* Status de sucesso */}
                    {file.success && (
                      <div className="flex items-center gap-1 mt-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Enviado com sucesso</span>
                      </div>
                    )}
                    
                    {/* Erro */}
                    {file.error && (
                      <div className="flex items-center gap-1 mt-2 text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        <span className="text-xs">{file.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}