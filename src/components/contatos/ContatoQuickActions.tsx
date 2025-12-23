import { Phone, Mail, MessageSquare, MapPin, Calendar, Gavel, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface ContatoQuickActionsProps {
  contato: {
    id: string;
    celular?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
  };
  showLinks?: boolean;
}

export function ContatoQuickActions({ contato, showLinks = true }: ContatoQuickActionsProps) {
  const whatsappNumber = contato.celular?.replace(/\D/g, '');
  const phoneNumber = contato.telefone || contato.celular;
  const address = contato.endereco;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Ações de comunicação */}
      {phoneNumber && (
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          aria-label={`Ligar para ${phoneNumber}`}
        >
          <a href={`tel:${phoneNumber}`}>
            <Phone className="w-4 h-4 mr-1" />
            Ligar
          </a>
        </Button>
      )}
      
      {contato.email && (
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          aria-label={`Enviar email para ${contato.email}`}
        >
          <a href={`mailto:${contato.email}`}>
            <Mail className="w-4 h-4 mr-1" />
            E-mail
          </a>
        </Button>
      )}
      
      {whatsappNumber && (
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          aria-label={`Enviar WhatsApp para ${whatsappNumber}`}
        >
          <a 
            href={`https://wa.me/55${whatsappNumber}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            WhatsApp
          </a>
        </Button>
      )}
      
      {address && (
        <Button 
          variant="outline" 
          size="sm" 
          asChild
          aria-label={`Ver ${address} no mapa`}
        >
          <a 
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Mapa
          </a>
        </Button>
      )}

      {/* Links para módulos (quando habilitado) */}
      {showLinks && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/agenda?contatoId=${contato.id}`}>
              <Calendar className="w-4 h-4 mr-1" />
              Agenda
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link to={`/processos?contatoId=${contato.id}`}>
              <Gavel className="w-4 h-4 mr-1" />
              Processos
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link to={`/financeiro?contatoId=${contato.id}`}>
              <Wallet className="w-4 h-4 mr-1" />
              Financeiro
            </Link>
          </Button>
        </>
      )}
    </div>
  );
}