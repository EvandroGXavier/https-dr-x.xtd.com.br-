import { supabase } from "@/integrations/supabase/client";

export const obterSaldoEstoque = (produto_id: string) =>
  supabase.from("v_produtos_estoque").select("*").eq("produto_id", produto_id).maybeSingle();
