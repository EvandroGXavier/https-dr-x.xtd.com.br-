import { useAuth } from '@/hooks/useAuth';

/**
 * Hook utilitário para obter IDs de tenant de forma consistente
 * 
 * REGRA FUNDAMENTAL:
 * - tenant_id SEMPRE deve ser empresa_id
 * - user_id é mantido separadamente para auditoria
 * - NUNCA use auth.uid() diretamente como tenant_id
 */
export function useTenantId() {
  const { profile } = useAuth();
  
  return {
    tenantId: profile?.empresa_id,
    empresaId: profile?.empresa_id,
    filialId: profile?.filial_id,
  };
}
