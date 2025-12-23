import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, Tag } from "lucide-react";
import { useEtiquetas, useEtiquetaVinculos } from "@/hooks/useEtiquetas";
import { cn } from "@/lib/utils";

interface EtiquetaWithDetails {
  nome: string;
  cor: string;
  icone: string;
}

interface ItemEtiquetasInlineProps {
  itemId: string;
  itemType: 'contatos' | 'processos' | 'transacoes' | 'agendas' | 'patrimonio';
  itemTags: EtiquetaWithDetails[];
  onTagsChange?: () => void;
}

export function ItemEtiquetasInline({ itemId, itemType, itemTags, onTagsChange }: ItemEtiquetasInlineProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  
  const { etiquetas } = useEtiquetas(itemType);
  const { addEtiqueta, removeEtiqueta } = useEtiquetaVinculos(itemType, itemId);

  const handleAddTag = async (etiquetaId: string) => {
    try {
      await addEtiqueta.mutateAsync({
        etiquetaId: etiquetaId,
        referenciaId: itemId,
      });
      onTagsChange?.();
      setOpen(false);
      setSearchValue("");
    } catch (error) {
      console.error('Erro ao adicionar etiqueta:', error);
    }
  };

  const handleRemoveTag = async (tagName: string) => {
    try {
      const etiqueta = etiquetas.find(e => e.nome === tagName);
      if (etiqueta) {
        await removeEtiqueta.mutateAsync({
          etiquetaId: etiqueta.id,
          referenciaId: itemId,
        });
        onTagsChange?.();
      }
    } catch (error) {
      console.error('Erro ao remover etiqueta:', error);
    }
  };

  const availableEtiquetas = etiquetas.filter(e => 
    !itemTags.some(tag => tag.nome === e.nome) &&
    (searchValue === "" || e.nome.toLowerCase().includes(searchValue.toLowerCase()))
  );

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Etiquetas atribuídas */}
      {itemTags.map((tag, index) => (
        <Badge 
          key={index} 
          variant="outline" 
          className="text-xs group hover:bg-destructive hover:text-destructive-foreground transition-colors px-1.5 py-0.5 h-5"
          style={{ backgroundColor: `${tag.cor}15`, borderColor: tag.cor, color: tag.cor }}
        >
          <span className="mr-1 text-xs">{tag.icone}</span>
          <span className="text-xs">{tag.nome}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-3 w-3 p-0 ml-1 opacity-0 group-hover:opacity-100 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveTag(tag.nome);
            }}
            title={`Remover etiqueta ${tag.nome}`}
          >
            <X className="h-2 w-2" />
          </Button>
        </Badge>
      ))}

      {/* Botão para adicionar nova etiqueta */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
            title="Adicionar etiqueta"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Buscar etiquetas..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>Nenhuma etiqueta encontrada.</CommandEmpty>
              <CommandGroup>
                {availableEtiquetas.map((etiqueta) => (
                  <CommandItem
                    key={etiqueta.id}
                    onSelect={() => handleAddTag(etiqueta.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{etiqueta.icone}</span>
                      <div 
                        className="w-2 h-2 rounded-full border"
                        style={{ backgroundColor: etiqueta.cor }}
                      />
                      <span className="text-sm">{etiqueta.nome}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}