export type TipoContato = 'lead' | 'pf' | 'pj';
export type TipoEndereco = 'Principal' | 'Residencial' | 'Cobrança' | 'Comercial' | 'Outro';
export type TipoMeioContato = 'Telefone' | 'Email' | 'Site' | 'WhatsApp' | 'Telegram' | 'Meet' | 'Outro';
export type Sexo = 'M' | 'F' | 'Outro';
export type EstadoCivil = 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo' | 'União Estável' | 'Separado';
export type Emprego = 'CTPS' | 'Autônomo' | 'MEI' | 'Empresário' | 'Aposentado' | 'Estudante' | 'Doméstico' | 'Outro';

export type TipoVinculo =
  | 'conjuge' | 'companheiro' | 'ex_conjuge' 
  | 'pai' | 'mae' | 'filho' | 'filha'
  | 'responsavel' | 'representante_legal' | 'tutor' | 'curador'
  | 'socio' | 'administrador' | 'procurador' | 'colaborador'
  | 'cliente' | 'fornecedor'
  | 'parte_autora' | 'parte_re' | 'testemunha' | 'inventariante'
  | 'outro';

// Tipos para as novas tabelas

export interface ContatoPF {
  id: string;
  contato_id: string;
  tenant_id?: string;
  empresa_id?: string;
  filial_id?: string;
  nome_completo?: string;
  cpf?: string;
  rg?: string;
  orgao_expedidor?: string;
  estado_civil?: EstadoCivil;
  sexo?: Sexo;
  data_nascimento?: string;
  nacionalidade?: string;
  naturalidade?: string;
  profissao?: string;
  renda?: number;
  emprego?: Emprego;
  ctps?: string;
  cnis?: string;
  pis?: string;
  pf_obs?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContatoPJ {
  id: string;
  contato_id: string;
  empresa_id?: string;
  filial_id?: string;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  natureza_juridica?: string;
  porte?: string;
  data_abertura?: string;
  regime_tributario?: string;
  cnae_principal?: string;
  cnaes_secundarios?: string[];
  capital_social?: number;
  situacao_cadastral?: string;
  situacao_data?: string;
  situacao_motivo?: string;
  matriz_filial?: string;
  municipio_ibge?: string;
  ddd_1?: string;
  telefone_1?: string;
  ddd_2?: string;
  telefone_2?: string;
  created_at: string;
  updated_at: string;
}

export interface ContatoEndereco {
  id: string;
  contato_id: string;
  empresa_id?: string;
  filial_id?: string;
  tipo: TipoEndereco;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  ibge?: string;
  principal: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface ContatoMeioContato {
  id: string;
  contato_id: string;
  empresa_id?: string;
  filial_id?: string;
  tipo: TipoMeioContato;
  valor: string;
  observacao?: string;
  principal: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContatoVinculo {
  id: string;
  contato_id: string;
  vinculado_id: string;
  tenant_id: string;
  empresa_id?: string;
  filial_id?: string;
  tipo_vinculo: TipoVinculo;
  bidirecional: boolean;
  observacao?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  // Dados do contato vinculado (via join)
  vinculado_nome?: string;
  vinculado_celular?: string;
  vinculado_email?: string;
}

export interface ContatoDocumento {
  id: string;
  contato_id: string;
  empresa_id?: string;
  filial_id?: string;
  modelo_id: string;
  documento_id: string;
  versao: number;
  compartilhar_com_cliente: boolean;
  created_at: string;
  updated_at: string;
  // Dados do modelo (via join)
  modelo_titulo?: string;
  modelo_categoria?: string;
}

export interface ContatoFinanceiroConfig {
  id: string;
  contato_id: string;
  empresa_id?: string;
  filial_id?: string;
  limite_credito?: number;
  validade_limite?: string;
  forma_pagamento_padrao?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix_tipo?: string;
  pix_chave?: string;
  observacao?: string;
  created_at: string;
  updated_at: string;
}

// Tipo extendido do contato base com observacao
export interface ContatoExtendido {
  id: string;
  user_id: string;
  tenant_id: string;
  nome?: string;
  nome_fantasia: string;
  cpf_cnpj?: string | null;
  email?: string | null;
  celular: string;
  telefone?: string | null;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
  observacao?: string | null; // Nova coluna
  data_nascimento?: string | null; // Data de nascimento
  created_at: string;
  updated_at: string;
  empresa_id?: string | null;
  filial_id?: string | null;
  // Dados relacionados
  contato_pf?: { nome_completo: string }[];
  contato_pj?: { razao_social: string; nome_fantasia: string }[];
  contato_enderecos?: ContatoEndereco[];
}

// Tipo completo com todos os detalhes
export interface ContatoCompleto extends ContatoExtendido {
  pessoa_fisica?: ContatoPF;
  pessoa_juridica?: ContatoPJ;
  enderecos?: ContatoEndereco[];
  meios_contato?: ContatoMeioContato[];
  vinculos?: ContatoVinculo[];
  documentos?: ContatoDocumento[];
  financeiro_config?: ContatoFinanceiroConfig;
}

// Enums para selects
export const TIPOS_ENDERECO: TipoEndereco[] = ['Principal', 'Residencial', 'Cobrança', 'Comercial', 'Outro'];
export const TIPOS_MEIO_CONTATO: TipoMeioContato[] = ['Telefone', 'Email', 'Site', 'WhatsApp', 'Telegram', 'Meet', 'Outro'];
export const SEXOS: Sexo[] = ['M', 'F', 'Outro'];
export const ESTADOS_CIVIS: EstadoCivil[] = ['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável', 'Separado'];
export const TIPOS_EMPREGO: Emprego[] = ['CTPS', 'Autônomo', 'MEI', 'Empresário', 'Aposentado', 'Estudante', 'Doméstico', 'Outro'];

export const TIPOS_VINCULO: { value: TipoVinculo; label: string; categoria: string }[] = [
  // Família
  { value: 'conjuge', label: 'Cônjuge', categoria: 'Família' },
  { value: 'companheiro', label: 'Companheiro(a)', categoria: 'Família' },
  { value: 'ex_conjuge', label: 'Ex-cônjuge', categoria: 'Família' },
  { value: 'pai', label: 'Pai', categoria: 'Família' },
  { value: 'mae', label: 'Mãe', categoria: 'Família' },
  { value: 'filho', label: 'Filho', categoria: 'Família' },
  { value: 'filha', label: 'Filha', categoria: 'Família' },
  
  // Legal
  { value: 'responsavel', label: 'Responsável Legal', categoria: 'Legal' },
  { value: 'representante_legal', label: 'Representante Legal', categoria: 'Legal' },
  { value: 'tutor', label: 'Tutor', categoria: 'Legal' },
  { value: 'curador', label: 'Curador', categoria: 'Legal' },
  { value: 'procurador', label: 'Procurador', categoria: 'Legal' },
  
  // Empresa
  { value: 'socio', label: 'Sócio', categoria: 'Empresa' },
  { value: 'administrador', label: 'Administrador', categoria: 'Empresa' },
  { value: 'colaborador', label: 'Colaborador', categoria: 'Empresa' },
  
  // Comercial
  { value: 'cliente', label: 'Cliente', categoria: 'Comercial' },
  { value: 'fornecedor', label: 'Fornecedor', categoria: 'Comercial' },
  
  // Judicial
  { value: 'parte_autora', label: 'Parte Autora', categoria: 'Judicial' },
  { value: 'parte_re', label: 'Parte Requerida', categoria: 'Judicial' },
  { value: 'testemunha', label: 'Testemunha', categoria: 'Judicial' },
  { value: 'inventariante', label: 'Inventariante', categoria: 'Judicial' },
  
  // Outros
  { value: 'outro', label: 'Outro', categoria: 'Outros' }
];