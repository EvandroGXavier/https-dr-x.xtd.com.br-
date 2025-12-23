import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WorkflowModelo = {
  id: string;
  tenant_id: string | null;
  codigo: string;
  nome: string;
  descricao?: string | null;
  tipo_referencia: string;
  gatilho: string;
  filtros: any;
  configuracao: any;
  ativo: boolean;
};

export type WorkflowPasso = {
  id: string;
  tenant_id: string | null;
  workflow_modelo_id: string;
  ordem: number;
  tipo_acao: string;
  descricao?: string | null;
  configuracao: any;
  ativo: boolean;
};

export function useWorkflowModelos() {
  const [carregando, setCarregando] = useState(false);

  const listarModelos = async (): Promise<WorkflowModelo[]> => {
    setCarregando(true);
    const { data, error } = await (supabase as any)
      .from("workflow_modelos")
      .select("*")
      .order("nome", { ascending: true });
    setCarregando(false);
    if (error) throw error;
    return data || [];
  };

  const listarPassos = async (workflowModeloId: string): Promise<WorkflowPasso[]> => {
    const { data, error } = await (supabase as any)
      .from("workflow_passos")
      .select("*")
      .eq("workflow_modelo_id", workflowModeloId)
      .order("ordem", { ascending: true });
    if (error) throw error;
    return data || [];
  };

  const salvarModelo = async (modelo: Partial<WorkflowModelo>) => {
    const payload = {
      id: modelo.id,
      codigo: modelo.codigo,
      nome: modelo.nome,
      descricao: modelo.descricao ?? null,
      tipo_referencia: modelo.tipo_referencia ?? "processo",
      gatilho: modelo.gatilho ?? "processo.created",
      filtros: modelo.filtros ?? {},
      configuracao: modelo.configuracao ?? {},
      ativo: modelo.ativo ?? true,
    };
    const { data, error } = await (supabase as any)
      .from("workflow_modelos")
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const salvarPasso = async (passo: Partial<WorkflowPasso>) => {
    const payload = {
      id: passo.id,
      tenant_id: passo.tenant_id,
      workflow_modelo_id: passo.workflow_modelo_id,
      ordem: passo.ordem ?? 1,
      tipo_acao: passo.tipo_acao,
      descricao: passo.descricao ?? null,
      configuracao: passo.configuracao ?? {},
      ativo: passo.ativo ?? true,
    };
    const { data, error } = await (supabase as any)
      .from("workflow_passos")
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const excluirModelo = async (id: string) => {
    const { error } = await (supabase as any)
      .from("workflow_modelos")
      .delete()
      .eq("id", id);
    if (error) throw error;
  };

  const excluirPasso = async (id: string) => {
    const { error } = await (supabase as any)
      .from("workflow_passos")
      .delete()
      .eq("id", id);
    if (error) throw error;
  };

  return {
    carregando,
    listarModelos,
    listarPassos,
    salvarModelo,
    salvarPasso,
    excluirModelo,
    excluirPasso,
  };
}
