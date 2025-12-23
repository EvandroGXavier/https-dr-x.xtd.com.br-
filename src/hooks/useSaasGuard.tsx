import { useAuth } from './useAuth';
import { useSystemInfo } from './useSystemInfo';

export const useSaasGuard = () => {
  const { profile } = useAuth();
  const { systemInfo } = useSystemInfo();

  const hasRequiredData = systemInfo.usuario && 
                         profile?.empresa_id && 
                         profile?.filial_id;

  const isSaasConfigured = Boolean(hasRequiredData);

  return {
    isSaasConfigured,
    blockActions: !isSaasConfigured
  };
};