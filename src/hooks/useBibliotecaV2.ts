// src/hooks/useBibliotecaV2.ts
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type ModeloV2 = {
  id: string;
  tenant_id: string;
  titulo: string;
  descricao: string | null;
  conteudo_html: string | null;
  criado_por: string | null;
  atualizado_por: string | null;
  data_criacao: string;
  data_atualizacao: string;
};

export function useBibliotecaV2() {
  const { user } = useAuth();

  const listar = useCallback(async (q?: string, etiquetas?: string[]) => {
    const { data, error } = await supabase
      .from("vw_biblioteca_grid")
      .select("*")
      .order("data_atualizacao", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Falha ao carregar biblioteca.");
      return [] as any[];
    }

    let rows = (data ?? []) as any[];

    if (q && q.trim()) {
      const term = q.toLowerCase();
      rows = rows.filter(
        (r: any) =>
          (r.titulo || "").toLowerCase().includes(term) ||
          (r.descricao || "").toLowerCase().includes(term) ||
          (r.etiquetas || "").toLowerCase().includes(term)
      );
    }

    if (etiquetas && etiquetas.length) {
      rows = rows.filter((r: any) =>
        etiquetas.every((e) => (r.etiquetas || "").toLowerCase().includes(e.toLowerCase()))
      );
    }

    return rows;
  }, []);

  const obter = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("biblioteca_modelos_v2")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      toast.error("Falha ao carregar modelo.");
      return null;
    }
    return data as ModeloV2;
  }, []);

  const criar = useCallback(
    async (payload: Partial<ModeloV2>, etiquetas: string[] = []) => {
      if (!user) {
        toast.error("É necessário estar autenticado.");
        return null;
      }

      const body = {
        tenant_id: user.id,
        titulo: payload.titulo,
        descricao: payload.descricao ?? null,
        conteudo_html: payload.conteudo_html ?? null,
        criado_por: user.id,
        atualizado_por: user.id,
      } as any;

      const { data, error } = await supabase
        .from("biblioteca_modelos_v2")
        .insert([body])
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error("Falha ao criar modelo.");
        return null;
      }

      if (etiquetas.length) {
        const { error: rpcError } = await supabase.rpc("sp_biblioteca_set_etiquetas", {
          p_modelo_id: data.id,
          p_nomes: etiquetas,
        });
        if (rpcError) console.error(rpcError);
      }

      toast.success("Modelo criado com sucesso.");
      return data as ModeloV2;
    },
    [user]
  );

  const atualizar = useCallback(
    async (id: string, payload: Partial<ModeloV2>, etiquetas?: string[]) => {
      const userId = user?.id ?? null;
      const body = {
        titulo: payload.titulo,
        descricao: payload.descricao ?? null,
        conteudo_html: payload.conteudo_html ?? null,
        atualizado_por: userId,
        data_atualizacao: new Date().toISOString(),
      } as any;

      const { data, error } = await supabase
        .from("biblioteca_modelos_v2")
        .update(body)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(error);
        toast.error("Falha ao salvar modelo.");
        return null;
      }

      if (Array.isArray(etiquetas)) {
        const { error: rpcError } = await supabase.rpc("sp_biblioteca_set_etiquetas", {
          p_modelo_id: id,
          p_nomes: etiquetas,
        });
        if (rpcError) console.error(rpcError);
      }

      toast.success("Modelo atualizado.");
      return data as ModeloV2;
    },
    [user]
  );

  const excluir = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("biblioteca_modelos_v2")
      .update({ data_exclusao_logica: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(error);
      toast.error("Falha ao excluir modelo.");
      return false;
    }

    toast.success("Modelo excluído.");
    return true;
  }, []);

  return { listar, obter, criar, atualizar, excluir };
}
