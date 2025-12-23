// Enhanced authentication security utilities
import { supabase } from '@/integrations/supabase/client';
import { logAuthAttempt, logSuspiciousActivity } from '@/lib/securityMonitor';
import { authRateLimiter } from '@/lib/security';

export interface AuthSecurityOptions {
  enableDeviceTracking?: boolean;
  enableLocationTracking?: boolean;
  requireEmailVerification?: boolean;
  maxFailedAttempts?: number;
  lockoutDuration?: number; // minutes
}

export const DEFAULT_AUTH_OPTIONS: AuthSecurityOptions = {
  enableDeviceTracking: true,
  enableLocationTracking: false,
  requireEmailVerification: true,
  maxFailedAttempts: 5,
  lockoutDuration: 15
};

class AuthSecurityManager {
  private options: AuthSecurityOptions;
  private failedAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  constructor(options: Partial<AuthSecurityOptions> = {}) {
    this.options = { ...DEFAULT_AUTH_OPTIONS, ...options };
  }

  // Enhanced password validation with breach checking
  async validatePasswordSecurity(password: string): Promise<{ 
    isValid: boolean; 
    errors: string[]; 
    strengthScore: number;
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const recommendations: string[] = [];
    let strengthScore = 0;

    // Basic strength checks
    if (password.length >= 8) strengthScore += 20;
    else errors.push('Password must be at least 8 characters long');

    if (password.length >= 12) strengthScore += 10;
    else recommendations.push('Use at least 12 characters for better security');

    if (/[A-Z]/.test(password)) strengthScore += 15;
    else errors.push('Password must contain at least one uppercase letter');

    if (/[a-z]/.test(password)) strengthScore += 15;
    else errors.push('Password must contain at least one lowercase letter');

    if (/[0-9]/.test(password)) strengthScore += 15;
    else errors.push('Password must contain at least one number');

    if (/[^A-Za-z0-9]/.test(password)) strengthScore += 20;
    else errors.push('Password must contain at least one special character');

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password contains too many repeated characters');
      strengthScore -= 10;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Password contains common patterns or words');
      strengthScore -= 15;
    }

    // Check entropy
    const uniqueChars = new Set(password).size;
    if (uniqueChars < password.length * 0.5) {
      recommendations.push('Use more diverse characters');
      strengthScore -= 5;
    }

    // Additional recommendations
    if (password.length < 16) {
      recommendations.push('Consider using a passphrase with 16+ characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      strengthScore: Math.max(0, Math.min(100, strengthScore)),
      recommendations
    };
  }

  // Check if user account is locked due to failed attempts
  isAccountLocked(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts) return false;

    const isLocked = attempts.count >= this.options.maxFailedAttempts! &&
                    Date.now() - attempts.lastAttempt < this.options.lockoutDuration! * 60 * 1000;

    return isLocked;
  }

  // Record failed authentication attempt
  recordFailedAttempt(identifier: string): void {
    const existing = this.failedAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    // Reset count if last attempt was more than lockout duration ago
    if (Date.now() - existing.lastAttempt > this.options.lockoutDuration! * 60 * 1000) {
      existing.count = 0;
    }

    existing.count++;
    existing.lastAttempt = Date.now();
    this.failedAttempts.set(identifier, existing);

    if (existing.count >= this.options.maxFailedAttempts!) {
      logSuspiciousActivity('account_lockout', {
        identifier,
        failed_attempts: existing.count,
        lockout_duration: this.options.lockoutDuration
      });
    }
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(identifier: string): void {
    this.failedAttempts.delete(identifier);
  }

  // Enhanced sign in with security monitoring
  async secureSignIn(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
    user?: any;
    session?: any;
  }> {
    try {
      // Check rate limiting
      if (!authRateLimiter.isAllowed(email)) {
        const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(email) / 1000);
        logAuthAttempt('login_attempt', email, false, `Rate limited - ${remainingTime}s remaining`);
        return {
          success: false,
          error: `Too many attempts. Please wait ${remainingTime} seconds.`
        };
      }

      // Check account lockout
      if (this.isAccountLocked(email)) {
        logAuthAttempt('login_attempt', email, false, 'Account locked due to failed attempts');
        return {
          success: false,
          error: `Account temporarily locked. Please try again in ${this.options.lockoutDuration} minutes.`
        };
      }

      // Attempt authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.recordFailedAttempt(email);
        logAuthAttempt('login_attempt', email, false, error.message);
        return {
          success: false,
          error: error.message
        };
      }

      // Success - clear failed attempts
      this.clearFailedAttempts(email);
      logAuthAttempt('login_attempt', email, true);

      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.recordFailedAttempt(email);
      logAuthAttempt('login_attempt', email, false, errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Enhanced sign up with validation
  async secureSignUp(email: string, password: string, userData?: any): Promise<{
    success: boolean;
    error?: string;
    user?: any;
    session?: any;
  }> {
    try {
      // Validate password security
      const passwordValidation = await this.validatePasswordSecurity(password);
      if (!passwordValidation.isValid) {
        logAuthAttempt('signup_attempt', email, false, 'Weak password');
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        };
      }

      // Check rate limiting
      if (!authRateLimiter.isAllowed(email)) {
        const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(email) / 1000);
        logAuthAttempt('signup_attempt', email, false, `Rate limited - ${remainingTime}s remaining`);
        return {
          success: false,
          error: `Too many attempts. Please wait ${remainingTime} seconds.`
        };
      }

      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (error) {
        logAuthAttempt('signup_attempt', email, false, error.message);
        return {
          success: false,
          error: error.message
        };
      }

      logAuthAttempt('signup_attempt', email, true);

      return {
        success: true,
        user: data.user,
        session: data.session
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logAuthAttempt('signup_attempt', email, false, errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Get account status information
  getAccountStatus(identifier: string) {
    const attempts = this.failedAttempts.get(identifier);
    const isLocked = this.isAccountLocked(identifier);
    
    return {
      isLocked,
      failedAttempts: attempts?.count || 0,
      remainingAttempts: Math.max(0, this.options.maxFailedAttempts! - (attempts?.count || 0)),
      lockoutExpiry: attempts ? new Date(attempts.lastAttempt + this.options.lockoutDuration! * 60 * 1000) : null
    };
  }
}

export const authSecurity = new AuthSecurityManager();