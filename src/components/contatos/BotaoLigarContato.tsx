import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTelefoniaSIP } from '@/hooks/useTelefoniaSIP';
import { toast } from '@/hooks/use-toast';

interface BotaoLigarContatoProps {
  numero: string;
  contatoId: string;
  nomeContato?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const BotaoLigarContato = ({ 
  numero, 
  contatoId, 
  nomeContato,
  variant = 'outline',
  size = 'sm'
}: BotaoLigarContatoProps) => {
  const { ligarParaNumero, sipState } = useTelefoniaSIP();

  const handleLigar = () => {
    if (sipState.status !== 'registered' && sipState.status !== 'connected') {
      toast({
        title: "PABX não conectado",
        description: "Acesse a página de Telefonia para conectar ao ramal SIP",
        variant: "destructive"
      });
      return;
    }

    if (!numero) {
      toast({
        title: "Número não disponível",
        description: "Este contato não possui número de telefone cadastrado",
        variant: "destructive"
      });
      return;
    }

    ligarParaNumero(numero, contatoId);
    toast({
      title: "Ligando...",
      description: `Chamando ${nomeContato || numero}`,
    });
  };

  if (!numero) return null;

  return (
    <Button 
      onClick={handleLigar} 
      variant={variant} 
      size={size}
      title={`Ligar para ${nomeContato || numero}`}
    >
      <Phone className="h-4 w-4 mr-1" />
      {size !== 'icon' && 'Ligar'}
    </Button>
  );
};
