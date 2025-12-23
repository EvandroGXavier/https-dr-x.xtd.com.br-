// Status antigos (mantidos para compatibilidade)
export type ProcessoStatus = 'ativo' | 'suspenso' | 'arquivado' | 'finalizado' | 'Oportunidade' | 'Em Análise' | 'Aguardando Cliente' | 'Ativo' | 'Suspenso' | 'Encerrado' | 'Recusado';
export type ProcessoTipo = 'civel' | 'criminal' | 'trabalhista' | 'tributario' | 'previdenciario' | 'administrativo' | 'outros';
export type ProcessoInstancia = 'primeira' | 'segunda' | 'superior' | 'suprema';
// Atualizado com novos tipos conforme plano de simplificação
export type QualificacaoParte =
  | 'autor'
  | 'reu'
  | 'cliente'      // NOVO: nosso cliente representado
  | 'contrario'    // NOVO: parte contrária
  | 'testemunha'
  | 'juizo'
  | 'advogado'
  | 'ministerio_publico'
  | 'terceiro_interessado'
  | 'perito'
  | 'falecido'     // NOVO: parte falecida
  | 'outros';
export type TipoMovimentacao = 'peticao' | 'audiencia' | 'sentenca' | 'recurso' | 'pagamento' | 'outro';
export type TipoParteQualificacao = 'requerente' | 'requerido' | 'autor' | 'reu' | 'terceiro_interessado' | 'testemunha' | 'perito' | 'advogado';

// Status para o fluxo unificado de processos (Kanban)
export const STATUS_PROCESSO = {
  OPORTUNIDADE: 'Oportunidade',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  ATIVO: 'Ativo',
  SUSPENSO: 'Suspenso',
  ENCERRADO: 'Encerrado',
  RECUSADO: 'Recusado',
} as const;

export type StatusProcesso = typeof STATUS_PROCESSO[keyof typeof STATUS_PROCESSO];

// Colunas do Kanban (ordem de exibição)
export const KANBAN_COLUMNS: StatusProcesso[] = [
  STATUS_PROCESSO.OPORTUNIDADE,
  STATUS_PROCESSO.EM_ANALISE,
  STATUS_PROCESSO.AGUARDANDO_CLIENTE,
  STATUS_PROCESSO.ATIVO,
];

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  descricao?: string;
  grupo?: string;
}

// Nova interface para dados judiciais específicos (EPROC V2)
export interface ProcessoTj {
  id: string;
  processo_id: string;
  tenant_id: string;
  
  // Identificação Principal
  numero_oficial: string;
  numero_cnj?: string;
  chave_processo?: string;
  
  // Localização Judicial
  tribunal?: string;
  uf?: string;
  comarca?: string;
  vara?: string;
  orgao_julgador?: string;
  juiz_responsavel?: string;
  
  // Classificação
  instancia?: 'primeira' | 'segunda' | 'superior' | 'suprema';
  tipo_justica?: 'estadual' | 'federal' | 'trabalho' | 'militar' | 'eleitoral';
  classe?: string;
  competencia?: string;
  assunto?: string;
  
  // Status e Datas
  situacao?: string;
  data_autuacao?: string;
  
  // Valores e Sigilo
  valor_causa?: number;
  nivel_sigilo?: number;
  nivel_sigilo_desc?: string;
  
  // Flags Especiais (EPROC)
  justica_gratuita?: 'nao' | 'requerida' | 'deferida' | 'indeferida';
  admitida_execucao?: boolean;
  antecipacao_tutela?: 'nao_requerida' | 'requerida' | 'deferida' | 'indeferida';
  crianca_adolescente?: boolean;
  doenca_grave?: boolean;
  peticao_urgente?: boolean;
  reconvencao?: boolean;
  reu_preso?: boolean;
  processo_digitalizado?: boolean;
  
  // Automação (Crawler Futuro)
  sistema_judicial?: 'pje' | 'eproc' | 'esaj' | 'projudi' | 'sajadv' | 'outros';
  senha_acesso?: string;
  link_consulta?: string;
  data_ultima_verificacao?: string;
  ultimo_status_tj?: string;
  
  // Metadados
  origem_dados: 'manual' | 'pje' | 'esaj' | 'eproc' | 'integracao';
  criado_em: string;
  atualizado_em: string;
}

// ====== INTERFACE V2: PASTA DE CASO GENÉRICA ======
export interface Processo {
  id: string;
  user_id: string;
  tenant_id: string;  // UUID da empresa (tenant) para RLS
  empresa_id?: string;
  filial_id?: string;

  // Campos V2 principais
  titulo: string;            // No form: assunto_principal
  descricao?: string | null; // No form: detalhes_pasta
  local?: string | null;     // Link para pasta de documentos (Google Drive, etc) ou localidade
  status: string;            // Status no fluxo Kanban (Oportunidade, Em Análise, Ativo, etc)

  // Campos adicionais que estavam faltando
  numero_processo?: string | null;
  pasta?: string | null;           // No form: numero_pasta
  tipo_acao?: string | null;
  data_distribuicao?: string | null;
  valor_causa?: number | null;
  valor_possivel?: number | null;
  valor_provisionado?: number | null;

  // IDs de relacionamento (Foreign Keys)
  cliente_id?: string | null;         // No form: cliente_principal_id
  advogado_id?: string | null;
  parte_contraria_id?: string | null;

  // Campos complementares
  uf?: string | null;
  instancia?: string | null;
  vara?: string | null;               // No form: vara_turma
  comarca?: string | null;
  observacoes?: string | null;

  created_at: string;
  updated_at: string;

  // Relações
  etiquetas?: Etiqueta[];
}

export interface ProcessoParte {
  id: string;
  processo_id: string;
  contato_id: string;
  qualificacao: QualificacaoParte;
  tipo?: string | null; // Classificação para o escritório
  principal: boolean;
  observacoes?: string;
  created_at: string;
  user_id: string;
}

export interface ProcessoMovimentacao {
  id: string;
  processo_id: string;
  tipo: TipoMovimentacao;
  descricao: string;
  data_movimentacao: string;
  observacoes?: string;
  anexos?: string[];
  created_at: string;
  user_id: string;
}

export interface ProcessoContrato {
  id: string;
  processo_id: string;
  user_id: string;
  titulo: string;
  descricao?: string;
  tipo: 'honorarios' | 'procuracao' | 'substabelecimento' | 'outros';
  valor_total?: number;
  data_inicio: string;
  data_fim?: string;
  status: 'rascunho' | 'aprovado' | 'assinado' | 'cancelado';
  cliente_contrato_id?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}