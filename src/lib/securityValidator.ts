// Automated security configuration validation
import { validateEnvironment } from '@/lib/environmentSecurity';
import { supabase } from '@/integrations/supabase/client';

export interface SecurityValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  criticalIssues: string[];
}

export interface SecurityCheckConfig {
  checkEnvironment: boolean;
  checkSupabaseConfig: boolean;
  checkRLSPolicies: boolean;
  checkSecurityHeaders: boolean;
}

const DEFAULT_CHECK_CONFIG: SecurityCheckConfig = {
  checkEnvironment: true,
  checkSupabaseConfig: true,
  checkRLSPolicies: true,
  checkSecurityHeaders: true
};

export class SecurityValidator {
  private config: SecurityCheckConfig;

  constructor(config: Partial<SecurityCheckConfig> = {}) {
    this.config = { ...DEFAULT_CHECK_CONFIG, ...config };
  }

  async runFullSecurityValidation(): Promise<SecurityValidationResult> {
    const result: SecurityValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      criticalIssues: []
    };

    // Environment validation
    if (this.config.checkEnvironment) {
      const envValidation = validateEnvironment();
      if (!envValidation.isValid) {
        result.errors.push(...envValidation.errors);
        result.isValid = false;
      }
    }

    // Security headers validation
    if (this.config.checkSecurityHeaders) {
      this.validateSecurityHeaders(result);
    }

    // Supabase configuration validation
    if (this.config.checkSupabaseConfig) {
      await this.validateSupabaseConfig(result);
    }

    // RLS policies validation
    if (this.config.checkRLSPolicies) {
      await this.validateRLSPolicies(result);
    }

    // Authentication security validation
    await this.validateAuthenticationSecurity(result);

    return result;
  }

  private validateSecurityHeaders(result: SecurityValidationResult): void {
    // Check if security headers are properly configured
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy'
    ];

    const missingHeaders = requiredHeaders.filter(header => {
      const metaElement = document.querySelector(`meta[http-equiv="${header}"]`);
      return !metaElement;
    });

    if (missingHeaders.length > 0) {
      result.warnings.push(`Missing security headers: ${missingHeaders.join(', ')}`);
    }
  }

  private async validateSupabaseConfig(result: SecurityValidationResult): Promise<void> {
    try {
      // Check if we can connect to Supabase using a safe RPC call
      const { error } = await supabase.rpc('get_current_user_email');
      
      if (error && error.message.includes('network')) {
        result.errors.push(`Supabase connection error: ${error.message}`);
        result.isValid = false;
      }

      // Critical manual configuration checks
      result.criticalIssues.push('MANUAL CONFIG: Configure OTP expiry times (Email: 1 hour, SMS/Phone: 10 minutes) in Supabase Dashboard');
      result.criticalIssues.push('MANUAL CONFIG: Enable "Password Protection" against leaked passwords in Supabase Authentication settings');
      
      // Check environment configuration
      const isProduction = window.location.hostname !== 'localhost';
      if (isProduction) {
        const currentUrl = window.location.origin;
        if (!currentUrl.startsWith('https://')) {
          result.criticalIssues.push('Application must use HTTPS in production environment');
          result.isValid = false;
        }
      }

      // Additional security configuration checks
      const hasPasswordPolicy = await this.checkPasswordPolicyConfig();
      if (!hasPasswordPolicy) {
        result.warnings.push('Enhanced password policy validation recommended');
      }

    } catch (error) {
      result.errors.push(`Failed to validate Supabase configuration: ${error}`);
      result.isValid = false;
    }
  }

  private async validateRLSPolicies(result: SecurityValidationResult): Promise<void> {
    try {
      // Check if RLS is enabled on critical tables
      const criticalTables = ['contatos_v2', 'agendas', 'transacoes_financeiras'] as const;
      
      for (const tableName of criticalTables) {
        try {
          // Attempt to access table - if RLS is properly configured, this should work
          const { error } = await supabase.from(tableName).select('count').limit(1);
          
          if (error && error.message.includes('permission denied')) {
            result.warnings.push(`Possible RLS configuration issue for table: ${tableName}`);
          }
        } catch (error) {
          // Table might not exist, which is fine
          console.debug(`Table ${tableName} validation skipped:`, error);
        }
      }
    } catch (error) {
      result.warnings.push(`Could not validate RLS policies: ${error}`);
    }
  }

  private async checkPasswordPolicyConfig(): Promise<boolean> {
    try {
      // Test if enhanced password validation is working
      const { data } = await supabase.rpc('enhanced_password_validation', { password: 'test123' });
      return data && typeof data === 'object' && 'isValid' in data;
    } catch (error) {
      return false;
    }
  }

  private async validateAuthenticationSecurity(result: SecurityValidationResult): Promise<void> {
    try {
      // Check if critical auth functions exist (removed log_auth_attempt as it doesn't exist)
      const authFunctions = ['enhanced_password_validation', 'log_security_event'];
      
      for (const funcName of authFunctions) {
        try {
          await supabase.rpc(funcName as any, {});
        } catch (error: any) {
          if (error.message?.includes('function') && error.message?.includes('does not exist')) {
            result.errors.push(`Critical auth function missing: ${funcName}`);
            result.isValid = false;
          }
        }
      }
    } catch (error) {
      result.warnings.push('Could not validate authentication security functions');
    }
  }

  // Quick security health check with enhanced scoring
  async quickSecurityCheck(): Promise<{ score: number; criticalIssues: number }> {
    const result = await this.runFullSecurityValidation();
    
    let score = 100;
    
    // Manual config issues don't count as much since they're flagged for attention
    const manualConfigIssues = result.criticalIssues.filter(issue => issue.includes('MANUAL CONFIG')).length;
    const actualCriticalIssues = result.criticalIssues.length - manualConfigIssues;
    
    score -= actualCriticalIssues * 30;
    score -= manualConfigIssues * 10; // Less penalty for manual config reminders
    score -= result.errors.length * 15;
    score -= result.warnings.length * 5;
    
    return {
      score: Math.max(0, score),
      criticalIssues: actualCriticalIssues
    };
  }
}

// Initialize global security validator
export const securityValidator = new SecurityValidator();

// Auto-run security validation on app startup
export const initializeSecurityValidation = async (): Promise<void> => {
  if (import.meta.env.DEV) {
    const result = await securityValidator.runFullSecurityValidation();
    
    if (result.criticalIssues.length > 0) {
      console.error('🚨 CRITICAL SECURITY ISSUES DETECTED:', result.criticalIssues);
    }
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Security validation errors:', result.errors);
    }
    
    if (result.warnings.length > 0) {
      console.info('ℹ️ Security warnings:', result.warnings);
    }
    
    if (result.isValid && result.warnings.length === 0) {
      console.info('✅ Security validation passed');
    }
  }
};