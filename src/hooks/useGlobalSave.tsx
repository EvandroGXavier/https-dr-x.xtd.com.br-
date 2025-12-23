import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SaveContext {
  onSave: () => Promise<void> | void;
  isDirty?: boolean;
}

const saveContexts = new Map<string, SaveContext>();

export const useGlobalSave = (id: string, context: SaveContext) => {
  const { toast } = useToast();

  useEffect(() => {
    saveContexts.set(id, context);
    return () => {
      saveContexts.delete(id);
    };
  }, [id, context]);

  const handleGlobalSave = useCallback(async (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      event.stopPropagation();

      // Find the active save context
      const activeContext = Array.from(saveContexts.values()).find(ctx => ctx.isDirty !== false);
      
      if (activeContext) {
        try {
          await activeContext.onSave();
          toast({
            title: "Salvo com sucesso",
            description: "As alterações foram salvas.",
          });
        } catch (error) {
          console.error('Erro ao salvar:', error);
          toast({
            title: "Erro ao salvar",
            description: "Ocorreu um erro ao salvar as alterações.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Nada para salvar",
          description: "Não há alterações pendentes.",
        });
      }
    }
  }, [toast]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalSave);
    return () => {
      document.removeEventListener('keydown', handleGlobalSave);
    };
  }, [handleGlobalSave]);

  return {
    triggerSave: async () => {
      try {
        await context.onSave();
        toast({
          title: "Salvo com sucesso",
          description: "As alterações foram salvas.",
        });
      } catch (error) {
        console.error('Erro ao salvar:', error);
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao salvar as alterações.",
          variant: "destructive",
        });
      }
    }
  };
};