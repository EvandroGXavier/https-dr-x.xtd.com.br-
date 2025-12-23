/**
 * Tipos PT-BR para o sistema ERP Jurídico
 * Mapeamento amigável das estruturas de dados
 */

// ===== PROCESSOS =====
export interface ProcessoPT {
  id: string;
  empresa_id: string;
  numero_processo?: string | null;
  tipo_processo: string;
  status: string;
  tribunal: string;
  comarca?: string | null;
  vara?: string | null;
  instancia: string;
  cliente_principal_id?: string | null;
  advogado_responsavel_id?: string | null;
  valor_causa?: number | null;
  assunto_principal: string;
  data_distribuicao?: string | null;
  etiqueta?: string | null;
  situacao: string;
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ProcessoPartePT {
  id: string;
  empresa_id: string;
  processo_id: string;
  contato_id: string;
  papel: string;
  principal?: boolean | null;
  metadados?: string | null;
  criado_em: string;
}

// ===== CONTATOS =====
export interface ContatoPT {
  id: string;
  empresa_id: string;
  nome?: string | null;
  nome_fantasia?: string | null;
  cpf_cnpj?: string | null;
  email?: string | null;
  celular?: string | null;
  telefone?: string | null;
  ativo?: boolean | null;
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
}

// ===== AGENDA =====
export interface AgendaPT {
  id: string;
  empresa_id: string;
  titulo: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim?: string | null;
  status: string;
  prioridade?: string | null;
  contato_responsavel_id: string;
  contato_solicitante_id: string;
  processo_id?: string | null;
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
}

// ===== TRANSAÇÕES FINANCEIRAS =====
export interface TransacaoFinanceiraPT {
  id: string;
  empresa_id: string;
  tipo: string;
  categoria: string;
  historico: string;
  numero_documento?: string | null;
  data_emissao?: string | null;
  data_vencimento?: string | null;
  data_competencia?: string | null;
  data_liquidacao?: string | null;
  valor_documento?: number | null;
  valor_recebido?: number | null;
  status: string;
  forma_pagamento?: string | null;
  contato_id?: string | null;
  conta_financeira_id?: string | null;
  origem_tipo?: string | null;
  origem_id?: string | null;
  observacoes?: string | null;
  criado_em: string;
  atualizado_em: string;
}

// ===== ETIQUETAS =====
export interface EtiquetaPT {
  id: string;
  empresa_id: string;
  nome: string;
  slug: string;
  cor?: string | null;
  icone?: string | null;
  descricao?: string | null;
  ativa?: boolean | null;
  criado_em: string;
  atualizado_em: string;
}

// ===== ANEXOS =====
export interface AnexoPT {
  id: string;
  empresa_id: string;
  modulo: string;
  tipo_registro: string;
  registro_id: string;
  nome_original: string;
  caminho_storage: string;
  tipo_mime: string;
  tamanho_bytes: number;
  metadados: Record<string, any>;
  texto_ocr?: string | null;
  confianca_ocr?: number | null;
  status_ocr: string;
  status_virus: string;
  status: string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

// ===== ENUMS PT-BR =====
export const TipoProcessoEnum = {
  JUDICIAL: 'JUDICIAL',
  EXTRAJUDICIAL: 'EXTRAJUDICIAL',
  ADMINISTRATIVO: 'ADMINISTRATIVO',
  INTERNO: 'INTERNO'
} as const;

export const StatusProcessoEnum = {
  ATIVO: 'ativo',
  ARQUIVADO: 'arquivado',
  SUSPENSO: 'suspenso',
  ENCERRADO: 'encerrado'
} as const;

export const TipoPessoaEnum = {
  PF: 'pf',
  PJ: 'pj',
  LEAD: 'lead'
} as const;

export const StatusAgendaEnum = {
  ANALISE: 'analise',
  AGENDADO: 'agendado',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado'
} as const;

export const StatusTransacaoEnum = {
  ABERTA: 'aberta',
  PAGA: 'paga',
  VENCIDA: 'vencida',
  CANCELADA: 'cancelada'
} as const;

export type TipoProcesso = typeof TipoProcessoEnum[keyof typeof TipoProcessoEnum];
export type StatusProcesso = typeof StatusProcessoEnum[keyof typeof StatusProcessoEnum];
export type TipoPessoa = typeof TipoPessoaEnum[keyof typeof TipoPessoaEnum];
export type StatusAgenda = typeof StatusAgendaEnum[keyof typeof StatusAgendaEnum];
export type StatusTransacao = typeof StatusTransacaoEnum[keyof typeof StatusTransacaoEnum];