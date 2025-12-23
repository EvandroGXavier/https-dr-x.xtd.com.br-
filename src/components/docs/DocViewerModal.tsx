import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  ExternalLink, 
  Printer, 
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Draggable from 'react-draggable';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface DocViewerModalProps {
  isOpen: boolean;
  anexo: any;
  onClose: () => void;
}

export function DocViewerModal({ isOpen, anexo, onClose }: DocViewerModalProps) {
  const [dimensions, setDimensions] = useState({ width: 900, height: 700 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsMaximized(false);
      setDimensions({ width: 900, height: 700 });
      setObjectUrl(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && anexo?.path_storage) {
      setIsLoadingUrl(true);
      setObjectUrl(null);
      // TODO: Implementar download do blob quando módulo Docs for reativado
      setIsLoadingUrl(false);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, anexo, objectUrl]);

  if (!anexo) return null;

  const handleDownload = () => {
    if (!objectUrl) return;
    
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = anexo.arquivo_nome || anexo.titulo || 'documento';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!objectUrl) return;
    const printWindow = window.open(objectUrl, '_blank');
    printWindow?.addEventListener('load', () => {
      printWindow?.print();
    });
  };

  const handleOpenNewTab = () => {
    if (!objectUrl) return;
    window.open(objectUrl, '_blank');
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const modalContent = (
    <div 
      className="bg-background border rounded-lg shadow-xl"
      style={isMaximized ? { width: '95vw', height: '95vh' } : { width: dimensions.width, height: dimensions.height }}
    >
      {/* Header fixo */}
      <div className="p-4 border-b bg-muted/30 rounded-t-lg">
        <div className="flex items-center justify-between mb-3">
          <DialogTitle className="text-lg font-semibold flex-1">
            {anexo.titulo || anexo.arquivo_nome}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMaximize}
              title={isMaximized ? "Restaurar" : "Maximizar"}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar de ícones */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNewTab}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Nova Aba
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Área de visualização */}
      <div 
        className="p-4 overflow-hidden"
        style={{ height: isMaximized ? 'calc(95vh - 120px)' : dimensions.height - 120 }}
      >
        {isLoadingUrl ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Carregando documento...
          </div>
        ) : objectUrl ? (
          <iframe
            src={objectUrl}
            className="w-full h-full border rounded"
            title={`Visualização de ${anexo.arquivo_nome || anexo.titulo}`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Erro ao carregar o preview.
          </div>
        )}
      </div>
    </div>
  );

  if (isMaximized) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-none p-0 gap-0"
          style={{ width: '95vw', height: '95vh' }}
        >
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-none p-0 gap-0 overflow-hidden">
        <Draggable handle=".drag-handle">
          <div className="drag-handle cursor-move">
            <Resizable
              width={dimensions.width}
              height={dimensions.height}
              onResize={(e, { size }) => {
                setDimensions({ width: size.width, height: size.height });
              }}
              minConstraints={[600, 400]}
              maxConstraints={[1400, 900]}
            >
              {modalContent}
            </Resizable>
          </div>
        </Draggable>
      </DialogContent>
    </Dialog>
  );
}
