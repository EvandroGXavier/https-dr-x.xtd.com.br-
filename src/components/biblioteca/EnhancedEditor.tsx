import React, { useState, useRef, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Plus, 
  Eye, 
  Code, 
  Table,
  Download,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Image,
  Undo,
  Redo,
  Save,
  Palette,
  FileDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { sanitizeHTML } from '@/lib/sanitizeHTML';

interface EnhancedEditorProps {
  conteudo: string;
  onContentChange: (content: string) => void;
  formato: string;
  placeholders?: string[];
  onSave?: () => void;
}

// Expanded placeholder categories with comprehensive variables
const PLACEHOLDER_CATEGORIES = {
  contato_pf: {
    label: 'Pessoa Física (PF)',
    icon: '👤',
    placeholders: [
      '{{pf.nome}}', '{{pf.nome_completo}}', '{{pf.cpf}}', '{{pf.rg}}',
      '{{pf.orgao_expedidor}}', '{{pf.data_nascimento}}', '{{pf.idade}}',
      '{{pf.estado_civil}}', '{{pf.profissao}}', '{{pf.nacionalidade}}',
      '{{pf.naturalidade}}', '{{pf.nome_mae}}', '{{pf.nome_pai}}',
      '{{pf.email}}', '{{pf.celular}}', '{{pf.telefone}}', '{{pf.whatsapp}}',
      '{{pf.endereco_completo}}', '{{pf.endereco}}', '{{pf.numero}}',
      '{{pf.complemento}}', '{{pf.bairro}}', '{{pf.cidade}}', '{{pf.estado}}',
      '{{pf.cep}}', '{{pf.sexo}}', '{{pf.escolaridade}}', '{{pf.renda}}',
      '{{pf.observacoes}}'
    ]
  },
  contato_pj: {
    label: 'Pessoa Jurídica (PJ)',
    icon: '🏢',
    placeholders: [
      '{{pj.razao_social}}', '{{pj.nome_fantasia}}', '{{pj.cnpj}}',
      '{{pj.ie_rg}}', '{{pj.im}}', '{{pj.data_abertura}}', '{{pj.capital_social}}',
      '{{pj.natureza_juridica}}', '{{pj.porte_empresa}}', '{{pj.situacao_cadastral}}',
      '{{pj.cnae_principal}}', '{{pj.regime_tributario}}', '{{pj.responsavel}}',
      '{{pj.cpf_responsavel}}', '{{pj.email}}', '{{pj.telefone}}', '{{pj.celular}}',
      '{{pj.fax}}', '{{pj.website}}', '{{pj.endereco_completo}}', '{{pj.endereco}}',
      '{{pj.numero}}', '{{pj.complemento}}', '{{pj.bairro}}', '{{pj.cidade}}',
      '{{pj.estado}}', '{{pj.cep}}', '{{pj.observacoes}}'
    ]
  },
  processo: {
    label: 'Processo Judicial',
    icon: '⚖️',
    placeholders: [
      '{{processo.numero}}', '{{processo.numero_formatado}}', '{{processo.classe}}',
      '{{processo.assunto}}', '{{processo.vara}}', '{{processo.comarca}}',
      '{{processo.tribunal}}', '{{processo.uf}}', '{{processo.instancia}}',
      '{{processo.advogado_responsavel}}', '{{processo.oab_responsavel}}',
      '{{processo.valor_causa}}', '{{processo.valor_causa_extenso}}',
      '{{processo.data_distribuicao}}', '{{processo.data_citacao}}',
      '{{processo.status}}', '{{processo.fase}}', '{{processo.observacoes}}',
      '{{processo.parte_autora}}', '{{processo.parte_re}}'
    ]
  },
  empresa: {
    label: 'Empresa/Escritório',
    icon: '🏛️',
    placeholders: [
      '{{empresa.razao_social}}', '{{empresa.nome_fantasia}}', '{{empresa.cnpj}}',
      '{{empresa.endereco_completo}}', '{{empresa.endereco}}', '{{empresa.numero}}',
      '{{empresa.bairro}}', '{{empresa.cidade}}', '{{empresa.estado}}',
      '{{empresa.cep}}', '{{empresa.telefone}}', '{{empresa.email}}',
      '{{empresa.website}}', '{{empresa.responsavel}}', '{{empresa.oab}}',
      '{{empresa.logo}}', '{{empresa.slogan}}'
    ]
  },
  financeiro: {
    label: 'Dados Financeiros',
    icon: '💰',
    placeholders: [
      '{{valor_honorarios}}', '{{valor_honorarios_extenso}}', '{{forma_pagamento}}',
      '{{vencimento}}', '{{vencimento_extenso}}', '{{qtd_parcelas}}',
      '{{valor_entrada}}', '{{valor_entrada_extenso}}', '{{valor_parcela}}',
      '{{valor_parcela_extenso}}', '{{juros_mes}}', '{{multa}}', '{{desconto}}',
      '{{valor_total}}', '{{valor_total_extenso}}', '{{conta_bancaria}}',
      '{{agencia}}', '{{banco}}', '{{pix_chave}}', '{{pix_tipo}}'
    ]
  },
  datas: {
    label: 'Datas e Horários',
    icon: '📅',
    placeholders: [
      '{{data}}', '{{data_extenso}}', '{{data_completa}}', '{{hora}}',
      '{{hora_completa}}', '{{dia}}', '{{mes}}', '{{ano}}', '{{dia_semana}}',
      '{{mes_extenso}}', '{{timestamp}}', '{{data_assinatura}}',
      '{{data_vencimento}}', '{{prazo_dias}}', '{{prazo_meses}}'
    ]
  },
  documentos: {
    label: 'Dados do Documento',
    icon: '📄',
    placeholders: [
      '{{documento.titulo}}', '{{documento.numero}}', '{{documento.versao}}',
      '{{documento.data_criacao}}', '{{documento.autor}}', '{{documento.revisor}}',
      '{{documento.status}}', '{{documento.categoria}}', '{{documento.observacoes}}'
    ]
  }
};

const FONT_SIZES = [
  { label: '8pt', value: '8px' },
  { label: '9pt', value: '9px' },
  { label: '10pt', value: '10px' },
  { label: '11pt', value: '11px' },
  { label: '12pt', value: '12px' },
  { label: '14pt', value: '14px' },
  { label: '16pt', value: '16px' },
  { label: '18pt', value: '18px' },
  { label: '20pt', value: '20px' },
  { label: '24pt', value: '24px' },
  { label: '28pt', value: '28px' },
  { label: '32pt', value: '32px' },
  { label: '36pt', value: '36px' }
];

const FONT_FAMILIES = [
  'Arial',
  'Times New Roman', 
  'Calibri',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Courier New',
  'Comic Sans MS'
];

const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
  '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
  '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC'
];

