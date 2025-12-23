// Enhanced data security utilities for sensitive information
import { supabase } from '@/integrations/supabase/client';

// Data masking utilities for frontend display
export const maskCpfCnpj = (cpfCnpj: string): string => {
  if (!cpfCnpj || cpfCnpj.length < 4) return cpfCnpj;
  
  const numbers = cpfCnpj.replace(/[^0-9]/g, '');
  
  if (numbers.length === 11) {
    // CPF: show only last 2 digits
    return '***.***.***-' + numbers.slice(-2);
  }
  
  if (numbers.length === 14) {
    // CNPJ: show only last 2 digits
    return '**.***.***/****-' + numbers.slice(-2);
  }
  
  // Other formats: mask all but last 2 characters
  return '*'.repeat(cpfCnpj.length - 2) + cpfCnpj.slice(-2);
};

export const maskEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  
  if (username.length <= 2) {
    return '*'.repeat(username.length) + '@' + domain;
  }
  
  return username[0] + '*'.repeat(username.length - 2) + username.slice(-1) + '@' + domain;
};

export const maskPhone = (phone: string): string => {
  if (!phone || phone.length < 4) return phone;
  
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

// Secure data access patterns
export class SecureDataAccess {
  // Log sensitive data access
  static async logDataAccess(
    tableName: string,
    recordId: string | null,
    accessedFields: string[],
    accessType: string = 'SELECT'
  ) {
    try {
      await supabase.rpc('log_sensitive_data_access', {
        table_name: tableName,
        record_id: recordId,
        accessed_fields: accessedFields,
        access_type: accessType
      });
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }

  // Detect and log suspicious access patterns
  static async checkSuspiciousAccess() {
    try {
      await supabase.rpc('detect_suspicious_data_access');
    } catch (error) {
      console.error('Failed to check suspicious access:', error);
    }
  }

  // Get contacts with automatic security logging and masking
  static async getSecureContacts(limit: number = 100, offset: number = 0) {
    try {
      const { data, error } = await supabase.rpc('get_contacts_safe', {
        limit_count: limit,
        offset_count: offset
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Secure contacts access failed:', error);
      return { data: null, error };
    }
  }

  // Enhanced validation for sensitive data before submission
  static validateSensitiveData(data: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate CPF/CNPJ format
    if (data.cpf_cnpj) {
      const numbers = data.cpf_cnpj.replace(/[^0-9]/g, '');
      if (numbers.length !== 11 && numbers.length !== 14) {
        errors.push('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
      }
    }

    // Validate email format
    if (data.email) {
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Formato de email inválido');
      }
    }

    // Validate phone format
    if (data.celular || data.telefone) {
      const phone = data.celular || data.telefone;
      const phoneNumbers = phone.replace(/[^0-9]/g, '');
      if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
        errors.push('Telefone deve ter 10 ou 11 dígitos');
      }
    }

    // Check for suspicious data patterns
    const suspiciousPatterns = [
      /script/gi,
      /javascript/gi,
      /vbscript/gi,
      /onload/gi,
      /onerror/gi,
      /<[^>]*>/g
    ];

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(value)) {
            errors.push(`Campo ${key} contém caracteres suspeitos`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Rate limiting for sensitive operations
  private static accessCounts = new Map<string, { count: number; resetTime: number }>();

  static checkRateLimit(operation: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `${operation}_${this.getCurrentUserId()}`;
    const current = this.accessCounts.get(key);

    if (!current || now > current.resetTime) {
      this.accessCounts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= maxAttempts) {
      return false;
    }

    current.count++;
    return true;
  }

  private static getCurrentUserId(): string {
    // Get current user ID or use session ID as fallback
    return supabase.auth.getUser().then(u => u.data.user?.id || 'anonymous').toString();
  }
}

  // Enhanced password security utilities
export const PasswordSecurity = {
  // Validate password strength with enhanced rules
  async validatePassword(password: string): Promise<{ isValid: boolean; errors: string[]; score: number }> {
    try {
      const { data, error } = await supabase.rpc('enhanced_password_validation', {
        password
      });

      if (error) throw error;

      // Type-safe handling of the response
      const result = data as { isValid: boolean; errors: string[]; strength_score: number };

      return {
        isValid: result.isValid,
        errors: result.errors || [],
        score: result.strength_score || 0
      };
    } catch (error) {
      console.error('Password validation failed:', error);
      
      // Fallback validation
      const errors: string[] = [];
      
      if (password.length < 8) errors.push('Senha deve ter pelo menos 8 caracteres');
      if (!/[A-Z]/.test(password)) errors.push('Senha deve conter ao menos uma letra maiúscula');
      if (!/[a-z]/.test(password)) errors.push('Senha deve conter ao menos uma letra minúscula');
      if (!/[0-9]/.test(password)) errors.push('Senha deve conter ao menos um número');
      if (!/[^A-Za-z0-9]/.test(password)) errors.push('Senha deve conter ao menos um caractere especial');

      return {
        isValid: errors.length === 0,
        errors,
        score: Math.max(0, 100 - (errors.length * 20))
      };
    }
  },

  // Generate secure password suggestions
  generateSecurePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
};

// Data retention and cleanup utilities
export const DataRetention = {
  // Schedule cleanup of old sensitive data
  async scheduleCleanup(): Promise<void> {
    try {
      await supabase.rpc('cleanup_old_sensitive_data');
    } catch (error) {
      console.error('Data cleanup failed:', error);
    }
  },

  // Check data retention compliance
  async checkRetentionCompliance(): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Check for old audit logs
      const { data: oldLogs } = await supabase
        .from('security_audit_log')
        .select('id')
        .lt('created_at', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString())
        .limit(1);

      if (oldLogs && oldLogs.length > 0) {
        issues.push('Existem logs de auditoria com mais de 2 anos que devem ser removidos');
      }

      return {
        compliant: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Retention compliance check failed:', error);
      return {
        compliant: false,
        issues: ['Falha ao verificar compliance de retenção de dados']
      };
    }
  }
};

// Security monitoring utilities
export const SecurityMonitoring = {
  // Get security dashboard data
  async getSecurityOverview(): Promise<{
    recentSuspiciousActivity: number;
    failedAuthAttempts: number;
    sensitiveDataAccesses: number;
    securityScore: number;
  }> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [suspiciousActivity, sensitiveAccesses] = await Promise.all([
        supabase
          .from('security_audit_log')
          .select('id')
          .eq('event_type', 'suspicious_activity')
          .gte('created_at', oneDayAgo),
        
        supabase
          .from('security_audit_log')
          .select('id')
          .eq('event_type', 'sensitive_data_access')
          .gte('created_at', oneDayAgo)
      ]);

      const suspiciousCount = suspiciousActivity.data?.length || 0;
      const sensitiveCount = sensitiveAccesses.data?.length || 0;

      // Calculate security score (0-100)
      let securityScore = 100;
      if (suspiciousCount > 0) securityScore -= Math.min(50, suspiciousCount * 10);
      if (sensitiveCount > 100) securityScore -= Math.min(30, (sensitiveCount - 100) * 0.3);

      return {
        recentSuspiciousActivity: suspiciousCount,
        failedAuthAttempts: 0, // This would need auth logs access
        sensitiveDataAccesses: sensitiveCount,
        securityScore: Math.max(0, securityScore)
      };
    } catch (error) {
      console.error('Security overview failed:', error);
      return {
        recentSuspiciousActivity: 0,
        failedAuthAttempts: 0,
        sensitiveDataAccesses: 0,
        securityScore: 0
      };
    }
  }
};
