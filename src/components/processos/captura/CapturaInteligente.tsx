import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDropzone } from 'react-dropzone';
import { FileUp, Loader2, Sparkles, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProcessos } from '@/hooks/useProcessos';
import { supabase } from '@/integrations/supabase/client';
import { AcaoMagica } from './AcaoMagica';

export function CapturaInteligente() {
  const [textoColado, setTextoColado] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analiseResultado, setAnaliseResultado] = useState<any>(null);
  const { toast } = useToast();
  const { createProcesso } = useProcessos();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setArquivos(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/*': ['.txt', '.doc', '.docx'],
    },
  });

  // Função para sanitizar dados da IA
  const sanitizarDadosIA = (dados: any, nomeArquivo?: string) => {
    const sanitizado: any = {};

    // Sanitizar número do processo
    if (dados?.numero_processo) {
      sanitizado.numero_processo = String(dados.numero_processo).trim();
    }

    // Sanitizar valor da causa - remover formatação de moeda
    if (dados?.valor_causa) {
      const valorLimpo = String(dados.valor_causa)
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const valor = parseFloat(valorLimpo);
      sanitizado.valor_causa = isNaN(valor) ? null : valor;
    }

    // Sanitizar datas - garantir formato ISO
    if (dados?.data_distribuicao) {
      const data = new Date(dados.data_distribuicao);
      sanitizado.data_distribuicao = isNaN(data.getTime()) ? null : data.toISOString().split('T')[0];
    }

    // Outros campos diretos
    sanitizado.tipo_acao = dados?.tipo_acao || null;
    sanitizado.tribunal = dados?.tribunal || null;
    sanitizado.comarca = dados?.comarca || null;
    sanitizado.vara = dados?.vara || null;

    return sanitizado;
  };

  const handleAnalyze = async () => {
    if (!textoColado && arquivos.length === 0) {
      toast({
        title: 'Dados necessários',
        description: 'Por favor, cole um texto ou faça upload de arquivos.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      let analiseIA = null;
      let analiseError = false;

      // Se houver texto, fazer análise com IA
      if (textoColado) {
        try {
          const { data: analiseData, error } = await supabase.functions.invoke('analisar-documento-ia', {
            body: { 
              texto: textoColado,
              userId: (await supabase.auth.getUser()).data.user?.id
            }
          });

          if (error) throw error;

          if (analiseData?.success) {
            analiseIA = analiseData;
            setAnaliseResultado(analiseData);
          }
        } catch (error) {
          console.error('Erro na análise de IA:', error);
          analiseError = true;
          toast({
            title: 'Análise automática falhou',
            description: 'Não foi possível processar o texto automaticamente. O caso será criado com dados básicos.',
            variant: 'destructive',
          });
        }
      }

      // Sanitizar dados extraídos pela IA
      const dadosSanitizados = analiseIA?.dados_extraidos 
        ? sanitizarDadosIA(analiseIA.dados_extraidos, arquivos[0]?.name)
        : {};

      // Criar fallback para título usando nome do arquivo ou texto
      const tituloFallback = arquivos[0]?.name 
        ? `Análise do arquivo: ${arquivos[0].name}`
        : textoColado.substring(0, 100) || 'Caso capturado';

      // Criar processo inicial com status "ativo" (status válido do banco)
      const novoProcesso: any = {
        numero_processo: dadosSanitizados.numero_processo || '',
        assunto_principal: dadosSanitizados.tipo_acao || tituloFallback,
        status: 'ativo', // Usando status válido do enum do banco
        tipo: 'outros' as const,
        instancia: 'primeira' as const,
        tribunal: dadosSanitizados.tribunal || 'A definir',
        comarca: dadosSanitizados.comarca || null,
        vara: dadosSanitizados.vara || null,
        valor_causa: dadosSanitizados.valor_causa || null,
        data_distribuicao: dadosSanitizados.data_distribuicao || null,
        observacoes: textoColado || 'Capturado via upload de arquivos',
        resumo_ia: analiseIA?.resumo || null,
        timeline_ia: analiseIA?.timeline || null,
        pontos_atencao_ia: analiseIA?.pontos_atencao || null,
      };

      const processoId = await createProcesso(novoProcesso);

      // Se houver arquivos, fazer upload
      if (arquivos.length > 0 && processoId) {
        for (const arquivo of arquivos) {
          const fileName = `${processoId}/${Date.now()}_${arquivo.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from('processo-anexos')
            .upload(fileName, arquivo);

          if (uploadError) {
            console.error('Erro ao fazer upload:', uploadError);
            toast({
              title: 'Aviso',
              description: 'O caso foi criado, mas houve erro ao anexar alguns arquivos.',
              variant: 'destructive',
            });
          }
        }
      }

      toast({
        title: 'Caso capturado com sucesso!',
        description: analiseError 
          ? 'O caso foi criado, mas sem análise automática.'
          : 'O novo caso está pronto para análise.',
      });

      // Redirecionar para os detalhes do processo
      navigate(`/processos/${processoId}`);
    } catch (error) {
      console.error('Erro ao capturar caso:', error);
      toast({
        title: 'Erro ao capturar caso',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao processar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Captura Inteligente
          </CardTitle>
          <CardDescription>
            Cole o texto do caso ou faça upload de documentos para análise automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="texto" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="texto" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Colar Texto
              </TabsTrigger>
              <TabsTrigger value="arquivo" className="flex items-center gap-2">
                <FileUp className="h-4 w-4" />
                Anexar Arquivos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="texto" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cole o Conteúdo do Caso</label>
                <Textarea
                  placeholder="Cole aqui o conteúdo de e-mail, mensagem, petição inicial, notificação extrajudicial, etc..."
                  value={textoColado}
                  onChange={(e) => setTextoColado(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !textoColado.trim()}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando Texto...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar e Criar Caso
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="arquivo" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload de Documentos</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  {isDragActive ? (
                    <p className="text-sm text-muted-foreground">Solte os arquivos aqui...</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-1">
                        Arraste arquivos aqui ou clique para selecionar
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, imagens, documentos de texto
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Lista de arquivos */}
              {arquivos.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Arquivos Selecionados</label>
                  <div className="space-y-1">
                    {arquivos.map((arquivo, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                      >
                        <span className="truncate">{arquivo.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setArquivos(prev => prev.filter((_, i) => i !== index))}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || arquivos.length === 0}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando Arquivos...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Processar e Criar Caso
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ação Mágica - Aparece após análise bem-sucedida */}
      {analiseResultado && analiseResultado.tipo_documento && analiseResultado.tipo_documento !== 'OUTROS' && (
        <AcaoMagica 
          tipoDocumento={analiseResultado.tipo_documento}
          dadosExtraidos={analiseResultado.dados_extraidos || {}}
        />
      )}
    </div>
  );
}
