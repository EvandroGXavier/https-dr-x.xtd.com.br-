import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportarNfeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportarNfeDialog({ open, onOpenChange, onSuccess }: ImportarNfeDialogProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultado, setResultado] = useState<any>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      // Obter token de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      
      // Chamar edge function com FormData
      const response = await fetch(
        `https://api.dr-x.xtd.com.br/functions/v1/processar-nfe`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRraWJ0dXRydXlieHBkbWppY2pnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NjczMTgsImV4cCI6MjA3MTA0MzMxOH0.q7zddEDqiy9EjAcTAg5EMoFn3B7D3YtJv0oMdpK8Y4w',
          },
          body: formData,
        }
      );

      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar NF-e');
      }

      const data = await response.json();

      setProgress(90);

      if (data.success) {
        setResultado(data);
        setProgress(100);
        toast({
          title: 'Sucesso!',
          description: data.message,
        });
        setTimeout(() => {
          onSuccess?.();
          onOpenChange(false);
          setResultado(null);
          setProgress(0);
        }, 2000);
      } else {
        throw new Error(data.error || 'Erro ao processar NF-e');
      }
    } catch (error: any) {
      console.error('Erro ao importar NF-e:', error);
      toast({
        title: 'Erro ao importar',
        description: error.message || 'Falha ao processar arquivo',
        variant: 'destructive',
      });
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>📤 Importar Nota Fiscal</DialogTitle>
          <DialogDescription>
            Envie o arquivo XML, PDF ou imagem da NF-e para importação automática
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!uploading && !resultado && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
              <input
                type="file"
                accept=".xml,.pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
                id="nfe-upload"
              />
              <label htmlFor="nfe-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground">
                  XML, PDF, JPG ou PNG (até 10MB)
                </p>
              </label>
            </div>
          )}

          {uploading && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 animate-pulse" />
                <span className="text-sm font-medium">Processando NF-e...</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 && 'Enviando arquivo...'}
                {progress >= 30 && progress < 80 && 'Extraindo dados...'}
                {progress >= 80 && 'Finalizando importação...'}
              </p>
            </div>
          )}

          {resultado && (
            <div className="space-y-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Importação concluída!</span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>NF-e:</strong> {resultado.dados?.numero_nfe || 'N/A'}</p>
                <p><strong>Fornecedor:</strong> {resultado.dados?.fornecedor?.nome || 'N/A'}</p>
                <p><strong>Valor:</strong> R$ {resultado.dados?.valor_total?.toFixed(2) || '0,00'}</p>
                <p><strong>Itens:</strong> {resultado.dados?.itens?.length || 0}</p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                O sistema tentará identificar automaticamente o fornecedor e produtos. 
                Revise os dados antes de aprovar a compra.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
