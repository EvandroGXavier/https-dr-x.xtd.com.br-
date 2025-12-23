import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Clock } from 'lucide-react';
import { AjudaCategoria } from '@/hooks/useAjuda';
import ReactMarkdown from 'react-markdown';

interface AjudaContentProps {
  categorias: AjudaCategoria[];
  searchTerm: string;
  versao: string;
  atualizadoEm: string;
}

export const AjudaContent = ({ categorias, searchTerm, versao, atualizadoEm }: AjudaContentProps) => {
  const highlightText = (text: string) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (categorias.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <p className="text-lg mb-2">Nenhum resultado encontrado</p>
            <p className="text-sm">
              Tente ajustar sua busca ou navegue pelas categorias no menu lateral.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header com informações da versão */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Central de Ajuda</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>v{versao}</span>
              <span>•</span>
              <span>Atualizado em {new Date(atualizadoEm).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          {searchTerm && (
            <p className="text-muted-foreground">
              Resultados para: <strong>{highlightText(searchTerm)}</strong>
            </p>
          )}
        </div>

        {/* Conteúdo das categorias */}
        <div className="space-y-8">
          {categorias.map((categoria) => (
            <div key={categoria.id} className="space-y-4">
              <h2 className="text-2xl font-semibold border-b pb-2">
                {highlightText(categoria.titulo)}
              </h2>
              
              <div className="grid gap-4">
                {categoria.topicos.map((topico) => (
                  <Card key={topico.slug} id={topico.slug} className="scroll-mt-6">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">
                            {highlightText(topico.titulo)}
                          </CardTitle>
                          <CardDescription>
                            {highlightText(topico.sumario)}
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {topico.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {topico.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {highlightText(tag)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Passos */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Como fazer:
                        </h4>
                        <ol className="space-y-2">
                          {topico.passos_markdown.map((passo, index) => (
                            <li key={index} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm flex items-center justify-center font-medium">
                                {index + 1}
                              </span>
                              <div className="flex-1 prose prose-sm max-w-none">
                                <ReactMarkdown 
                                  components={{
                                    p: ({ children }) => <span>{children}</span>,
                                    strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>
                                  }}
                                >
                                  {passo}
                                </ReactMarkdown>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                      
                      {/* Links relacionados */}
                      {topico.links_relacionados && topico.links_relacionados.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                            Links úteis:
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {topico.links_relacionados.map((link, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                asChild
                                className="h-8"
                              >
                                <a 
                                  href={link.href} 
                                  target={link.href.startsWith('http') ? '_blank' : '_self'}
                                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                                  className="flex items-center gap-1"
                                >
                                  <span>{link.label}</span>
                                  {link.href.startsWith('http') && (
                                    <ExternalLink className="h-3 w-3" />
                                  )}
                                </a>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};