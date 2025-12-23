import { useState, useCallback } from 'react';
import { consultarCep, ViaCepResponse } from '@/lib/viacep';
import { useToast } from '@/hooks/use-toast';

export interface CepLookupResult {
  loading: boolean;
  error: string | null;
  data: ViaCepResponse | null;
  lookup: (cep: string) => Promise<ViaCepResponse | null>;
  clear: () => void;
}

export function useCepLookup(): CepLookupResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ViaCepResponse | null>(null);
  const { toast } = useToast();

  const lookup = useCallback(async (cep: string): Promise<ViaCepResponse | null> => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await consultarCep(cep);
      setData(result);
      
      toast({
        title: "CEP encontrado",
        description: `${result.logradouro}, ${result.bairro} - ${result.localidade}/${result.uf}`,
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao consultar CEP';
      setError(errorMessage);
      
      toast({
        title: "Erro ao consultar CEP",
        description: errorMessage,
        variant: "destructive",
      });
      
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