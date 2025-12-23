import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AjudaSidebar } from '@/components/ajuda/AjudaSidebar';
import { AjudaContent } from '@/components/ajuda/AjudaContent';
import { AjudaSearch } from '@/components/ajuda/AjudaSearch';
import { useAjuda } from '@/hooks/useAjuda';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Ajuda() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const {
    conteudoAjuda,
    topicosFiltrados,
    searchTerm,
    setSearchTerm,
    activeCategory,
    setActiveCategory,
    findTopicoByAlias,
    navigateToTopic,
    isLoading,
    isCustomContent
  } = useAjuda();

  const [initialTopicProcessed, setInitialTopicProcessed] = useState(false);

  // Processar parâmetro topic da URL
  useEffect(() => {
    const topic = searchParams.get('topic');
    if (!topic || initialTopicProcessed || isLoading) return;

    const result = findTopicoByAlias(topic);
    
    if (result) {
      // Encontrou tópico específico
      navigateToTopic(result.categoria, result.topico.slug);
      toast({
        title: "Tópico encontrado",
        description: `Navegando para: ${result.topico.titulo}`,
      });
    } else {
      // Não encontrou - pré-preencher busca
      const searchFromTopic = topic.replace(/^\//, '').replace(/\//g, ' ');
      setSearchTerm(searchFromTopic);
      
      toast({
        title: "Busca iniciada",
        description: `Buscando por: ${searchFromTopic}`,
        variant: "default",
      });
    }
    
    setInitialTopicProcessed(true);
  }, [searchParams, findTopicoByAlias, navigateToTopic, setSearchTerm, toast, initialTopicProcessed, isLoading]);

  // Limpar busca com ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchTerm) {
        setSearchTerm('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, setSearchTerm]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando ajuda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 max-w-2xl">
              <AjudaSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Buscar tópicos, palavras-chave..."
              />
            </div>

            {isCustomContent && (
              <div className="text-xs text-muted-foreground hidden md:block">
                Conteúdo personalizado
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        <AjudaSidebar
          categorias={topicosFiltrados}
          activeCategory={activeCategory}
          onSelectTopic={navigateToTopic}
          onSelectCategory={setActiveCategory}
        />
        
        <AjudaContent
          categorias={topicosFiltrados}
          searchTerm={searchTerm}
          versao={conteudoAjuda.versao}
          atualizadoEm={conteudoAjuda.atualizado_em}
        />
      </div>
    </div>
  );
}