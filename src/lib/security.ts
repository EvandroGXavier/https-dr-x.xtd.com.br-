// Security utilities for input validation and rate limiting

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

// CNPJ/CPF validation
export const validateCpfCnpj = (value: string): boolean => {
  const cleanValue = value.replace(/[^0-9]/g, '');
  return cleanValue.length === 11 || cleanValue.length === 14;
};

// Enhanced sanitize input to prevent XSS and injection attacks
export const sanitizeInput = (input: string): string => {
  return input
    // Remove HTML tags and potential script content
    .replace(/<[^>]*>/g, '')
    // Remove script, style, and other dangerous tags
    .replace(/script|style|iframe|object|embed|form/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: and data: URIs
    .replace(/javascript:|data:/gi, '')
    // Remove potential SQL injection patterns
    .replace(/['";\\]/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, 1000);
};

// Rate limiting for form submissions
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    
    return true;
  }

  getRemainingTime(key: string): number {
    const attempts = this.attempts.get(key) || [];
    if (attempts.length < this.maxAttempts) return 0;
    
    const oldestAttempt = Math.min(...attempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, remainingTime);
  }
}

export const formRateLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
export const authRateLimiter = new RateLimiter(3, 300000); // 3 attempts per 5 minutes

// Enhanced password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um número');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate form data before submission
export const validateFormData = (data: Record<string, any>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for required fields
  if (data.email && !validateEmail(data.email)) {
    errors.push('Formato de email inválido');
  }

  if (data.cpf_cnpj && !validateCpfCnpj(data.cpf_cnpj)) {
    errors.push('CPF/CNPJ deve ter 11 ou 14 dígitos');
  }

  // Validate password if present
  if (data.password) {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }

  // Sanitize string fields
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'string') {
      data[key] = sanitizeInput(data[key]);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Security headers for API requests (updated for Lovable compatibility)
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Removed X-Frame-Options: DENY for Lovable iframe compatibility
};