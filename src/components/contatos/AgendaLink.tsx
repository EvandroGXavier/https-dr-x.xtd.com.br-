import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Plus } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  contatoId?: string;
  className?: string;
  disabled?: boolean;
};

const usePermissions = () => {
  const canRead = (module: string) => module === "agenda";
  return { canRead };
};

export function AgendaLink({ contatoId, className, disabled }: Props) {
  const { canRead } = usePermissions();
  const location = useLocation();
  
  const listHref = useMemo(() => {
    if (contatoId) return `/agenda?contactId=${encodeURIComponent(contatoId)}`;
    return `/agenda`;
  }, [contatoId]);

  const newHref = useMemo(() => {
    if (!contatoId) return `/agenda/v2/novo`;
    
    const returnTo = `/contatos/${contatoId}${location.search || '?tab=agenda'}`;
    return `/agenda/v2/novo?contato_id=${encodeURIComponent(contatoId)}&returnTo=${encodeURIComponent(returnTo)}`;
  }, [contatoId, location.search]);

  const isContactAgendaDisabled = disabled || !contatoId;

  if (!canRead("agenda")) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2", className)}>
      <Button 
        asChild 
        aria-label="Criar nova agenda para este contato"
        disabled={isContactAgendaDisabled}
        className="w-full sm:w-auto"
      >
        <Link to={newHref}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Agenda
        </Link>
      </Button>

      <Button 
        asChild 
        variant="outline"
        aria-label="Abrir agenda relacionada a este contato" 
        disabled={isContactAgendaDisabled}
        className="w-full sm:w-auto"
      >
        <Link to={listHref}>
          <Calendar className="mr-2 h-4 w-4" />
          Ver agendas do contato
        </Link>
      </Button>

      <Button 
        asChild 
        variant="ghost" 
        aria-label="Ver todas as agendas"
        className="w-full sm:w-auto"
      >
        <Link to="/agenda">
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver todas
        </Link>
      </Button>
    </div>
  );
}

export default AgendaLink;