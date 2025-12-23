import { useAuth } from './useAuth';

// Hook simplificado para tags genéricas
export const useDefaultTags = () => {
  const { user } = useAuth();
  
  return {
    user
  };
};