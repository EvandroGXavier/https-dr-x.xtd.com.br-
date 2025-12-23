export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
  icone: string;
  grupo?: string;
}

export interface TransacaoFinanceira {
  id: string;
  contato: {
    id: string;
    nome: string;
    cpf_cnpj: string;
    email?: string;
    telefone?: string;
    meios_contato?: Array<{
      tipo: string;
      valor: string;
    }>;
  };
  tipo: 'receber' | 'pagar';
  valor_documento: number;
  valor_recebido?: number;
  data_emissao: string;
  data_vencimento: string;
  data_liquidacao?: string;
  situacao: 'aberta' | 'recebida' | 'paga' | 'vencida' | 'cancelada';
  numero_documento: string;
  numero_banco?: string;
  categoria: string;
  historico: string;
  conta_financeira: string;
  conta_financeira_id?: string;
  data_vencimento_original?: string;
  forma_pagamento: string;
  data_competencia?: string;
  origem_tipo?: string;
  origem_id?: string;
  etiquetas: Etiqueta[];
}

export interface FinanceiroFilters {
  searchTerm?: string;
  tipo?: 'todas' | 'a-receber' | 'a-pagar' | 'recebidas' | 'pagas';
  tagsEquals?: string[];
  tagsNotEquals?: string[];
  situacao?: string;
  categoria?: string;
  conta_financeira?: string;
  forma_pagamento?: string;
  valor_min?: number;
  valor_max?: number;
  data_inicio?: string;
  data_fim?: string;
  vencidas?: boolean;
  saldoRealizar?: boolean;
}