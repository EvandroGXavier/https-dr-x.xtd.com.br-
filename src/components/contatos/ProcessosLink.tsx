import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scale, ExternalLink, Plus } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  contatoId?: string;         // id do contato, se já persistido
  className?: string;
  disabled?: boolean;
};

// Hook simples de permissões - pode ser substituído por implementação real
const usePermissions = () => {
  // Por agora, assume que todos podem ler processos
  // TODO: Integrar com sistema real de permissões
  const canRead = (module: string) => module === "processos";
  return { canRead };
};

export function ProcessosLink({ contatoId, className, disabled }: Props) {
  const { canRead } = usePermissions();
  const location = useLocation();
  
  const listHref = useMemo(() => {
    if (contatoId) return `/processos?contactId=${encodeURIComponent(contatoId)}`;
    return `/processos`;
  }, [contatoId]);

  const newHref = useMemo(() => {
    // Sempre navega para /processos/novo sem criar registro antecipadamente
    return `/processos/novo`;
  }, []);

  const isContactProcessosDisabled = disabled || !contatoId;

  if (!canRead("processos")) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2", className)}>
      <Button 
        asChild 
        aria-label="Criar novo processo para este contato"
        disabled={isContactProcessosDisabled}
        className="w-full sm:w-auto"
      >
        <Link to={newHref}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Processo
        </Link>
      </Button>

      <Button 
        asChild 
        variant="outline"
        aria-label="Abrir processos vinculados a este contato" 
        disabled={isContactProcessosDisabled}
        className="w-full sm:w-auto"
      >
        <Link to={listHref}>
          <Scale className="mr-2 h-4 w-4" />
          Ver processos do contato
        </Link>
      </Button>

      <Button 
        asChild 
        variant="ghost" 
        aria-label="Ver todos os processos"
        className="w-full sm:w-auto"
      >
        <Link to="/processos">
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver todos
        </Link>
      </Button>
    </div>
  );
}

export default ProcessosLink;