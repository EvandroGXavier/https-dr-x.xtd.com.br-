import { supabase } from "@/integrations/supabase/client";

export interface DadosEmpresa {
  nome: string;
  nome_fantasia?: string;
  email: string;
  telefone: string;
  endereco: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade: string;
  estado: string;
  uf?: string;
  cep: string;
  cpf_cnpj?: string;
  situacao?: string;
  atividade_principal?: string;
  data_abertura?: string;
  porte?: string;
  natureza_juridica?: string;
  ativo?: boolean;
  // Campos adicionais de PJ
  situacao_cadastral?: string;
  porte_empresa?: string;
  cnae_principal?: string;
  cnae_secundarias?: string;
  capital_social?: number;
  tipo_logradouro?: string;
  motivo_situacao_cadastral?: string;
  data_situacao_cadastral?: string;
  municipio_ibge?: string;
  ddd_telefone_1?: string;
  ddd_telefone_2?: string;
  ddd_fax?: string;
  qualificacao_responsavel?: string;
  identificador_matriz_filial?: string;
  situacao_especial?: string;
  data_situacao_especial?: string;
  // QSA - Quadro de Sócios e Administradores (quando disponível)
  qsa?: Array<{ nome: string; qual?: string; pais?: string }>;
}


export async function consultarCNPJ(cnpj: string): Promise<DadosEmpresa> {
  try {
    const { data, error } = await supabase.functions.invoke('consultar-cnpj', {
      body: { cnpj }
    });

    if (error) {
      throw new Error(error.message || 'Erro na consulta do CNPJ');
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na consulta do CNPJ');
    }

    return data.dados;
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    throw error;
  }
}

export function formatarCNPJ(cnpj: string): string {
  // Remove todos os caracteres não numéricos
  const numeros = cnpj.replace(/[^\d]/g, '');
  
  // Aplica a formatação XX.XXX.XXX/XXXX-XX
  if (numeros.length === 14) {
    return numeros.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  }
  
  return cnpj;
}

export function validarCNPJ(cnpj: string): boolean {
  const numeros = cnpj.replace(/[^\d]/g, '');
  
  if (numeros.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(numeros)) return false;
  
  // Validação do dígito verificador
  let soma = 0;
  let peso = 2;
  
  // Primeiro dígito verificador
  for (let i = 11; i >= 0; i--) {
    soma += parseInt(numeros[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  if (parseInt(numeros[12]) !== digito1) return false;
  
  // Segundo dígito verificador
  soma = 0;
  peso = 2;
  
  for (let i = 12; i >= 0; i--) {
    soma += parseInt(numeros[i]) * peso;
    peso = peso === 9 ? 2 : peso + 1;
  }
  
  let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  
  return parseInt(numeros[13]) === digito2;
}