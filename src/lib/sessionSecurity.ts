// Enhanced session security and management
import { logSuspiciousActivity, logSessionTimeout } from '@/lib/securityMonitor';

export interface SessionConfig {
  maxIdleTime: number; // milliseconds
  maxSessionTime: number; // milliseconds
  activityCheckInterval: number; // milliseconds
  suspiciousActivityThreshold: number; // milliseconds
  rapidRequestWindow: number; // milliseconds
  maxRequestsPerWindow: number;
  intelligentFiltering: boolean;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxIdleTime: 30 * 60 * 1000, // 30 minutes
  maxSessionTime: 8 * 60 * 60 * 1000, // 8 hours
  activityCheckInterval: 5 * 60 * 1000, // 5 minutes
  suspiciousActivityThreshold: 200, // Optimized for better false positive detection
  rapidRequestWindow: 15 * 1000, // 15 seconds for more accurate detection
  maxRequestsPerWindow: 30, // Increased to 30 requests per 15 seconds
  intelligentFiltering: true
};

export class SessionSecurityManager {
  private config: SessionConfig;
  private lastActivity: number = Date.now();
  private sessionStart: number = Date.now();
  private timeoutId: NodeJS.Timeout | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private activityEvents: string[] = [
    'mousedown', 'mousemove', 'keypress', 'scroll', 
    'touchstart', 'click', 'keydown', 'wheel'
  ];
  private onSessionExpired?: () => void;
  private deviceFingerprint: string;
  private requestHistory: number[] = [];
  private previousActivity: number = 0;

  constructor(config: Partial<SessionConfig> = {}, onSessionExpired?: () => void) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.onSessionExpired = onSessionExpired;
    this.deviceFingerprint = this.generateDeviceFingerprint();
  }

  // Generate device fingerprint for security tracking
  private generateDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx?.fillText('fingerprint', 10, 10);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      memory: (navigator as any).deviceMemory || 'unknown',
      cores: navigator.hardwareConcurrency || 'unknown'
    };

    return btoa(JSON.stringify(fingerprint)).slice(0, 32);
  }

  public getDeviceFingerprint(): string {
    return this.deviceFingerprint;
  }

  private handleActivity = () => {
    this.lastActivity = Date.now();
    this.resetSessionTimeout();
    
    // Intelligent filtering for rapid requests
    if (this.config.intelligentFiltering) {
      this.checkIntelligentRapidRequests();
    } else {
      // Legacy rapid request detection
      const timeSinceLastActivity = this.lastActivity - (this.previousActivity || 0);
      if (timeSinceLastActivity < this.config.suspiciousActivityThreshold) {
        logSuspiciousActivity('rapid_requests', {
          interval: timeSinceLastActivity,
          timestamp: this.lastActivity
        });
      }
    }
    this.previousActivity = this.lastActivity;
  };

  private checkIntelligentRapidRequests() {
    const now = Date.now();
    const windowStart = now - this.config.rapidRequestWindow;
    
    // Track requests in current window
    if (!this.requestHistory) {
      this.requestHistory = [];
    }
    
    // Remove old requests outside window
    this.requestHistory = this.requestHistory.filter(time => time > windowStart);
    
    // Add current request
    this.requestHistory.push(now);
    
    // Check if threshold exceeded
    if (this.requestHistory.length > this.config.maxRequestsPerWindow) {
      // Check if this looks like legitimate user activity vs automation
      const intervals = this.requestHistory.slice(1).map((time, i) => 
        time - this.requestHistory[i]
      );
      
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const intervalVariance = intervals.reduce((sum, interval) => 
        sum + Math.pow(interval - avgInterval, 2), 0
      ) / intervals.length;
      
      // Enhanced automation detection with multiple factors
      const isLikelyAutomation = intervalVariance < 50 && avgInterval < 100; // Very consistent + very fast
      const isSuspiciousPattern = intervalVariance < 25 || (avgInterval < 200 && this.requestHistory.length > 25);
      
      if (isLikelyAutomation || isSuspiciousPattern) {
        // Additional check: exclude common legitimate UI interactions
        const recentIntervalPattern = intervals.slice(-5); // Last 5 intervals
        const hasHumanLikeVariation = recentIntervalPattern.some(interval => interval > 300);
        
        if (!hasHumanLikeVariation) {
          logSuspiciousActivity('rapid_requests', {
            requestCount: this.requestHistory.length,
            timeWindow: this.config.rapidRequestWindow,
            avgInterval,
            intervalVariance,
            likelyAutomation: isLikelyAutomation,
            suspiciousPattern: isSuspiciousPattern,
            confidence: isLikelyAutomation ? 'high' : 'medium'
          });
        }
      }
    }
  }

  private resetSessionTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Check if session has exceeded maximum time
    const sessionDuration = Date.now() - this.sessionStart;
    if (sessionDuration > this.config.maxSessionTime) {
      this.expireSession('max_session_time_exceeded');
      return;
    }

    this.timeoutId = setTimeout(() => {
      this.expireSession('idle_timeout');
    }, this.config.maxIdleTime);
  }

  private expireSession(reason: string) {
    logSessionTimeout();
    logSuspiciousActivity('session_expired', {
      reason,
      session_duration: Date.now() - this.sessionStart,
      device_fingerprint: this.deviceFingerprint
    });

    this.onSessionExpired?.();
  }

  private checkSecurityPatterns = () => {
    const now = new Date();
    const currentHour = now.getHours();

    // Check for unusual access times
    if (currentHour < 6 || currentHour > 22) {
      logSuspiciousActivity('unusual_access_pattern', {
        access_time: now.toISOString(),
        hour: currentHour,
        device_fingerprint: this.deviceFingerprint
      });
    }

    // Check for weekend access if needed
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend && (currentHour < 8 || currentHour > 20)) {
      logSuspiciousActivity('weekend_unusual_access', {
        access_time: now.toISOString(),
        day_of_week: now.getDay(),
        device_fingerprint: this.deviceFingerprint
      });
    }
  };

  public start() {
    // Add event listeners for user activity
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleActivity, true);
    });

    // Start session timeout
    this.resetSessionTimeout();

    // Start periodic security checks
    this.intervalId = setInterval(this.checkSecurityPatterns, this.config.activityCheckInterval);
  }

  public stop() {
    // Remove event listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleActivity, true);
    });

    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  public getSessionInfo() {
    return {
      sessionDuration: Date.now() - this.sessionStart,
      timeSinceLastActivity: Date.now() - this.lastActivity,
      deviceFingerprint: this.deviceFingerprint,
      isSessionValid: (Date.now() - this.sessionStart) < this.config.maxSessionTime
    };
  }

  public forceExpire() {
    this.expireSession('manual_logout');
  }
}