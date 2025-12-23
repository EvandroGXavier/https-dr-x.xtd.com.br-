import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * Hook global de retorno contextual
 * - Compatível com o fluxo existente de Agenda em Contatos
 * - Suporta novos módulos (Processos, Financeiro, etc.)
 */
export function useContextualReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const getContext = useCallback(() => {
    const returnTo = searchParams.get("returnTo");
    const parentType = searchParams.get("parentType");
    const parentId = searchParams.get("parentId");
    const contato_id = searchParams.get("contato_id"); // compatibilidade com versão anterior
    const processo_id = searchParams.get("processo_id"); // compatibilidade

    // Ajuste retroativo: se vier contato_id (fluxo antigo)
    if (contato_id && !parentId && !parentType) {
      return { returnTo, parentId: contato_id, parentType: "contato" };
    }

    // Ajuste para processo_id
    if (processo_id && !parentId && !parentType) {
      return { returnTo, parentId: processo_id, parentType: "processo" };
    }

    return { returnTo, parentId, parentType };
  }, [searchParams]);

  const goBack = useCallback(() => {
    const { returnTo } = getContext();
    navigate(returnTo || "/");
  }, [getContext, navigate]);

  return { getContext, goBack };
}
