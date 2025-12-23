import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Camera, 
  Loader2,
  File,
  Image,
  CheckCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProcessoUploaderProps {
  onFilesSelected: (files: FileList) => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export function ProcessoUploader({ onFilesSelected, isProcessing = false, disabled = false }: ProcessoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return `Arquivo muito grande. Máximo 25MB permitido.`;
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return `Tipo de arquivo não suportado: ${file.type}`;
    }

    return null;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const error = validateFile(files[0]);
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(files);
      simulateUpload(files);
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
      
      const dt = new DataTransfer();
      dt.items.add(file);
      setSelectedFiles(dt.files);
      simulateUpload(dt.files);
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
      const error = validateFile(files[0]);
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(files);
      simulateUpload(files);
    }
  };

  const simulateUpload = (files: FileList) => {
    setUploadProgress(0);
    setShowSuccess(false);
    
    // Simular progresso de upload
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowSuccess(true);
          onFilesSelected(files);
          
          // Reset após 2 segundos
          setTimeout(() => {
            setSelectedFiles(null);
            setUploadProgress(0);
            setShowSuccess(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
          }, 2000);
          
          return 100;
        }
        return prev + 10;
      });
    }, 100);
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
          <FileText className="h-5 w-5" />
          Análise Inteligente de Documentos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Carregue um documento PDF ou imagem para extrair automaticamente informações do processo
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Botões de captura */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => cameraInputRef.current?.click()}
              className="h-16 flex flex-col items-center gap-1 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50"
              disabled={isProcessing || disabled}
            >
              <Camera className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium">📸 Câmera</span>
              <span className="text-xs text-green-600">IA Automática</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="h-16 flex flex-col items-center gap-1 border-2 border-dashed hover:border-gray-500 hover:bg-gray-50"
              disabled={isProcessing || disabled}
            >
              <Upload className="h-6 w-6 text-gray-600" />
              <span className="text-xs font-medium">📁 Arquivos</span>
              <span className="text-xs text-gray-500">Upload Normal</span>
            </Button>
          </div>
          
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
              {showSuccess ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div>
                    <p className="font-medium text-green-600">Upload concluído!</p>
                    <p className="text-sm text-gray-500">Documento carregado com sucesso</p>
                  </div>
                </div>
              ) : uploadProgress > 0 ? (
                <div className="space-y-3">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto" />
                  <div>
                    <p className="font-medium text-blue-600">Enviando arquivo...</p>
                    <div className="w-full max-w-xs mx-auto mt-2">
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{uploadProgress}% concluído</p>
                  </div>
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-600">Processando documento...</p>
                    <p className="text-sm text-gray-500">Extraindo informações via OCR</p>
                  </div>
                </div>
              ) : selectedFiles && selectedFiles.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">
                    Arquivo selecionado:
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
                    PDF, JPG, PNG - até 25MB
                  </p>
                </>
              )}
              
              {/* Input de arquivo regular */}
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                onChange={handleFileSelect}
                accept="application/pdf,image/*"
                disabled={disabled}
              />
              
              {/* Input de câmera */}
              <input
                ref={cameraInputRef}
                type="file"
                className="sr-only"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}