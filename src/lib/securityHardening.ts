// Advanced security hardening utilities
import { supabase } from '@/integrations/supabase/client';

export interface SecurityHardeningConfig {
  enableAdvancedCSP: boolean;
  enableSecurityMonitoring: boolean;
  enableComplianceChecks: boolean;
  monitoringThresholds: {
    maxFailedLogins: number;
    maxBulkOperations: number;
    suspiciousPatternWindow: number;
  };
}

export const DEFAULT_HARDENING_CONFIG: SecurityHardeningConfig = {
  enableAdvancedCSP: true,
  enableSecurityMonitoring: true,
  enableComplianceChecks: true,
  monitoringThresholds: {
    maxFailedLogins: 5,
    maxBulkOperations: 100,
    suspiciousPatternWindow: 3600000, // 1 hour
  }
};

export class SecurityHardeningManager {
  private config: SecurityHardeningConfig;
  private complianceCache: Map<string, { result: boolean; timestamp: number }> = new Map();

  constructor(config: Partial<SecurityHardeningConfig> = {}) {
    this.config = { ...DEFAULT_HARDENING_CONFIG, ...config };
  }

  // Enhanced Content Security Policy
  public generateAdvancedCSP(): string {
    const policies = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.dr-x.xtd.com.br",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.dr-x.xtd.com.br wss://api.dr-x.xtd.com.br",
      "media-src 'self' blob: data:",
      "frame-src 'self' https://api.dr-x.xtd.com.br blob: data:",
      "child-src 'self' https://api.dr-x.xtd.com.br blob: data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];

    return policies.join('; ');
  }

  // Apply advanced security headers
  public applySecurityHeaders(): void {
    if (!this.config.enableAdvancedCSP) return;

    const headers = [
      { name: 'Content-Security-Policy', content: this.generateAdvancedCSP() },
      { name: 'X-Frame-Options', content: 'DENY' },
      { name: 'X-Content-Type-Options', content: 'nosniff' },
      { name: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
      { name: 'X-XSS-Protection', content: '1; mode=block' },
      { name: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' },
      { name: 'Strict-Transport-Security', content: 'max-age=31536000; includeSubDomains' }
    ];

    headers.forEach(header => {
      const existingMeta = document.querySelector(`meta[http-equiv="${header.name}"]`);
      if (!existingMeta) {
        const meta = document.createElement('meta');
        meta.setAttribute('http-equiv', header.name);
        meta.setAttribute('content', header.content);
        document.head.appendChild(meta);
      }
    });
  }

  // Monitor and log compliance violations
  public async checkCompliance(checkType: string): Promise<boolean> {
    const cacheKey = `${checkType}_compliance`;
    const cached = this.complianceCache.get(cacheKey);
    
    // Use cache if fresh (5 minutes)
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.result;
    }

    let isCompliant = true;

    try {
      switch (checkType) {
        case 'rls_enabled':
          isCompliant = await this.validateRLSCompliance();
          break;
        case 'auth_security':
          isCompliant = await this.validateAuthSecurityCompliance();
          break;
        case 'data_encryption':
          isCompliant = await this.validateDataEncryptionCompliance();
          break;
        default:
          console.warn(`Unknown compliance check type: ${checkType}`);
      }

      // Cache result
      this.complianceCache.set(cacheKey, {
        result: isCompliant,
        timestamp: Date.now()
      });

      if (!isCompliant) {
        try {
          await supabase.rpc('log_security_event', {
            event_type: 'compliance_violation',
            event_description: `Compliance check failed: ${checkType}`,
            metadata: {
              checkType,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('Failed to log compliance violation:', error);
        }
      }

    } catch (error) {
      console.error(`Compliance check failed for ${checkType}:`, error);
      isCompliant = false;
    }

    return isCompliant;
  }

  private async validateRLSCompliance(): Promise<boolean> {
    try {
      // Test that RLS is working by attempting unauthorized access
      const { error } = await supabase.from('contatos_v2').select('*').limit(1);
      
      // If no error and user not authenticated, RLS might be misconfigured
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !error) {
        return false; // RLS should have blocked this
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  private async validateAuthSecurityCompliance(): Promise<boolean> {
    try {
      // Check if security functions are available
      const testPassword = 'TestPassword123!';
      const { data, error } = await supabase.rpc('enhanced_password_validation', { 
        password: testPassword 
      });
      
      return !error && data && typeof data === 'object';
    } catch (error) {
      return false;
    }
  }

  private async validateDataEncryptionCompliance(): Promise<boolean> {
    try {
      // Test encryption functions
      const testData = 'sensitive_test_data';
      const { data: encrypted, error: encryptError } = await supabase.rpc('encrypt_sensitive_data', { 
        data: testData 
      });
      
      if (encryptError || !encrypted) return false;

      const { data: decrypted, error: decryptError } = await supabase.rpc('decrypt_sensitive_data', { 
        encrypted_data: encrypted 
      });
      
      return !decryptError && decrypted === testData;
    } catch (error) {
      return false;
    }
  }

  // Run comprehensive security health check
  public async runSecurityHealthCheck(): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check RLS compliance
    const rlsCompliant = await this.checkCompliance('rls_enabled');
    if (!rlsCompliant) {
      issues.push('RLS (Row Level Security) compliance issues detected');
      score -= 25;
      recommendations.push('Review and fix RLS policies for all sensitive tables');
    }

    // Check auth security
    const authSecure = await this.checkCompliance('auth_security');
    if (!authSecure) {
      issues.push('Authentication security compliance issues detected');
      score -= 20;
      recommendations.push('Ensure enhanced password validation and security functions are working');
    }

    // Check data encryption
    const dataEncrypted = await this.checkCompliance('data_encryption');
    if (!dataEncrypted) {
      issues.push('Data encryption compliance issues detected');
      score -= 15;
      recommendations.push('Verify encryption/decryption functions for sensitive data');
    }

    // Check security headers
    const requiredHeaders = ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options'];
    const missingHeaders = requiredHeaders.filter(header => 
      !document.querySelector(`meta[http-equiv="${header}"]`)
    );
    
    if (missingHeaders.length > 0) {
      issues.push(`Missing security headers: ${missingHeaders.join(', ')}`);
      score -= missingHeaders.length * 5;
      recommendations.push('Implement all required security headers');
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }

  // Initialize security hardening on app startup
  public initialize(): void {
    if (this.config.enableAdvancedCSP) {
      this.applySecurityHeaders();
    }

    if (this.config.enableComplianceChecks) {
      // Run initial compliance checks
      this.runSecurityHealthCheck().then(result => {
        if (result.issues.length > 0) {
          console.warn('🔒 Security hardening issues detected:', result.issues);
        }
        if (result.recommendations.length > 0) {
          console.info('💡 Security recommendations:', result.recommendations);
        }
      });
    }
  }
}

// Export singleton instance
export const securityHardening = new SecurityHardeningManager();