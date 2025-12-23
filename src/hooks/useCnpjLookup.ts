import { useState, useCallback } from 'react';
import { consultarCNPJ, DadosEmpresa } from '@/lib/cnpj';
import { useToast } from '@/hooks/use-toast';

export interface CnpjLookupResult {
  loading: boolean;
  error: string | null;
  data: DadosEmpresa | null;
  lookup: (cnpj: string) => Promise<DadosEmpresa | null>;
  clear: () => void;
}

export function useCnpjLookup(): CnpjLookupResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DadosEmpresa | null>(null);
  const { toast } = useToast();

  const lookup = useCallback(async (cnpj: string): Promise<DadosEmpresa | null> => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (!cnpjLimpo || cnpjLimpo.length !== 14) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await consultarCNPJ(cnpjLimpo);
      setData(result);
      
      toast({
        title: "CNPJ encontrado",
        description: `${result.nome_fantasia || result.nome}`,
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao consultar CNPJ';
      setError(errorMessage);
      
      // Fallback silencioso - não mostra toast de erro para permitir preenchimento manual
      console.warn('Erro na consulta CNPJ:', errorMessage);
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clear = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    lookup,
    clear,
  };
}