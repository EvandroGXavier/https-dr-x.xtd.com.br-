import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink, Plus } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type Props = {
  contatoId?: string;         // id do contato, se já persistido
  className?: string;
  disabled?: boolean;
};

// Hook simples de permissões - pode ser substituído por implementação real
const usePermissions = () => {
  // Por agora, assume que todos podem ler financeiro
  // TODO: Integrar com sistema real de permissões
  const canRead = (module: string) => module === "financeiro";
  return { canRead };
};

export function FinanceiroLink({ contatoId, className, disabled }: Props) {
  const { canRead } = usePermissions();
  const location = useLocation();
  
  const listHref = useMemo(() => {
    if (contatoId) return `/financeiro?contactId=${encodeURIComponent(contatoId)}`;
    return `/financeiro`;
  }, [contatoId]);

  const newHref = useMemo(() => {
    if (!contatoId) return `/financeiro/nova`;
    
    const returnTo = `/contatos/${contatoId}${location.search || '?tab=financeiro'}`;
    return `/financeiro/nova?parentType=contato&parentId=${encodeURIComponent(contatoId)}&returnTo=${encodeURIComponent(returnTo)}`;
  }, [contatoId, location.search]);

  const isContactFinanceiroDisabled = disabled || !contatoId;

  if (!canRead("financeiro")) return null;

  return (
    <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-2", className)}>
      <Button 
        asChild 
        aria-label="Criar nova transação para este contato"
        disabled={isContactFinanceiroDisabled}
        className="w-full sm:w-auto"
      >
        <Link to={newHref}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Transação
        </Link>
      </Button>

      <Button 
        asChild 
        variant="outline"
        aria-label="Abrir financeiro vinculado a este contato" 
        disabled={isContactFinanceiroDisabled}
        className="w-full sm:w-auto"
      >
        <Link to={listHref}>
          <Wallet className="mr-2 h-4 w-4" />
          Ver financeiro do contato
        </Link>
      </Button>

      <Button 
        asChild 
        variant="ghost" 
        aria-label="Ver todos os lançamentos"
        className="w-full sm:w-auto"
      >
        <Link to="/financeiro">
          <ExternalLink className="mr-2 h-4 w-4" />
          Ver todos
        </Link>
      </Button>
    </div>
  );
}

export default FinanceiroLink;