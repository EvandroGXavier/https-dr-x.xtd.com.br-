/**
 * Adapters PT-BR para conversão entre estruturas de dados
 * Converte dados do banco (nomenclatura técnica) para PT-BR (nomenclatura amigável)
 */

import type { 
  ProcessoPT, 
  ProcessoPartePT, 
  ContatoPT, 
  AgendaPT, 
  TransacaoFinanceiraPT, 
  EtiquetaPT, 
  AnexoPT 
} from '@/types/ptbr';

// ===== ADAPTERS PARA PROCESSOS =====
export function mapProcessoDbToPT(row: any): ProcessoPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id ?? row.tenant_id,
    numero_processo: row.numero_processo ?? null,
    tipo_processo: row.tipo_processo ?? row.tipo ?? 'JUDICIAL',
    status: row.status ?? 'ativo',
    tribunal: row.tribunal ?? '',
    comarca: row.comarca ?? null,
    vara: row.vara ?? null,
    instancia: row.instancia ?? 'primeira',
    cliente_principal_id: row.cliente_principal_id ?? null,
    advogado_responsavel_id: row.advogado_responsavel_id ?? null,
    valor_causa: row.valor_causa ?? null,
    assunto_principal: row.assunto_principal ?? '',
    data_distribuicao: row.data_distribuicao ?? null,
    etiqueta: row.etiqueta ?? null,
    situacao: row.situacao ?? 'em_andamento',
    observacoes: row.observacoes ?? null,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

export function mapProcessoParteToPT(row: any): ProcessoPartePT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id ?? row.tenant_id,
    processo_id: row.processo_id,
    contato_id: row.contato_id,
    papel: row.papel ?? row.qualificacao ?? '',
    principal: row.principal ?? false,
    metadados: row.metadados ?? row.observacoes ?? null,
    criado_em: row.criado_em ?? row.created_at,
  };
}

// ===== ADAPTERS PARA CONTATOS =====
export function mapContatoToPT(row: any): ContatoPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id ?? row.tenant_id,
    nome: row.nome_fantasia ?? null,
    nome_fantasia: row.nome_fantasia ?? null,
    cpf_cnpj: row.cpf_cnpj ?? null,
    email: row.email ?? null,
    celular: row.celular ?? null,
    telefone: row.telefone ?? null,
    ativo: row.ativo ?? false,
    observacoes: row.observacoes ?? row.observacao ?? null,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

/**
 * Adapter para view padronizada vw_contatos_geral_pt
 * Esta view oferece uma interface consistente com nomenclatura PT-BR
 */
export function mapContatoGeralPT(row: any): ContatoPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id,
    nome: row.nome_completo ?? row.nome_fantasia,
    nome_fantasia: row.nome_fantasia,
    cpf_cnpj: row.cpf_cnpj,
    email: row.email,
    celular: row.celular,
    telefone: row.telefone,
    ativo: row.ativo ?? true,
    observacoes: row.observacoes,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

// ===== ADAPTERS PARA AGENDA =====
export function mapAgendaToPT(row: any): AgendaPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.tenant_id ?? row.user_id,
    titulo: row.titulo,
    descricao: row.descricao ?? null,
    data_inicio: row.data_inicio,
    data_fim: row.data_fim ?? null,
    status: row.status ?? 'analise',
    prioridade: row.prioridade ?? 'media',
    contato_responsavel_id: row.contato_responsavel_id,
    contato_solicitante_id: row.contato_solicitante_id,
    processo_id: row.processo_id ?? null,
    observacoes: row.observacoes ?? null,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

// ===== ADAPTERS PARA TRANSAÇÕES FINANCEIRAS =====
export function mapTransacaoFinanceiraToPT(row: any): TransacaoFinanceiraPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id ?? row.tenant_id,
    tipo: row.tipo,
    categoria: row.categoria,
    historico: row.historico,
    numero_documento: row.numero_documento ?? null,
    data_emissao: row.data_emissao ?? null,
    data_vencimento: row.data_vencimento ?? null,
    data_competencia: row.data_competencia ?? null,
    data_liquidacao: row.data_liquidacao ?? null,
    valor_documento: row.valor_documento ?? null,
    valor_recebido: row.valor_recebido ?? null,
    status: row.status ?? row.situacao ?? 'aberta',
    forma_pagamento: row.forma_pagamento ?? null,
    contato_id: row.contato_id ?? null,
    conta_financeira_id: row.conta_financeira_id ?? null,
    origem_tipo: row.origem_tipo ?? null,
    origem_id: row.origem_id ?? null,
    observacoes: row.observacoes ?? null,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

