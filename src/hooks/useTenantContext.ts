import { useEffect, useState, useCallback } from 'react';
import { setServerContext, clearServerContext } from '@/lib/supabase/rpc';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenantContext {
  empresaId: string | null; // UUID
  filialId: string | null; // UUID
}

interface TenantContextHook extends TenantContext {
  selectContext: (empresaId: string, filialId?: string) => Promise<void>;
  clearContext: () => Promise<void>;
  isContextSet: boolean;
}

const STORAGE_KEY = 'saasContext';

export function useTenantContext(): TenantContextHook {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [filialId, setFilialId] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar contexto do localStorage ao inicializar
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const { empresaId: cachedEmpresa, filialId: cachedFilial } = JSON.parse(cached);
        setEmpresaId(cachedEmpresa);
        setFilialId(cachedFilial);
        
        // Aplicar contexto no servidor
        if (cachedEmpresa) {
          setServerContext(supabase, cachedEmpresa, cachedFilial || undefined)
            .catch(error => {
              console.error('Erro ao restaurar contexto:', error);
              // Se falhou, limpar o cache
              localStorage.removeItem(STORAGE_KEY);
              setEmpresaId(null);
              setFilialId(null);
            });
        }
      } catch (error) {
        console.error('Erro ao carregar contexto do cache:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const selectContext = useCallback(async (nextEmpresa: string, nextFilial?: string) => {
    try {
      await setServerContext(supabase, nextEmpresa, nextFilial);
      
      const newContext = { 
        empresaId: nextEmpresa, 
        filialId: nextFilial ?? null 
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newContext));
      setEmpresaId(nextEmpresa);
      setFilialId(nextFilial ?? null);
      
      toast({
        title: "Contexto alterado",
        description: "Empresa/filial selecionada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao definir contexto:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar contexto. Verifique suas permissões.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const clearContext = useCallback(async () => {
    try {
      await clearServerContext(supabase);
      localStorage.removeItem(STORAGE_KEY);
      setEmpresaId(null);
      setFilialId(null);
      
      toast({
        title: "Contexto limpo",
        description: "Contexto de empresa/filial removido",
      });
    } catch (error) {
      console.error('Erro ao limpar contexto:', error);
      toast({
        title: "Erro",
        description: "Falha ao limpar contexto",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    empresaId,
    filialId,
    selectContext,
    clearContext,
    isContextSet: empresaId !== null,
  };
}