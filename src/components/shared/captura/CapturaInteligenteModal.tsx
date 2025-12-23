import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { PainelRevisaoProcesso } from './PainelRevisaoProcesso';
import { Upload, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Contexto = 'processo' | 'financeiro' | 'agenda';

interface Props {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (dadosRevisados: any) => Promise<void>;
  contexto: Contexto;
  entidadeId: string;
}

export function CapturaInteligenteModal({ isOpen, onCancel, onSave, contexto, entidadeId }: Props) {
  const [resultadoIA, setResultadoIA] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [textoColado, setTextoColado] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const sanitizarDadosIA = (dados: any) => {
    const dadosSanitizados = { ...dados };

    if (dadosSanitizados.dados_extraidos) {
      const extraidos = dadosSanitizados.dados_extraidos;

      // Limpar valor_causa
      if (extraidos.valor_causa) {
        const valorLimpo = String(extraidos.valor_causa)
          .replace(/[^\d,.-]/g, '')
          .replace(',', '.');
        extraidos.valor_causa = parseFloat(valorLimpo) || null;
      }

      // Validar e formatar datas
      const camposData = ['data_nascimento', 'data_constituicao', 'data_distribuicao'];
      camposData.forEach((campo) => {
        if (extraidos[campo]) {
          const dataStr = String(extraidos[campo]);
          const match = dataStr.match(/(\d{2,4})[/-](\d{1,2})[/-](\d{2,4})/);
          
          if (match) {
            let [_, p1, p2, p3] = match;
            let ano, mes, dia;

            if (p1.length === 4) {
              ano = p1;
              mes = p2.padStart(2, '0');
              dia = p3.padStart(2, '0');
            } else {
              dia = p1.padStart(2, '0');
              mes = p2.padStart(2, '0');
              ano = p3.length === 2 ? `20${p3}` : p3;
            }

            extraidos[campo] = `${ano}-${mes}-${dia}`;
          }
        }
      });

      // Limpar strings (trim)
      Object.keys(extraidos).forEach((key) => {
        if (typeof extraidos[key] === 'string') {
          extraidos[key] = extraidos[key].trim();
        }
      });
    }

    return dadosSanitizados;
  };

  const analisarDocumento = async (textoOuArquivo: string | File) => {
    setIsAnalyzing(true);
    try {
      let texto = '';

      if (typeof textoOuArquivo === 'string') {
        texto = textoOuArquivo;
      } else {
        // Para arquivos, poderia ter lógica de OCR aqui
        // Por simplicidade, assumindo que é texto ou PDF que será processado no backend
        const reader = new FileReader();
        texto = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(textoOuArquivo);
        });
      }

      const { data, error } = await supabase.functions.invoke('analisar-documento-ia', {
        body: { texto, contexto, userId: (await supabase.auth.getUser()).data.user?.id }
      });

      if (error) throw error;

      const dadosSanitizados = sanitizarDadosIA(data);
      setResultadoIA(dadosSanitizados);
      toast.success('Análise concluída! Revise os dados antes de salvar.');
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Falha na análise automática. Tente novamente ou preencha manualmente.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setUploadedFile(file);
        analisarDocumento(file);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false
  });

  const handleSave = async (dadosDoPainel: any) => {
    setIsSaving(true);
    try {
      await onSave(dadosDoPainel);
      toast.success('Dados salvos com sucesso!');
      onCancel();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar os dados');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAnalisarTexto = () => {
    if (!textoColado.trim()) {
      toast.error('Por favor, cole algum texto para análise.');
      return;
    }
    analisarDocumento(textoColado);
  };

  const renderPainelRevisao = () => {
    if (!resultadoIA) return null;

    switch (contexto) {
      case 'processo':
        return (
          <PainelRevisaoProcesso 
            dadosIA={resultadoIA} 
            onSubmit={handleSave} 
            onCancel={onCancel}
            isSaving={isSaving} 
          />
        );
      default:
        return <p className="text-center text-muted-foreground p-4">Contexto não suportado.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Captura Inteligente de Documento
          </DialogTitle>
        </DialogHeader>

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Analisando documento com IA...</p>
          </div>
        )}

        {!isAnalyzing && !resultadoIA && (
          <Tabs defaultValue="arquivo" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="arquivo">Anexar Arquivo</TabsTrigger>
              <TabsTrigger value="texto">Colar Texto</TabsTrigger>
            </TabsList>

            <TabsContent value="arquivo" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                      transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                      hover:border-primary hover:bg-primary/5
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    {isDragActive ? (
                      <p className="text-primary font-medium">Solte o arquivo aqui...</p>
                    ) : (
                      <>
                        <p className="font-medium mb-2">Arraste um arquivo ou clique para selecionar</p>
                        <p className="text-sm text-muted-foreground">
                          Suporta PDF, imagens e arquivos de texto
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="texto" className="mt-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Textarea
                    placeholder="Cole aqui o conteúdo de um e-mail, mensagem ou documento..."
                    className="min-h-[250px]"
                    value={textoColado}
                    onChange={(e) => setTextoColado(e.target.value)}
                  />
                  <Button onClick={handleAnalisarTexto} className="w-full">
                    Analisar Texto Colado
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!isAnalyzing && resultadoIA && renderPainelRevisao()}
      </DialogContent>
    </Dialog>
  );
}