// ===== ADAPTERS PARA ETIQUETAS =====
export function mapEtiquetaToPT(row: any): EtiquetaPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.user_id ?? row.tenant_id,
    nome: row.nome,
    slug: row.slug,
    cor: row.cor ?? null,
    icone: row.icone ?? null,
    descricao: row.descricao ?? null,
    ativa: row.ativa ?? true,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

// ===== ADAPTERS PARA ANEXOS =====
export function mapAnexoToPT(row: any): AnexoPT {
  return {
    id: row.id,
    empresa_id: row.empresa_id ?? row.tenant_id ?? row.user_id,
    modulo: row.modulo,
    tipo_registro: row.tipo_registro ?? row.record_type,
    registro_id: row.registro_id ?? row.record_id,
    nome_original: row.nome_original ?? row.original_name,
    caminho_storage: row.caminho_storage ?? row.storage_path,
    tipo_mime: row.tipo_mime ?? row.mime_type,
    tamanho_bytes: row.tamanho_bytes ?? row.size_bytes,
    metadados: row.metadados ?? row.metadata ?? {},
    texto_ocr: row.texto_ocr ?? row.ocr_text ?? null,
    confianca_ocr: row.confianca_ocr ?? row.ocr_confidence ?? null,
    status_ocr: row.status_ocr ?? row.ocr_status ?? 'pending',
    status_virus: row.status_virus ?? row.virus_scan_status ?? 'pending',
    status: row.status ?? 'stored',
    criado_por: row.criado_por ?? row.created_by,
    criado_em: row.criado_em ?? row.created_at,
    atualizado_em: row.atualizado_em ?? row.updated_at,
  };
}

// ===== ADAPTERS REVERSOS (PT-BR → DB) =====
export function mapProcessoPTToDb(data: Partial<ProcessoPT>): any {
  return {
    id: data.id,
    user_id: data.empresa_id,
    numero_processo: data.numero_processo,
    tipo: data.tipo_processo,
    status: data.status,
    tribunal: data.tribunal,
    comarca: data.comarca,
    vara: data.vara,
    instancia: data.instancia,
    cliente_principal_id: data.cliente_principal_id,
    advogado_responsavel_id: data.advogado_responsavel_id,
    valor_causa: data.valor_causa,
    assunto_principal: data.assunto_principal,
    data_distribuicao: data.data_distribuicao,
    etiqueta: data.etiqueta,
    situacao: data.situacao,
    observacoes: data.observacoes,
  };
}

export function mapContatoPTToDb(data: Partial<ContatoPT>): any {
  return {
    id: data.id,
    user_id: data.empresa_id,
    nome_fantasia: data.nome || data.nome_fantasia,
    cpf_cnpj: data.cpf_cnpj,
    email: data.email,
    celular: data.celular,
    telefone: data.telefone,
    observacao: data.observacoes,
  };
}

export function mapAgendaPTToDb(data: Partial<AgendaPT>): any {
  return {
    id: data.id,
    tenant_id: data.empresa_id,
    titulo: data.titulo,
    descricao: data.descricao,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim,
    status: data.status,
    prioridade: data.prioridade,
    contato_responsavel_id: data.contato_responsavel_id,
    contato_solicitante_id: data.contato_solicitante_id,
    processo_id: data.processo_id,
    observacoes: data.observacoes,
  };
}

// ===== HELPERS DE CONVERSÃO =====
export function normalizeEmpresaId(value: any): string {
  return value?.empresa_id ?? value?.user_id ?? value?.tenant_id ?? '';
}

export function normalizeDatesFromDb(row: any): any {
  const normalized = { ...row };
  
  // Padronizar datas
  if (row.created_at && !row.criado_em) {
    normalized.criado_em = row.created_at;
  }
  if (row.updated_at && !row.atualizado_em) {
    normalized.atualizado_em = row.updated_at;
  }
  
  return normalized;
}

export function validatePTBRData(data: any, requiredFields: string[] = []): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Campo obrigatório: ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}