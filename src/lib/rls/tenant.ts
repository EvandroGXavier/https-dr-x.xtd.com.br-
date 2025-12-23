/**
 * Helper para injeção segura de tenant_id em payloads
 * Garante que todas as operações de banco incluam o contexto correto
 */

export const withTenant = <T extends Record<string, any>>(
  tenantId: string,
  data: T
): T & { user_id: string } => ({
  user_id: tenantId,
  ...data,
});

/**
 * Extrai o tenant_id do contexto do usuário autenticado
 */
export const getCurrentTenantId = (userId?: string): string => {
  if (!userId) {
    throw new Error('User ID is required for tenant operations');
  }
  return userId;
};

/**
 * Valida se um payload tem as informações mínimas necessárias
 */
export const validateTenantPayload = (payload: any): boolean => {
  return payload && typeof payload === 'object' && payload.user_id;
};