import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Eye, Code, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sanitizeHTML } from '@/lib/sanitizeHTML';

interface ModeloEditorProps {
  conteudo: string;
  onContentChange: (content: string) => void;
  formato: string;
  placeholders?: string[];
}

const PLACEHOLDER_CATEGORIES = {
  contato: {
    label: 'Contato',
    placeholders: [
      '{{contato.nome}}',
      '{{contato.cpf_cnpj}}',
      '{{contato.rg}}',
      '{{contato.email}}',
      '{{contato.celular}}',
      '{{contato.endereco_completo}}',
      '{{contato.cidade}}',
      '{{contato.estado}}',
      '{{contato.nome_mae}}',
      '{{contato.estado_civil}}',
      '{{contato.profissao}}',
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
      '{{processo.advogado_responsavel}}',
      '{{processo.valor_causa}}',
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
    ]
  }
};

export const ModeloEditor: React.FC<ModeloEditorProps> = ({
  conteudo,
  onContentChange,
  formato,
  placeholders = []
}) => {
  const [activeTab, setActiveTab] = useState('editor');

  const insertPlaceholder = (placeholder: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = conteudo.substring(0, start) + placeholder + conteudo.substring(end);
      onContentChange(newContent);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const renderPreview = () => {
    if (formato === 'html') {
      return (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(conteudo) }}
        />
      );
    }
    
    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {conteudo}
      </div>
    );
  };

  const detectedPlaceholders = useMemo(() => {
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
              Preview
            </TabsTrigger>
          </TabsList>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Inserir Variável
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              {Object.entries(PLACEHOLDER_CATEGORIES).map(([key, category]) => (
                <div key={key}>
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    {category.label}
                  </div>
                  {category.placeholders.map((placeholder) => (
                    <DropdownMenuItem
                      key={placeholder}
                      onClick={() => insertPlaceholder(placeholder)}
                      className="font-mono text-xs"
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

        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <Textarea
                value={conteudo}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Digite o conteúdo do modelo aqui..."
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Variáveis Detectadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="space-y-1">
                      {detectedPlaceholders.length > 0 ? (
                        detectedPlaceholders.map((placeholder) => (
                          <Badge 
                            key={placeholder} 
                            variant="secondary" 
                            className="text-xs font-mono"
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
                Preview do Documento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="min-h-[400px] border rounded-md p-4 bg-background">
                {renderPreview()}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};