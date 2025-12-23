import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { AjudaCategoria } from '@/hooks/useAjuda';

interface AjudaSidebarProps {
  categorias: AjudaCategoria[];
  activeCategory: string | null;
  onSelectTopic: (categoryId: string, topicSlug: string) => void;
  onSelectCategory: (categoryId: string) => void;
}

export const AjudaSidebar = ({ 
  categorias, 
  activeCategory, 
  onSelectTopic, 
  onSelectCategory 
}: AjudaSidebarProps) => {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(activeCategory ? [activeCategory] : [])
  );

  const toggleCategory = (categoryId: string) => {
    const newOpenCategories = new Set(openCategories);
    if (newOpenCategories.has(categoryId)) {
      newOpenCategories.delete(categoryId);
    } else {
      newOpenCategories.add(categoryId);
    }
    setOpenCategories(newOpenCategories);
    onSelectCategory(categoryId);
  };

  const handleTopicClick = (categoryId: string, topicSlug: string) => {
    // Garantir que a categoria esteja aberta
    setOpenCategories(prev => new Set([...prev, categoryId]));
    onSelectTopic(categoryId, topicSlug);
  };

  return (
    <div className="w-80 border-r bg-muted/50 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg">Ajuda do Sistema</h2>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {categorias.map((categoria) => (
            <Collapsible
              key={categoria.id}
              open={openCategories.has(categoria.id)}
              onOpenChange={() => toggleCategory(categoria.id)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2 mb-1 ${
                    activeCategory === categoria.id ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  {openCategories.has(categoria.id) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <span className="font-medium">{categoria.titulo}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {categoria.topicos.length}
                  </span>
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pl-6 space-y-1 mb-2">
                {categoria.topicos.map((topico) => (
                  <Button
                    key={topico.slug}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => handleTopicClick(categoria.id, topico.slug)}
                  >
                    {topico.titulo}
                  </Button>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
          
          {categorias.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum tópico encontrado</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};