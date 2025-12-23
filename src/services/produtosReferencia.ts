import { supabase } from "@/integrations/supabase/client";

export type ProdutoReferencia = {
  id?: string;
  tenant_id: string;
  produto_id: string;
  contato_id: string;
  codigo_externo?: string | null;
  descricao_externa?: string | null;
  unidade_externa?: string | null;
  fator_conversao?: number;
  ncm_externo?: string | null;
  marca_externa?: string | null;
  observacoes?: string | null;
};

export const buscarPorContatoCodigo = async (tenant_id: string, contato_id: string, codigo_externo: string) => {
  return supabase.from("produtos_referencia")
    .select("*").eq("tenant_id", tenant_id)
    .eq("contato_id", contato_id).eq("codigo_externo", codigo_externo)
    .maybeSingle();
};

export const listarReferenciasDoProduto = (produto_id: string) =>
  supabase.from("produtos_referencia").select("*").eq("produto_id", produto_id).order("criado_em", { ascending: false });

export const criarReferencia = (ref: ProdutoReferencia) =>
  supabase.from("produtos_referencia").insert(ref).select().single();

export const atualizarReferencia = (id: string, patch: Partial<ProdutoReferencia>) =>
  supabase.from("produtos_referencia").update(patch).eq("id", id).select().single();

export const excluirReferencia = (id: string) =>
  supabase.from("produtos_referencia").delete().eq("id", id);
