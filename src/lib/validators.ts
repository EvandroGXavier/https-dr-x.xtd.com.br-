import { z } from 'zod';
import { 
  TIPOS_ENDERECO, 
  TIPOS_MEIO_CONTATO, 
  SEXOS, 
  ESTADOS_CIVIS, 
  TIPOS_EMPREGO, 
  TIPOS_VINCULO 
} from '@/types/contatos';

// CPF/CNPJ validation
export const validateCPF = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(digits[10]);
};

export const validateCNPJ = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits[12])) return false;
  
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  return digit2 === parseInt(digits[13]);
};

// Zod schemas
// Helper function to validate and sanitize coordinates
export const sanitizeCoordinate = (value: any, type: 'latitude' | 'longitude'): number | null => {
  if (value === null || value === undefined || value === '' || value === 0) return null;
  
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  
  if (isNaN(num)) return null;
  
  if (type === 'latitude') {
    // Latitude must be between -90 and 90
    if (num < -90 || num > 90) return null;
    return Number(num.toFixed(8)); // Limit to 8 decimal places
  } else {
    // Longitude must be between -180 and 180
    if (num < -180 || num > 180) return null;
    return Number(num.toFixed(8)); // Limit to 8 decimal places
  }
};

export const enderecoSchema = z.object({
  tipo: z.enum(['Principal', 'Residencial', 'Cobrança', 'Comercial', 'Outro']),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  ibge: z.string().optional(),
  principal: z.boolean().default(false),
  latitude: z.any().transform((val) => sanitizeCoordinate(val, 'latitude')).optional(),
  longitude: z.any().transform((val) => sanitizeCoordinate(val, 'longitude')).optional(),
}).refine((data) => {
  // Additional validation to ensure coordinates are within valid ranges
  if (data.latitude !== null && data.latitude !== undefined) {
    if (data.latitude < -90 || data.latitude > 90) {
      return false;
    }
  }
  if (data.longitude !== null && data.longitude !== undefined) {
    if (data.longitude < -180 || data.longitude > 180) {
      return false;
    }
  }
  return true;
}, {
  message: "Coordenadas geográficas inválidas. Latitude deve estar entre -90 e 90, longitude entre -180 e 180"
});

export const pfSchema = z.object({
  nome_completo: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().refine(validateCPF, 'CPF inválido').optional(),
  rg: z.string().optional(),
  orgao_expedidor: z.string().optional(),
  estado_civil: z.enum(['Solteiro', 'Casado', 'Divorciado', 'Viúvo', 'União Estável', 'Separado']).optional(),
  sexo: z.enum(['M', 'F', 'Outro']).optional(),
  data_nascimento: z.string().optional(),
  nacionalidade: z.string().optional(),
  naturalidade: z.string().optional(),
  profissao: z.string().optional(),
  renda: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === '') return undefined;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        // Import parseCurrency from formatters
        const { parseCurrency } = require('@/lib/formatters');
        const num = parseCurrency(val);
        return num === 0 && val.trim() === '' ? undefined : num;
      }
      return undefined;
    },
    z.union([z.number().min(0).max(1000000, 'Renda máxima é R$ 1.000.000,00'), z.undefined()])
  ).optional(),
  emprego: z.enum(['CTPS', 'Autônomo', 'MEI', 'Empresário', 'Aposentado', 'Estudante', 'Doméstico', 'Outro']).optional(),
  ctps: z.string().optional(),
  cnis: z.string().optional(),
  pis: z.string().optional(),
  pf_obs: z.string().optional(),
});

export const pjSchema = z.object({
  cnpj: z.string().refine(validateCNPJ, 'CNPJ inválido').optional(),
  razao_social: z.string().min(1, 'Razão social é obrigatória'),
  nome_fantasia: z.string().optional(),
  natureza_juridica: z.string().optional(),
  porte: z.string().optional(),
  data_abertura: z.string().optional(),
  regime_tributario: z.string().optional(),
  cnae_principal: z.string().optional(),
  cnaes_secundarios: z.array(z.string()).optional(),
  capital_social: z.union([z.number(), z.string()]).optional(),
  situacao_cadastral: z.string().optional(),
  situacao_data: z.string().optional(),
  situacao_motivo: z.string().optional(),
  matriz_filial: z.string().optional(),
  municipio_ibge: z.string().optional(),
});

export const meioContatoSchema = z.object({
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  observacao: z.string().optional(),
  principal: z.boolean().default(false),
});

export const vinculoSchema = z.object({
  vinculado_id: z.string().uuid('ID do contato vinculado é obrigatório'),
  tipo_vinculo: z.string(),
  bidirecional: z.boolean().default(true),
  observacao: z.string().optional(),
});

export const financeiroConfigSchema = z.object({
  limite_credito: z.number().positive().optional(),
  validade_limite: z.string().optional(),
  forma_pagamento_padrao: z.string().optional(),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  pix_tipo: z.enum(['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'CHAVE_ALEATORIA']).optional(),
  pix_chave: z.string().optional(),
  observacao: z.string().optional(),
});