// Formatação e máscaras para dados de contato

export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return value;
};

export const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return value;
};

export const formatCPFCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return formatCPF(value);
  }
  return formatCNPJ(value);
};

export const formatCEP = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  // Remove 0 do DDD se existir
  const cleanDigits = digits.startsWith('0') ? digits.substring(1) : digits;
  return `55${cleanDigits}`;
};

export const formatPhoneForTel = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  return `+55${digits}`;
};

export const normalizeCPFCNPJ = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const normalizePhone = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const normalizeCEP = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const normalizeEmail = (value: string): string => {
  return value.toLowerCase().trim();
};

export const normalizeURL = (value: string): string => {
  let url = value.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  if (!value || value.trim() === '') return 0;
  const s = value.trim();

  // 1) Tente interpretar por dígitos (robusto para máscaras tipo "R$ 1,00")
  const digitsOnly = s.replace(/[^\d]/g, '');
  if (digitsOnly.length > 0 && (s.includes('R$') || s.includes(',') || /\d\.\d{3}/.test(s))) {
    // Interpreta sempre os 2 últimos dígitos como centavos
    const intVal = parseInt(digitsOnly, 10);
    return (isNaN(intVal) ? 0 : intVal) / 100;
  }

  // 2) Fallback: números simples como "1000" ou "1234.56"
  const normalized = s
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
};