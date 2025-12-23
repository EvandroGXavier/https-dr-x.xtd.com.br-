import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook seguro para verificar roles via RPC
 * 
 * @param role - Nome do papel a verificar (admin, advogado, etc.)
 * @param empresaUuid - UUID da empresa (opcional para verificação de contexto)
 * @param filialUuid - UUID da filial (opcional para verificação de contexto)
 * @returns { hasRole: boolean, loading: boolean, error: string | null }
 * 
 * @example
 * const { hasRole: isAdmin } = useHasRole('admin');
 * if (isAdmin) {
 *   // renderizar componente admin
 * }
 */
export function useHasRole(
  role: string,
  empresaUuid?: string | null,
  filialUuid?: string | null
) {
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkRole() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase.rpc('has_role', {
          _role: role as 'admin' | 'user',
        });

        if (rpcError) {
          console.error('Erro ao verificar papel:', rpcError);
          setError(rpcError.message);
          setHasRole(false);
        } else {
          setHasRole(Boolean(data));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
        console.error('Erro ao verificar papel:', err);
        setError(errorMessage);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    }

    checkRole();
  }, [role, empresaUuid, filialUuid]);

  return { hasRole, loading, error };
}
