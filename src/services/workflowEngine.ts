import { supabase } from "@/integrations/supabase/client";
import { fillPlaceholders } from "@/lib/fillPlaceholders";

type ProcessoMini = {
  id: string;
  tenant_id: string;
  numero_processo: string | null;
  etiquetas?: string[];
};

type WorkflowModelo = {
  id: string;
  tenant_id: string | null;
  codigo: string;
  nome: string;
  gatilho: string;
  filtros: any;
  configuracao: any;
};

type WorkflowPasso = {
  id: string;
  workflow_modelo_id: string;
  ordem: number;
  tipo_acao: string;
  configuracao: any;
};

/**
 * Busca dados completos do processo para usar nos placeholders
 */
async function obterProcessoCompleto(processoId: string) {
  const { data, error } = await supabase
    .from("processos")
    .select(`
      *,
      partes:processo_partes(
        id,
        qualificacao,
        contato:contatos_v2(id, nome, cpf, cnpj)
      ),
      etiquetas:processo_etiquetas(
        etiqueta:etiquetas(id, nome, slug)
      )
    `)
    .eq("id", processoId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Dispara workflows automáticos ao criar um processo
 */
export async function iniciarWorkflowsParaProcesso(processo: ProcessoMini, usuarioId?: string) {
  const { data: modelos, error } = await (supabase as any)
    .from("workflow_modelos")
    .select("*")
    .eq("tipo_referencia", "processo")
    .eq("gatilho", "processo.created")
    .eq("ativo", true);

  if (error) {
    console.error("Erro ao buscar workflows:", error);
    return;
  }

  if (!modelos || modelos.length === 0) return;

  for (const modelo of modelos as WorkflowModelo[]) {
    const deveAplicar = avaliarFiltrosModelo(modelo, processo);
    if (!deveAplicar) continue;
    await executarWorkflowModeloParaProcesso(modelo, processo, usuarioId);
  }
}

/**
 * Avalia se o modelo deve ser aplicado a um processo
 */
function avaliarFiltrosModelo(modelo: WorkflowModelo, processo: ProcessoMini): boolean {
  const filtros = modelo.filtros || {};

  if (filtros.etiquetas_inclui && Array.isArray(filtros.etiquetas_inclui)) {
    const etqs = processo.etiquetas || [];
    const temTodas = filtros.etiquetas_inclui.every((slug: string) => etqs.includes(slug));
    if (!temTodas) return false;
  }

  return true;
}

/**
 * Cria execução e dispara os passos em sequência
 */
async function executarWorkflowModeloParaProcesso(
  modelo: WorkflowModelo,
  processo: ProcessoMini,
  usuarioId?: string
) {
  const { data: exec, error: errExec } = await (supabase as any)
    .from("workflow_execucoes")
    .insert({
      tenant_id: processo.tenant_id,
      workflow_modelo_id: modelo.id,
      referencia_tipo: "processo",
      referencia_id: processo.id,
      status: "em_andamento",
      criado_por: usuarioId ?? null,
    })
    .select()
    .single();

  if (errExec || !exec) {
    console.error("Erro ao criar execução de workflow:", errExec);
    return;
  }

  const { data: passos, error: errPassos } = await (supabase as any)
    .from("workflow_passos")
    .select("*")
    .eq("workflow_modelo_id", modelo.id)
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (errPassos || !passos || passos.length === 0) {
    await (supabase as any).from("workflow_execucoes").update({ status: "concluido" }).eq("id", exec.id);
    return;
  }

  const processoCompleto = await obterProcessoCompleto(processo.id);

  for (const p of passos as WorkflowPasso[]) {
    const { data: execPasso } = await (supabase as any)
      .from("workflow_execucao_passos")
      .insert({
        tenant_id: processo.tenant_id,
        workflow_execucao_id: exec.id,
        workflow_passo_id: p.id,
        status: "executando",
      })
      .select()
      .single();

    try {
      let resultado: any = null;

      if (p.tipo_acao === "gerar_documentos") {
        resultado = await executarPassoGerarDocumentos(p, processoCompleto);
      }

      if (p.tipo_acao === "criar_tarefa") {
        resultado = { mensagem: "Tarefa criada (placeholder)" };
      }

      if (p.tipo_acao === "criar_evento_agenda") {
        resultado = { mensagem: "Evento de agenda criado (placeholder)" };
      }

      await (supabase as any)
        .from("workflow_execucao_passos")
        .update({ status: "concluido", resultado })
        .eq("id", execPasso?.id);
    } catch (e: any) {
      console.error("Erro ao executar passo de workflow:", e);
      await (supabase as any)
        .from("workflow_execucao_passos")
        .update({ status: "erro", mensagem_erro: String(e?.message ?? e) })
        .eq("id", execPasso?.id);
    }
  }

  await (supabase as any)
    .from("workflow_execucoes")
    .update({ status: "concluido" })
    .eq("id", exec.id);
}

/**
 * Executa passo de gerar documentos
 */
async function executarPassoGerarDocumentos(passo: WorkflowPasso, processoCompleto: any) {
  const cfg = passo.configuracao || {};
  const modelosIds: string[] = cfg.documentos_modelos_ids || [];

  if (!modelosIds.length) return { documentos_criados: [] };

  const { data: modelos, error } = await supabase
    .from("biblioteca_modelos_v2")
    .select("id, titulo, conteudo_html")
    .in("id", modelosIds);

  if (error) throw error;

  const documentosCriados: any[] = [];

  for (const modelo of modelos || []) {
    const htmlPreenchido = fillPlaceholders(modelo.conteudo_html || "", processoCompleto);

    const { data: doc, error: errDoc } = await (supabase as any)
      .from("documentos")
      .insert({
        tenant_id: processoCompleto.tenant_id,
        processo_id: processoCompleto.id,
        modelo_id: modelo.id,
        titulo: modelo.titulo,
        conteudo_html: htmlPreenchido,
        status: "gerado_automatico",
      })
      .select()
      .single();

    if (errDoc) throw errDoc;
    documentosCriados.push(doc);
  }

  return { documentos_criados: documentosCriados };
}
