import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validarCPF, formatarCPF } from '@/lib/cpf';
import { validarCNPJ, formatarCNPJ } from '@/lib/cnpj';

interface CpfCnpjFieldProps {
  name: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  onTypeDetected?: (type: 'PF' | 'PJ' | undefined) => void;
  error?: string;
  placeholder?: string;
}

export function CpfCnpjField({
  name,
  label,
  value = '',
  onChange,
  onTypeDetected,
  error,
  placeholder = "000.000.000-00 ou 00.000.000/0000-00"
}: CpfCnpjFieldProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [documentType, setDocumentType] = useState<'PF' | 'PJ' | undefined>();
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) {
      setDocumentType(undefined);
      setIsValid(false);
      setDisplayValue('');
    } else if (digits.length <= 11) {
      setDocumentType('PF');
      setIsValid(digits.length === 11 && validarCPF(digits));
      setDisplayValue(formatarCPF(digits));
    } else {
      setDocumentType('PJ');
      setIsValid(digits.length === 14 && validarCNPJ(digits));
      setDisplayValue(formatarCNPJ(digits));
    }
  }, [value]);

  useEffect(() => {
    if (onTypeDetected) {
      onTypeDetected(documentType && isValid ? documentType : undefined);
    }
  }, [documentType, isValid, onTypeDetected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = inputValue.replace(/\D/g, '');
    
    // Limit to 14 digits (CNPJ)
    if (digits.length <= 14) {
      onChange(digits);
    }
  };

  const getStatusText = () => {
    if (!documentType) return '';
    if (documentType === 'PF') {
      return isValid ? '(CPF válido)' : '(CPF inválido)';
    }
    return isValid ? '(CNPJ válido)' : '(CNPJ inválido)';
  };

  const getStatusColor = () => {
    if (!documentType) return '';
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {documentType && (
          <span className={`ml-2 text-xs ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        )}
      </Label>
      <Input
        id={name}
        name={name}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        inputMode="numeric"
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
      {documentType && !isValid && (
        <p className="text-xs text-muted-foreground">
          {documentType === 'PF' 
            ? 'Digite 11 dígitos para CPF' 
            : 'Digite 14 dígitos para CNPJ'
          }
        </p>
      )}
    </div>
  );
}