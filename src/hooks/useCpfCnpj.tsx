import { useMemo } from 'react';
import { onlyDigits } from '@/lib/cpf';
import { validarCPF, formatarCPF } from '@/lib/cpf';
import { validarCNPJ, formatarCNPJ } from '@/lib/cnpj';

export type CpfCnpjType = 'empty' | 'cpf' | 'cnpj';

export interface UseCpfCnpjReturn {
  kind: CpfCnpjType;
  masked: string;
  raw: string;
  isValid: boolean;
  format: (value: string) => string;
}

export function useCpfCnpj(value: string): UseCpfCnpjReturn {
  return useMemo(() => {
    const raw = onlyDigits(value);
    
    if (raw.length === 0) {
      return {
        kind: 'empty',
        masked: '',
        raw: '',
        isValid: false,
        format: (v: string) => onlyDigits(v)
      };
    }
    
    if (raw.length <= 11) {
      const masked = formatarCPF(raw);
      const isValid = raw.length === 11 && validarCPF(raw);
      
      return {
        kind: 'cpf',
        masked,
        raw,
        isValid,
        format: formatarCPF
      };
    }
    
    // 12+ digits = CNPJ
    const masked = formatarCNPJ(raw);
    const isValid = raw.length === 14 && validarCNPJ(raw);
    
    return {
      kind: 'cnpj',
      masked,
      raw,
      isValid,
      format: formatarCNPJ
    };
  }, [value]);
}