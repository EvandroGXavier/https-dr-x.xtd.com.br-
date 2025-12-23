// Enhanced security headers and CSP implementation
import { isProduction } from '@/lib/environmentSecurity';

export interface SecurityHeadersConfig {
  enableCSP?: boolean;
  enableHSTS?: boolean;
  enableFrameOptions?: boolean;
  enableContentTypeOptions?: boolean;
  enableReferrerPolicy?: boolean;
}

// Content Security Policy configuration
export const getCSPHeader = (): string => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.dr-x.xtd.com.br",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.dr-x.xtd.com.br wss://api.dr-x.xtd.com.br",
    "media-src 'self' blob: data:",
    "frame-src 'self' https://api.dr-x.xtd.com.br blob: data:",
    "child-src 'self' https://api.dr-x.xtd.com.br blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  return csp.join('; ');
};

// Generate comprehensive security headers
export const getSecurityHeaders = (config: SecurityHeadersConfig = {}): Record<string, string> => {
  const {
    enableCSP = true,
    enableHSTS = isProduction,
    enableFrameOptions = true,
    enableContentTypeOptions = true,
    enableReferrerPolicy = true
  } = config;

  const headers: Record<string, string> = {};

  if (enableCSP) {
    headers['Content-Security-Policy'] = getCSPHeader();
  }

  if (enableHSTS && isProduction) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
  }

  if (enableFrameOptions) {
    headers['X-Frame-Options'] = 'DENY';
  }

  if (enableContentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  if (enableReferrerPolicy) {
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  }

  // Additional security headers
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';

  return headers;
};

// Apply security headers to fetch requests
export const createSecureFetch = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input, init = {}) => {
    // Security headers are response headers, not request headers
    // Only apply them to same-origin requests and never inject them into outgoing requests
    let url: string;
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else {
      url = input.url;
    }
    
    // Check if this is a cross-origin request
    const isCrossOrigin = url.startsWith('http') && !url.startsWith(window.location.origin);
    
    // Never inject response headers into outgoing requests
    if (isCrossOrigin) {
      return originalFetch(input, init);
    }
    
    // For same-origin requests, we can pass through without adding response headers
    return originalFetch(input, init);
  };
};

// Security meta tags for HTML head
export const getSecurityMetaTags = () => {
  return [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-Frame-Options', content: 'DENY' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
    ...(isProduction ? [
      { httpEquiv: 'Strict-Transport-Security', content: 'max-age=31536000; includeSubDomains; preload' }
    ] : [])
  ];
};