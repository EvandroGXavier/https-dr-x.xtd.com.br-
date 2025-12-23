import { useState, useRef } from 'react';
import { DocViewerModal } from './DocViewerModal';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ItemEtiquetasInline } from '@/components/etiquetas/ItemEtiquetasInline';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocsListProps {
  vinculoTipo?: string;
  vinculoId?: string;
}

export function DocsList({ vinculoTipo, vinculoId }: DocsListProps) {
  const [viewerDoc, setViewerDoc] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docs: any[] = [];
  const isLoading = false;

  const handleOpenViewer = (doc: any) => {
    setViewerDoc(doc); // Apenas passa o objeto do documento, sem a URL
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implementar upload quando módulo Docs for reativado
    console.log('Upload desabilitado - módulo descontinuado');
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={true}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload Rápido (Descontinuado)
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando documentos...
        </div>
      ) : docs && docs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Etiquetas</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((doc: any) => (
              <TableRow 
                key={doc.id} 
                onDoubleClick={() => handleOpenViewer(doc)} 
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {doc.titulo || doc.arquivo_nome}
                </TableCell>
                <TableCell>
                  {/* Etiquetas serão implementadas posteriormente */}
                  <span className="text-muted-foreground text-sm">-</span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum documento encontrado</p>
          <p className="text-sm mt-2">Faça upload do primeiro documento</p>
        </div>
      )}

      <DocViewerModal 
        isOpen={!!viewerDoc} 
        anexo={viewerDoc} 
        onClose={() => setViewerDoc(null)}
      />
    </>
  );
}
