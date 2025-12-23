import { useAuth } from './useAuth';
import { FEATURES } from "@/config/features";
import { useSaasData } from '@/components/admin/saas/hooks/useSaasData';

export const useSaasAccess = () => {
  const { user } = useAuth();
  const { isSuperAdmin } = useSaasData();
  
  const featureOn = FEATURES.SAAS_V1 === true;
  const isAuthorizedEmail = user?.email === 'evandro@conectionmg.com.br';
  const hasAccess = featureOn && isSuperAdmin && isAuthorizedEmail;

  return {
    hasAccess,
    featureOn,
    isSuperAdmin,
    isAuthorizedEmail
  };
};