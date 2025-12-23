import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SystemInfo {
  empresa: {
    uuid: string | null;
    nome: string | null;
  };
  filial: {
    uuid: string | null;
    nome: string | null;
  };
  usuario: {
    id: string;
    nome: string;
  } | null;
  tenant: string | null;
}

export const useSystemInfo = () => {
  const { user, profile } = useAuth();
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    empresa: { uuid: null, nome: null },
    filial: { uuid: null, nome: null },
    usuario: null,
    tenant: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSystemInfo = async () => {
      try {
        if (user && profile) {
          const userName = user.email?.split('@')[0] || 'Usuário';

          // Buscar nome da empresa
          let empresaNome = null;
          if (profile.empresa_id) {
            const { data: empresaData } = await supabase
              .from('saas_empresas')
              .select('nome')
              .eq('empresa_id', profile.empresa_id)
              .maybeSingle();
            
            empresaNome = empresaData?.nome || null;
          }

          // Buscar nome da filial
          let filialNome = null;
          if (profile.filial_id) {
            const { data: filialData } = await supabase
              .from('saas_filiais')
              .select('nome')
              .eq('filial_id', profile.filial_id)
              .maybeSingle();
            
            filialNome = filialData?.nome || null;
          }

          setSystemInfo({
            empresa: {
              uuid: profile.empresa_id || null,
              nome: empresaNome
            },
            filial: {
              uuid: profile.filial_id || null,
              nome: filialNome
            },
            usuario: {
              id: user.id,
              nome: userName
            },
            tenant: profile.empresa_id || null
          });
        }
      } catch (error) {
        console.error('Erro ao carregar informações do sistema:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSystemInfo();
  }, [user, profile]);

  return { systemInfo, loading };
};