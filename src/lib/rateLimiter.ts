// Rate limiting for sensitive operations
class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  
  checkLimit(operation: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = `${operation}`;
    
    // Get current attempts for this operation
    const currentAttempts = this.attempts.get(key) || [];
    
    // Filter out attempts outside the time window
    const recentAttempts = currentAttempts.filter(timestamp => now - timestamp < windowMs);
    
    // Check if limit exceeded
    if (recentAttempts.length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt and update
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }
  
  reset(operation: string): void {
    this.attempts.delete(operation);
  }
}

export const rateLimiter = new RateLimiter();