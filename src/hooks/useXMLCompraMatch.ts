import { buscarPorContatoCodigo, criarReferencia } from "@/services/produtosReferencia";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type ItemXML = {
  codigo: string;
  descricao: string;
  unidade: string;
  ncm?: string;
  quantidade: number;
  valorUnit: number;
};

export function useXMLCompraMatch() {
  const { user } = useAuth();
  
  const resolverProdutoPorItemXML = async (params: {
    fornecedor_id: string;
    item: ItemXML;
    onMatchProdutoExistente?: (produto_id: string) => void;
    onCriacaoAutomatica?: (produto_id: string) => void;
  }) => {
    if (!user) throw new Error("Usuário não autenticado");
    
    const { fornecedor_id, item } = params;
    const tenant_id = user.id;

    // 1) Tenta achar referência existente
    const ref = await buscarPorContatoCodigo(tenant_id, fornecedor_id, item.codigo);
    if (ref.data?.produto_id) {
      params.onMatchProdutoExistente?.(ref.data.produto_id);
      return { produto_id: ref.data.produto_id, origem: "referencia" };
    }

    // 2) Criar produto rascunho + referência
    const novo = await supabase.from("produtos").insert({
      tenant_id,
      nome: item.descricao,
      preco_base: item.valorUnit ?? 0,
      codigo_interno: item.codigo,
    } as any).select().single();

    const produto_id = novo.data?.id as string;
    if (produto_id) {
      await criarReferencia({
        tenant_id,
        produto_id,
        contato_id: fornecedor_id,
        codigo_externo: item.codigo,
        descricao_externa: item.descricao,
        unidade_externa: item.unidade,
        fator_conversao: 1,
        ncm_externo: item.ncm ?? null,
      });
      params.onCriacaoAutomatica?.(produto_id);
      return { produto_id, origem: "criado" };
    }

    throw new Error("Não foi possível resolver o produto para o item do XML.");
  };

  return { resolverProdutoPorItemXML };
}
