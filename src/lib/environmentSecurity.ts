// Environment security utilities
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Secure environment variable access
export const getSecureEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return '';
  }
  
  // Log access in development for debugging
  if (isDevelopment) {
    console.debug(`Accessing env var: ${key}`);
  }
  
  return value;
};

// Environment validation - Compatible with Lovable setup
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check for HTTPS in production (Lovable projects use direct client config)
  if (isProduction) {
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      errors.push('Application must use HTTPS in production environment');
    }
  }
  
  // No VITE_* variables required - Lovable uses direct Supabase client configuration
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Security headers for API requests
export const getSecurityHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };
  
  if (isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  
  return headers;
};

// Initialize environment security check
export const initializeEnvironmentSecurity = (): void => {
  const validation = validateEnvironment();
  
  if (!validation.isValid) {
    console.error('Environment validation failed:', validation.errors);
    
    if (isProduction) {
      // In production, this could trigger monitoring alerts
      console.error('SECURITY: Invalid environment configuration detected');
    }
  } else if (isDevelopment) {
    console.info('✅ Environment validation passed');
  }
};