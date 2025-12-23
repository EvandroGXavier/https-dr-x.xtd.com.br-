import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from "@/components/ui/command";
import { X, Filter, Search, ChevronDown } from "lucide-react";
import { useEtiquetas } from "@/hooks/useEtiquetas";

interface TagFilter {
  type: 'equal' | 'not_equal';
  values: string[];
}

interface TagFilterProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  comTags?: string[];
  semTags?: string[];
  onComTagsChange?: (tags: string[]) => void;
  onSemTagsChange?: (tags: string[]) => void;
  ownerType?: string;
}

export const TagFilter = ({ 
  value, 
  onChange, 
  placeholder = "", 
  className,
  comTags = [],
  semTags = [],
  onComTagsChange,
  onSemTagsChange,
  ownerType
}: TagFilterProps) => {
  const [isComOpen, setIsComOpen] = useState(false);
  const [isSemOpen, setIsSemOpen] = useState(false);
  const [comSearch, setComSearch] = useState("");
  const [semSearch, setSemSearch] = useState("");
  const { etiquetas } = useEtiquetas(ownerType);

  const toggleComTag = (tagName: string) => {
    if (comTags.includes(tagName)) {
      onComTagsChange?.(comTags.filter(t => t !== tagName));
    } else {
      onComTagsChange?.([...comTags, tagName]);
    }
  };

  const toggleSemTag = (tagName: string) => {
    if (semTags.includes(tagName)) {
      onSemTagsChange?.(semTags.filter(t => t !== tagName));
    } else {
      onSemTagsChange?.([...semTags, tagName]);
    }
  };

  const removeComTag = (tag: string) => {
    onComTagsChange?.(comTags.filter(t => t !== tag));
  };

  const removeSemTag = (tag: string) => {
    onSemTagsChange?.(semTags.filter(t => t !== tag));
  };

  const filteredComEtiquetas = etiquetas.filter(etiqueta => 
    etiqueta.nome.toLowerCase().includes(comSearch.toLowerCase())
  );

  const filteredSemEtiquetas = etiquetas.filter(etiqueta => 
    etiqueta.nome.toLowerCase().includes(semSearch.toLowerCase())
  );

  const handleSearch = () => {
    // Busca é automática através dos filtros
  };

  return (
    <div className={className}>
      {/* Seletores de Etiquetas COM e SEM */}
      {onComTagsChange && onSemTagsChange && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tags COM */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-success whitespace-nowrap">Etiquetas COM</Label>
              <Popover open={isComOpen} onOpenChange={setIsComOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Selecionar <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <CommandInput 
                        placeholder="Buscar etiquetas..." 
                        value={comSearch}
                        onValueChange={setComSearch}
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <CommandList className="max-h-48">
                      <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
                      {filteredComEtiquetas.map((etiqueta) => (
                        <CommandItem
                          key={etiqueta.id}
                          onSelect={() => toggleComTag(etiqueta.nome)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox 
                            checked={comTags.includes(etiqueta.nome)}
                            onChange={() => {}}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: etiqueta.cor }}
                          />
                          <span>{etiqueta.nome}</span>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Tags SEM */}
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-destructive whitespace-nowrap">Etiquetas SEM</Label>
              <Popover open={isSemOpen} onOpenChange={setIsSemOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    Selecionar <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <CommandInput 
                        placeholder="Buscar etiquetas..." 
                        value={semSearch}
                        onValueChange={setSemSearch}
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <CommandList className="max-h-48">
                      <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
                      {filteredSemEtiquetas.map((etiqueta) => (
                        <CommandItem
                          key={etiqueta.id}
                          onSelect={() => toggleSemTag(etiqueta.nome)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox 
                            checked={semTags.includes(etiqueta.nome)}
                            onChange={() => {}}
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: etiqueta.cor }}
                          />
                          <span>{etiqueta.nome}</span>
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Botão Buscar */}
            <Button 
              onClick={handleSearch} 
              size="sm" 
              className="h-8"
              disabled={comTags.length === 0 && semTags.length === 0}
            >
              <Search className="h-4 w-4 mr-1" />
              Buscar
            </Button>
          </div>

          {/* Exibir etiquetas selecionadas */}
          {(comTags.length > 0 || semTags.length > 0) && (
            <div className="space-y-2">
              {comTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-success font-medium">COM:</span>
                  {comTags.map((tag) => (
                    <Badge key={tag} variant="default" className="bg-success text-success-foreground text-xs h-6">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                        onClick={() => removeComTag(tag)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              {semTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-destructive font-medium">SEM:</span>
                  {semTags.map((tag) => (
                    <Badge key={tag} variant="destructive" className="text-xs h-6">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1 hover:bg-transparent"
                        onClick={() => removeSemTag(tag)}
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};