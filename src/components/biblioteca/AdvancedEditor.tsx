import React, { useState, useRef, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  FileText, 
  Plus, 
  Eye, 
  Code, 
  Table,
  Download,
  File
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { sanitizeHTML } from '@/lib/sanitizeHTML';

interface AdvancedEditorProps {
  conteudo: string;
  onContentChange: (content: string) => void;
  formato: string;
  placeholders?: string[];
}

// Placeholders expandidos para PF e PJ
const PLACEHOLDER_CATEGORIES = {
  contato_pf: {
    label: 'Pessoa Física (PF)',
    placeholders: [
      '{{pf.nome}}',
      '{{pf.cpf}}',
      '{{pf.rg}}',
      '{{pf.orgao_expedidor}}',
      '{{pf.data_nascimento}}',
      '{{pf.estado_civil}}',
      '{{pf.profissao}}',
      '{{pf.nacionalidade}}',
      '{{pf.naturalidade}}',
      '{{pf.nome_mae}}',
      '{{pf.nome_pai}}',
      '{{pf.cpf_mae}}',
      '{{pf.cpf_pai}}',
      '{{pf.email}}',
      '{{pf.celular}}',
      '{{pf.telefone}}',
      '{{pf.endereco}}',
      '{{pf.numero}}',
      '{{pf.complemento}}',
      '{{pf.bairro}}',
      '{{pf.cidade}}',
      '{{pf.estado}}',
      '{{pf.cep}}',
      '{{pf.sexo}}',
      '{{pf.limite_credito}}',
      '{{pf.cliente_desde}}',
      '{{pf.observacoes}}'
    ]
  },
  contato_pj: {
    label: 'Pessoa Jurídica (PJ)',
    placeholders: [
      '{{pj.razao_social}}',
      '{{pj.nome_fantasia}}',
      '{{pj.cnpj}}',
      '{{pj.ie_rg}}',
      '{{pj.ie_isento}}',
      '{{pj.data_abertura}}',
      '{{pj.capital_social}}',
      '{{pj.natureza_juridica}}',
      '{{pj.porte_empresa}}',
      '{{pj.situacao_cadastral}}',
      '{{pj.data_situacao_cadastral}}',
      '{{pj.motivo_situacao_cadastral}}',
      '{{pj.situacao_especial}}',
      '{{pj.data_situacao_especial}}',
      '{{pj.cnae_principal}}',
      '{{pj.cnae_secundarias}}',
      '{{pj.regime_tributario}}',
      '{{pj.email}}',
      '{{pj.celular}}',
      '{{pj.telefone}}',
      '{{pj.fax}}',
      '{{pj.web_site}}',
      '{{pj.endereco}}',
      '{{pj.numero}}',
      '{{pj.complemento}}',
      '{{pj.bairro}}',
      '{{pj.cidade}}',
      '{{pj.estado}}',
      '{{pj.cep}}',
      '{{pj.municipio_ibge}}',
      '{{pj.tipo_logradouro}}',
      '{{pj.limite_credito}}',
      '{{pj.condicao_pagamento}}',
      '{{pj.vendedor}}',
      '{{pj.segmento}}',
      '{{pj.observacoes}}'
    ]
  },
  processo: {
    label: 'Processo',
    placeholders: [
      '{{processo.numero}}',
      '{{processo.classe}}',
      '{{processo.assunto}}',
      '{{processo.vara}}',
      '{{processo.comarca}}',
      '{{processo.tribunal}}',
      '{{processo.uf}}',
      '{{processo.advogado_responsavel}}',
      '{{processo.valor_causa}}',
      '{{processo.data_distribuicao}}',
      '{{processo.status}}',
      '{{processo.observacoes}}'
    ]
  },
  empresa: {
    label: 'Empresa/Escritório',
    placeholders: [
      '{{empresa.razao_social}}',
      '{{empresa.nome_fantasia}}',
      '{{empresa.cnpj}}',
      '{{empresa.endereco}}',
      '{{empresa.telefone}}',
      '{{empresa.email}}',
      '{{empresa.cidade}}',
      '{{empresa.estado}}',
      '{{empresa.cep}}'
    ]
  },
  financeiro: {
    label: 'Financeiro',
    placeholders: [
      '{{valor_honorarios}}',
      '{{forma_pagamento}}',
      '{{vencimento}}',
      '{{qtd_parcelas}}',
      '{{valor_entrada}}',
      '{{valor_parcela}}',
      '{{juros_mes}}',
      '{{desconto}}',
      '{{valor_total}}',
      '{{conta_bancaria}}',
      '{{agencia}}',
      '{{banco}}'
    ]
  },
  utilidades: {
    label: 'Utilidades',
    placeholders: [
      '{{data}}',
      '{{data_extenso}}',
      '{{hora}}',
      '{{cidade}}',
      '{{dia}}',
      '{{mes}}',
      '{{ano}}',
      '{{dia_semana}}',
      '{{mes_extenso}}',
      '{{hora_completa}}',
      '{{timestamp}}'
    ]
  }
};

export const AdvancedEditor: React.FC<AdvancedEditorProps> = ({
  conteudo,
  onContentChange,
  formato,
  placeholders = []
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);

  // Configuração do Quill com recursos disponíveis em português
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'align',
    'link', 'image', 'video'
  ];

  const insertPlaceholder = useCallback((placeholder: string) => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, placeholder);
        quill.setSelection(range.index + placeholder.length);
      } else {
        quill.insertText(quill.getLength(), placeholder);
      }
    }
  }, []);

  const insertTable = useCallback(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        const tableHTML = `
          <table style="border-collapse: collapse; width: 100%; margin: 10px 0;">
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
                <td style="border: 1px solid #ddd; padding: 8px; min-width: 120px; height: 30px;">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        `;
        quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
      }
    }
  }, []);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        onContentChange(result.value);
        toast({
          title: "Documento importado",
          description: "Arquivo DOCX convertido com sucesso!",
        });
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const htmlString = XLSX.utils.sheet_to_html(worksheet);
        onContentChange(htmlString);
        toast({
          title: "Planilha importada",
          description: "Arquivo Excel convertido com sucesso!",
        });
      } else {
        toast({
          title: "Formato não suportado",
          description: "Apenas arquivos .docx e .xlsx são suportados.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao importar arquivo:', error);
      toast({
        title: "Erro na importação",
        description: "Não foi possível importar o arquivo.",
        variant: "destructive"
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onContentChange, toast]);

  const exportToDocx = useCallback(() => {
    // Simula exportação - em produção seria necessário uma biblioteca como docx
    const blob = new Blob([conteudo], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo.html';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Arquivo exportado",
      description: "Modelo exportado como HTML.",
    });
  }, [conteudo, toast]);

  const detectedPlaceholders = React.useMemo(() => {
    const regex = /\{\{[^}]+\}\}/g;
    const matches = conteudo.match(regex) || [];
    return Array.from(new Set(matches));
  }, [conteudo]);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {/* Import/Export */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>

            <Button variant="outline" size="sm" onClick={exportToDocx}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button variant="outline" size="sm" onClick={insertTable}>
              <Table className="h-4 w-4 mr-2" />
              Tabela
            </Button>

            {/* Variables Menu com seleção múltipla */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Inserir Variáveis
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
                {Object.entries(PLACEHOLDER_CATEGORIES).map(([key, category]) => (
                  <div key={key}>
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground bg-muted/50">
                      {category.label}
                    </div>
                    {category.placeholders.map((placeholder) => (
                      <DropdownMenuItem
                        key={placeholder}
                        onClick={() => insertPlaceholder(placeholder + ' ')}
                        className="font-mono text-xs hover:bg-primary/10"
                      >
                        {placeholder}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              {formato === 'html' ? (
                <div className="border rounded-md">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={conteudo}
                    onChange={onContentChange}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: '400px' }}
                    placeholder="Digite o conteúdo do modelo aqui..."
                  />
                </div>
              ) : (
                <textarea
                  value={conteudo}
                  onChange={(e) => onContentChange(e.target.value)}
                  placeholder="Digite o conteúdo do modelo aqui..."
                  className="min-h-[400px] w-full p-3 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Variáveis Detectadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    <div className="space-y-1">
                      {detectedPlaceholders.length > 0 ? (
                        detectedPlaceholders.map((placeholder) => (
                          <Badge 
                            key={placeholder} 
                            variant="secondary" 
                            className="text-xs font-mono block mb-1"
                          >
                            {placeholder}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Nenhuma variável detectada
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Estatísticas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Caracteres:</span>
                    <span>{conteudo.length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Palavras:</span>
                    <span>{conteudo.split(/\s+/).filter(Boolean).length}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Variáveis:</span>
                    <span>{detectedPlaceholders.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Visualização do Documento
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px] border rounded-md p-4 bg-background">
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHTML(conteudo) }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};