export type StatusPatrimonio = 'ATIVO' | 'INATIVO';
export type NaturezaPatrimonio = 'DIREITO' | 'OBRIGACAO';

export interface Patrimonio {
  id: string;
  contato_id: string;
  tenant_id: string;
  descricao: string;
  natureza: NaturezaPatrimonio;
  valor_saldo?: number | null;
  status: StatusPatrimonio;
  data_vinculo?: string | null;
  data_desvinculo?: string | null;
  detalhes: Record<string, any>;
  observacao?: string | null;
  user_id: string;
  empresa_id?: string | null;
  filial_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatrimonioFormData {
  descricao: string;
  natureza: NaturezaPatrimonio;
  valor_saldo?: number;
  status: StatusPatrimonio;
  data_vinculo?: string;
  data_desvinculo?: string;
  detalhes: Record<string, any>;
  observacao?: string;
}

// Schemas para cada tipo de categoria de patrimônio
export interface DetalheImovel {
  matricula?: string;
  cartorio?: string;
  endereco_completo?: string;
  area_total?: number;
  area_construida?: number;
}

export interface DetalheVeiculo {
  placa?: string;
  renavam?: string;
  chassi?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
}

export interface DetalheFinanceiro {
  instituicao?: string;
  tipo_ativo?: string;
  numero_conta?: string;
  agencia?: string;
}

export interface DetalheEmpresa {
  cnpj?: string;
  razao_social?: string;
  percentual_participacao?: number;
  numero_contrato?: string;
}
