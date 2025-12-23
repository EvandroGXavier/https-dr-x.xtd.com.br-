import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, X, Tag } from 'lucide-react';
import { useEtiquetas } from '@/hooks/useEtiquetas';
import { TagChip } from '@/components/etiquetas/TagChip';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TagManagementProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export const TagManagement: React.FC<TagManagementProps> = ({
  selectedTags,
  onTagsChange,
  disabled = false
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { etiquetas, isLoading, createEtiqueta } = useEtiquetas();
  const { toast } = useToast();

  // Filtrar etiquetas ativas
  const availableTags = etiquetas.filter(tag => 
    tag.ativa && 
    tag.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTagsData = etiquetas.filter(tag => selectedTags.includes(tag.id));

  const handleTagSelect = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
    setOpen(false);
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  const handleCreateNewTag = async (nome: string) => {
    try {
      const newTag = await createEtiqueta.mutateAsync({
        nome,
        cor: '#6B7280',
        icone: '🏷️',
        descricao: `Etiqueta - ${nome}`,
      });
      
      if (newTag) {
        onTagsChange([...selectedTags, newTag.id]);
        toast({
          title: "Etiqueta criada",
          description: `A etiqueta "${nome}" foi criada com sucesso!`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a etiqueta.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>Etiquetas</Label>
      
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md bg-background">
        {selectedTagsData.map((tag) => (
          <TagChip
            key={tag.id}
            nome={tag.nome}
            cor={tag.cor}
            icone={tag.icone}
            size="sm"
            onRemove={disabled ? undefined : () => handleTagRemove(tag.id)}
          />
        ))}
        
        {selectedTagsData.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Nenhuma etiqueta selecionada
          </span>
        )}
      </div>

      {/* Add Tags Button */}
      {!disabled && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Etiquetas
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <Command>
              <CommandInput 
                placeholder="Buscar ou criar etiqueta..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Nenhuma etiqueta encontrada
                    </p>
                    {searchTerm && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateNewTag(searchTerm)}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar "{searchTerm}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {availableTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => handleTagSelect(tag.id)}
                      disabled={selectedTags.includes(tag.id)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm">{tag.icone}</span>
                      <span>{tag.nome}</span>
                      {selectedTags.includes(tag.id) && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};