export const EnhancedEditor: React.FC<EnhancedEditorProps> = ({
  conteudo,
  onContentChange,
  formato,
  placeholders = [],
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('editor');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quillRef = useRef<ReactQuill>(null);
  const [currentFontSize, setCurrentFontSize] = useState('12px');
  const [currentFontFamily, setCurrentFontFamily] = useState('Arial');

  // Enhanced Quill configuration
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        [{ 'font': FONT_FAMILIES }],
        [{ 'size': FONT_SIZES.map(f => f.value) }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': COLORS }, { 'background': COLORS }],
        [{ 'script': 'sub'}, { 'script': 'super' }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['link', 'image', 'video'],
        ['blockquote', 'code-block'],
        ['clean']
      ]
    },
    history: {
      delay: 1000,
      maxStack: 100,
      userOnly: false
    }
  }), []);

  const quillFormats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'code-block'
  ];

  const insertPlaceholder = useCallback((placeholder: string) => {
    if (formato === 'html' && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        quill.insertText(range.index, placeholder + ' ');
        quill.setSelection(range.index + placeholder.length + 1);
      }
    } else {
      // For text mode
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newContent = conteudo.substring(0, start) + placeholder + ' ' + conteudo.substring(end);
        onContentChange(newContent);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + placeholder.length + 1, start + placeholder.length + 1);
        }, 0);
      }
    }
  }, [formato, conteudo, onContentChange]);

  const insertTable = useCallback(() => {
    if (quillRef.current) {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection();
      if (range) {
        const tableHTML = `
          <table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Cabeçalho 1</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Cabeçalho 2</th>
                <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Cabeçalho 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">Célula 1</td>
                <td style="border: 1px solid #ddd; padding: 12px;">Célula 2</td>
                <td style="border: 1px solid #ddd; padding: 12px;">Célula 3</td>
              </tr>
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px;">Célula 4</td>
                <td style="border: 1px solid #ddd; padding: 12px;">Célula 5</td>
                <td style="border: 1px solid #ddd; padding: 12px;">Célula 6</td>
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

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onContentChange, toast]);

  const exportToDocx = useCallback(() => {
    const blob = new Blob([conteudo], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `modelo_${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Arquivo exportado",
      description: "Modelo exportado como HTML.",
    });
  }, [conteudo, toast]);

  const detectedPlaceholders = useMemo(() => {
    const regex = /\{\{[^}]+\}\}/g;
    const matches = conteudo.match(regex) || [];
    return Array.from(new Set(matches));
  }, [conteudo]);

  const wordCount = useMemo(() => {
    const text = conteudo.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }, [conteudo]);

  const paragraphCount = useMemo(() => {
    const paragraphs = conteudo.split(/\n\s*\n|\<\/p\>|\<br\s*\/?\>/g).filter(p => p.trim());
    return paragraphs.length;
  }, [conteudo]);

  return (
    <div className="space-y-4">
      {/* Enhanced Toolbar */}
      <div className="border rounded-lg p-3 bg-muted/30">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Document Actions */}
          <div className="flex items-center gap-1 border-r pr-2">
            {onSave && (
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Save className="h-4 w-4" />
              </Button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={exportToDocx}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Format Options */}
          <div className="flex items-center gap-1 border-r pr-2">
            <Button variant="ghost" size="sm" onClick={insertTable}>
              <Table className="h-4 w-4" />
            </Button>
          </div>

          {/* Variables */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Variáveis
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 max-h-96 overflow-y-auto">
              {Object.entries(PLACEHOLDER_CATEGORIES).map(([key, category]) => (
                <div key={key}>
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.label}
                  </DropdownMenuLabel>
                  {category.placeholders.map((placeholder) => (
                    <DropdownMenuItem
                      key={placeholder}
                      onClick={() => insertPlaceholder(placeholder)}
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

          {/* Tab Selector */}
          <div className="ml-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Editor
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Visualizar
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              {formato === 'html' ? (
                <div className="border rounded-md overflow-hidden">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={conteudo}
                    onChange={onContentChange}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ minHeight: '500px' }}
                    placeholder="Digite o conteúdo do modelo aqui..."
                  />
                </div>
              ) : (
                <textarea
                  value={conteudo}
                  onChange={(e) => onContentChange(e.target.value)}
                  placeholder="Digite o conteúdo do modelo aqui..."
                  className="min-h-[500px] w-full p-4 border rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              )}
            </div>
            
            {/* Enhanced Sidebar */}
            <div className="space-y-4">
              {/* Variables Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Variáveis Detectadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-1">
                      {detectedPlaceholders.length > 0 ? (
                        detectedPlaceholders.map((placeholder) => (
                          <Badge 
                            key={placeholder} 
                            variant="secondary" 
                            className="text-xs font-mono block mb-1 w-full justify-start"
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

              {/* Stats Panel */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span>Caracteres:</span>
                    <Badge variant="outline">{conteudo.length}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Palavras:</span>
                    <Badge variant="outline">{wordCount}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Parágrafos:</span>
                    <Badge variant="outline">{paragraphCount}</Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Variáveis:</span>
                    <Badge variant="outline">{detectedPlaceholders.length}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={insertTable}
                  >
                    <Table className="h-4 w-4 mr-2" />
                    Inserir Tabela
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Arquivo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={exportToDocx}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar HTML
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Visualização do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[500px] border rounded-md p-6 bg-white shadow-sm">
                {formato === 'html' ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: sanitizeHTML(conteudo) }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap font-mono text-sm">
                    {conteudo}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};