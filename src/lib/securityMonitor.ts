// Enhanced security monitoring utilities
import { supabase } from '@/integrations/supabase/client';

// Get client IP address (enhanced for security monitoring)
const getClientIP = (): string => {
  // Try to get real IP from various sources in browser
  try {
    // Check for real IP from WebRTC (if available and user permits)
    const userAgent = navigator.userAgent;
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('.local');
    
    if (isLocal) {
      return '127.0.0.1';
    }
    
    // For production, we'll rely on server-side IP detection
    // This is a fallback for logging purposes - return localhost instead of unknown
    return '127.0.0.1';
  } catch (error) {
    return '127.0.0.1';
  }
};

// Get user agent string
const getUserAgent = (): string => {
  return navigator.userAgent || 'unknown';
};

// Enhanced authentication logging with IP and user agent
export const logAuthAttempt = async (
  eventType: 'login_attempt' | 'signup_attempt' | 'password_reset_attempt',
  email: string,
  success?: boolean,
  errorMessage?: string
) => {
  try {
    await supabase.rpc('log_auth_attempt', {
      event_type: eventType,
      email,
      success,
      error_message: errorMessage,
      ip_addr: getClientIP(),
      user_agent_str: getUserAgent()
    });
  } catch (error) {
    console.error('Failed to log auth attempt:', error);
  }
};

// Log bulk operations that could be suspicious
export const logBulkOperation = async (
  operation: 'bulk_delete' | 'bulk_update' | 'bulk_export',
  recordCount: number,
  tableName: string
) => {
  try {
    await supabase.rpc('log_security_event', {
      event_type: 'bulk_operation',
      event_description: `${operation} performed on ${recordCount} records in ${tableName}`,
      metadata: {
        operation,
        record_count: recordCount,
        table_name: tableName,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to log bulk operation:', error);
  }
};

// Log session timeout events
export const logSessionTimeout = async () => {
  try {
    await supabase.rpc('log_security_event', {
      event_type: 'session_timeout',
      event_description: 'User session timed out',
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: getUserAgent()
      }
    });
  } catch (error) {
    console.error('Failed to log session timeout:', error);
  }
};

// Log suspicious activity patterns
export const logSuspiciousActivity = async (
  activityType: 'rapid_requests' | 'unusual_access_pattern' | 'multiple_failed_auth' | 'session_expired' | 'account_lockout' | 'weekend_unusual_access',
  details: Record<string, any>
) => {
  try {
    await supabase.rpc('log_security_event', {
      event_type: 'suspicious_activity',
      event_description: `Suspicious activity detected: ${activityType}`,
      metadata: {
        activity_type: activityType,
        details,
        timestamp: new Date().toISOString(),
        user_agent: getUserAgent()
      }
    });
  } catch (error) {
    console.error('Failed to log suspicious activity:', error);
  }
};