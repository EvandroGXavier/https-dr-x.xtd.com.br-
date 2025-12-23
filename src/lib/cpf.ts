export function validarCPF(cpf: string): boolean {
  const numeros = cpf.replace(/[^\d]/g, '');
  
  if (numeros.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(numeros)) return false;
  
  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(numeros[i]) * (10 - i);
  }
  let digito1 = (soma * 10) % 11;
  if (digito1 === 10) digito1 = 0;
  
  if (parseInt(numeros[9]) !== digito1) return false;
  
  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(numeros[i]) * (11 - i);
  }
  let digito2 = (soma * 10) % 11;
  if (digito2 === 10) digito2 = 0;
  
  return parseInt(numeros[10]) === digito2;
}

export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/[^\d]/g, '');
  
  if (numeros.length === 11) {
    return numeros.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }
  
  return cpf;
}

export function onlyDigits(value: string): string {
  return value.replace(/[^\d]/g, '');
}