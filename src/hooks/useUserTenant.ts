import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserTenantData {
  tenantId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useUserTenant(): UserTenantData & { empresaId: string | null; filialId: string | null } {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [filialId, setFilialId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserTenant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuário não autenticado');
          setIsLoading(false);
          return;
        }

        console.log('🔍 Loading user tenant data for user:', user.id);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('empresa_id, filial_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('❌ Error loading user profile:', profileError);
          setError('Erro ao carregar perfil do usuário');
          setIsLoading(false);
          return;
        }

        if (!profile?.empresa_id) {
          console.error('❌ User has no tenant assigned:', user.id);
          setError('Usuário não possui empresa atribuída');
          setIsLoading(false);
          return;
        }

        console.log('✅ User tenant loaded:', profile.empresa_id);
        setTenantId(profile.empresa_id);
        setEmpresaId(profile.empresa_id);
        setFilialId(profile.filial_id || null);
        setError(null);
      } catch (err) {
        console.error('❌ Error loading user tenant:', err);
        setError('Erro ao carregar dados do usuário');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserTenant();
  }, []);

  return {
    tenantId,
    empresaId,
    filialId,
    isLoading,
    error
  };
}