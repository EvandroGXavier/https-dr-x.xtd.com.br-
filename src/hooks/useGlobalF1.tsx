import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const useGlobalF1 = () => {
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // F1 key
      if (event.key === 'F1') {
        event.preventDefault();
        event.stopPropagation();
        
        const currentRoute = location.pathname + location.search;
        const helpUrl = `/ajuda?topic=${encodeURIComponent(currentRoute)}`;
        
        // Abrir em nova aba
        window.open(helpUrl, '_blank', 'noopener,noreferrer');
        
        // Mostrar toast confirmando
        toast({
          title: "Ajuda aberta",
          description: `Ajuda contextual para: ${currentRoute}`,
        });
      }
    };

    // Adicionar listener global
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [location, toast]);

  // Função para abrir ajuda programaticamente
  const openHelp = (topic?: string) => {
    const currentRoute = topic || (location.pathname + location.search);
    const helpUrl = `/ajuda?topic=${encodeURIComponent(currentRoute)}`;
    window.open(helpUrl, '_blank', 'noopener,noreferrer');
  };

  return { openHelp };
};