import { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TagChip } from "./TagChip";
import { useEtiquetas, useEtiquetaVinculos } from "@/hooks/useEtiquetas";
import { Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagSelectorProps {
  referenciaType: 'contatos' | 'processos' | 'agenda' | 'financeiro' | 'documentos' | 'patrimonio';
  referenciaId: string;
  className?: string;
}

export const TagSelector = ({ referenciaType, referenciaId, className }: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");
  const [newTagDescription, setNewTagDescription] = useState("");

  const { etiquetas, createEtiqueta } = useEtiquetas(referenciaType);
  const { vinculos, addEtiqueta, removeEtiqueta } = useEtiquetaVinculos(referenciaType, referenciaId);

  const vinculatedEtiquetas = vinculos.map(v => v.etiqueta).filter(Boolean);
  const availableEtiquetas = etiquetas.filter(
    e => !vinculatedEtiquetas.some(ve => ve?.id === e.id)
  );

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    await createEtiqueta.mutateAsync({
      nome: newTagName,
      cor: newTagColor,
      descricao: newTagDescription || undefined,
    });

    setNewTagName("");
    setNewTagColor("#6B7280");
    setNewTagDescription("");
    setShowCreateDialog(false);
  };

  const handleAddTag = async (etiquetaId: string) => {
    await addEtiqueta.mutateAsync({ etiquetaId, referenciaId });
    setOpen(false);
  };

  const handleRemoveTag = async (etiquetaId: string) => {
    await removeEtiqueta.mutateAsync({ etiquetaId, referenciaId });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 flex-wrap">
        {vinculatedEtiquetas.map((etiqueta) => 
          etiqueta && (
            <TagChip
              key={etiqueta.id}
              nome={etiqueta.nome}
              cor={etiqueta.cor}
              icone={etiqueta.icone || "🏷️"}
              onRemove={() => handleRemoveTag(etiqueta.id)}
            />
          )
        )}
        
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2">
              <Plus className="h-3 w-3 mr-1" />
              Etiqueta
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar etiquetas..." className="h-9" />
              <CommandList>
                <CommandEmpty>
                  <div className="text-center p-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Nenhuma etiqueta encontrada
                    </p>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Criar etiqueta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Criar nova etiqueta</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="tag-name">Nome *</Label>
                            <Input
                              id="tag-name"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="Nome da etiqueta"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tag-color">Cor</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="tag-color"
                                type="color"
                                value={newTagColor}
                                onChange={(e) => setNewTagColor(e.target.value)}
                                className="w-16 h-10"
                              />
                              <Badge
                                style={{
                                  backgroundColor: `${newTagColor}20`,
                                  borderColor: newTagColor,
                                  color: newTagColor,
                                }}
                              >
                                {newTagName || "Prévia"}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="tag-description">Descrição</Label>
                            <Input
                              id="tag-description"
                              value={newTagDescription}
                              onChange={(e) => setNewTagDescription(e.target.value)}
                              placeholder="Descrição opcional"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setShowCreateDialog(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={handleCreateTag}
                              disabled={!newTagName.trim()}
                            >
                              Criar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {availableEtiquetas.map((etiqueta) => (
                    <CommandItem
                      key={etiqueta.id}
                      onSelect={() => handleAddTag(etiqueta.id)}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm mr-1">{etiqueta.icone || "🏷️"}</span>
                      <span>{etiqueta.nome}</span>
                      {etiqueta.descricao && (
                        <span className="text-xs text-muted-foreground">
                          - {etiqueta.descricao}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};