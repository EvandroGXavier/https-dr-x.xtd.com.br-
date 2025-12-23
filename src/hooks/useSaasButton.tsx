import { useState, useEffect, startTransition } from 'react';
import { useAuth } from './useAuth';
import { FEATURES } from "@/config/features";

export const useSaasButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    console.log('🎹 SaaS Button - verificando condições:', {
      email: user?.email,
      targetEmail: 'evandro@conectionmg.com.br',
      featureOn: FEATURES.SAAS_V1,
      isMatch: user?.email === 'evandro@conectionmg.com.br'
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      // CTRL + ALT + F8
      if (event.ctrlKey && event.altKey && event.key === 'F8') {
        event.preventDefault();
        
        console.log('🔑 Hotkey SaaS detectada! Verificando acesso...');
        
        // Verificar se o email é autorizado e feature ativa
        const featureOn = FEATURES.SAAS_V1 === true;
        const isAuthorizedEmail = user?.email === 'evandro@conectionmg.com.br';
        
        console.log('📊 Verificação de acesso:', {
          featureOn,
          isAuthorizedEmail,
          canShow: featureOn && isAuthorizedEmail
        });
        
        if (featureOn && isAuthorizedEmail) {
          startTransition(() => {
            setIsVisible(prev => {
              const newValue = !prev;
              console.log('👁️ Alternando visibilidade do botão SaaS:', newValue);
              return newValue;
            });
          });
        } else {
          console.log('❌ Acesso negado ao botão SaaS');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user?.email]);

  return { isVisible };
};