import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tag, Plus, X } from "lucide-react";
import { useEtiquetas } from "@/hooks/useEtiquetas";
import { TagSelector } from "@/components/etiquetas/TagSelector";
import { TagChip } from "@/components/etiquetas/TagChip";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProcessoEtiquetasProps {
  processoId: string;
}

export function ProcessoEtiquetas({ processoId }: ProcessoEtiquetasProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { etiquetas: allEtiquetas } = useEtiquetas();
  const queryClient = useQueryClient();

  // Fetch process tags
  const { data: processEtiquetas, isLoading } = useQuery({
    queryKey: ["processo-etiquetas", processoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etiqueta_vinculos")
        .select(`
          id,
          etiqueta_id,
          etiquetas!inner (
            id,
            nome,
            cor,
            icone,
            slug
          )
        `)
        .eq("referencia_id", processoId)
        .eq("referencia_tipo", "processo");

      if (error) throw error;
      return data;
    },
    enabled: !!processoId,
  });

  // Add tag to process
  const addEtiqueta = useMutation({
    mutationFn: async (etiquetaId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("etiqueta_vinculos")
        .insert({
          referencia_id: processoId,
          referencia_tipo: "processo",
          etiqueta_id: etiquetaId,
          user_id: user?.id || "",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-etiquetas", processoId] });
      toast.success("Etiqueta adicionada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar etiqueta");
    },
  });

  // Remove tag from process
  const removeEtiqueta = useMutation({
    mutationFn: async (vinculoId: string) => {
      const { error } = await supabase
        .from("etiqueta_vinculos")
        .delete()
        .eq("id", vinculoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processo-etiquetas", processoId] });
      toast.success("Etiqueta removida com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao remover etiqueta");
    },
  });

  const handleAddEtiqueta = async (etiquetaId: string) => {
    // Check if tag is already added
    const isAlreadyAdded = processEtiquetas?.some(
      pe => pe.etiquetas.id === etiquetaId
    );

    if (isAlreadyAdded) {
      toast.error("Esta etiqueta já está associada ao processo");
      return;
    }

    await addEtiqueta.mutateAsync(etiquetaId);
    setIsDialogOpen(false);
  };

  const handleRemoveEtiqueta = async (vinculoId: string) => {
    await removeEtiqueta.mutateAsync(vinculoId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Etiquetas do Processo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Etiquetas do Processo
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Etiqueta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Etiqueta ao Processo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Selecione uma etiqueta para associar ao processo:
                </p>
                <TagSelector
                  referenciaType="processos"
                  referenciaId={processoId}
                />
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {processEtiquetas?.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhuma etiqueta associada a este processo.
            </p>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Primeira Etiqueta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {processEtiquetas?.map((processoEtiqueta) => (
                <div key={processoEtiqueta.id} className="flex items-center gap-1">
                  <TagChip
                    nome={processoEtiqueta.etiquetas.nome}
                    cor={processoEtiqueta.etiquetas.cor}
                    icone={processoEtiqueta.etiquetas.icone}
                    onRemove={() => handleRemoveEtiqueta(processoEtiqueta.id)}
                  />
                </div>
              ))}
            </div>
            
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Filtros e Buscas</h4>
              <p className="text-xs text-muted-foreground">
                Use as etiquetas para filtrar e categorizar seus processos. 
                Cada etiqueta pode ser usada em múltiplos processos e facilita 
                a organização e busca.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}