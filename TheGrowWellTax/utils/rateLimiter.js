// Rate limiting utility for mobile app

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.defaultLimits = {
      'send-otp': { max: 3, window: 5 * 60 * 1000 }, // 3 requests per 5 minutes
      'verify-otp': { max: 5, window: 5 * 60 * 1000 }, // 5 requests per 5 minutes
      'profile-update': { max: 10, window: 60 * 1000 }, // 10 requests per minute
      'api-call': { max: 100, window: 60 * 1000 }, // 100 requests per minute
    };
  }

  // Check if request is allowed
  isAllowed(action, identifier = 'default') {
    const key = `${action}-${identifier}`;
    const now = Date.now();
    const limit = this.defaultLimits[action] || this.defaultLimits['api-call'];
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const requestTimes = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = requestTimes.filter(time => now - time < limit.window);
    this.requests.set(key, validRequests);
    
    // Check if under limit
    if (validRequests.length < limit.max) {
      validRequests.push(now);
      this.requests.set(key, validRequests);
      return { allowed: true, remaining: limit.max - validRequests.length - 1 };
    }
    
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: Math.min(...validRequests) + limit.window
    };
  }

  // Get remaining requests for an action
  getRemaining(action, identifier = 'default') {
    const key = `${action}-${identifier}`;
    const now = Date.now();
    const limit = this.defaultLimits[action] || this.defaultLimits['api-call'];
    
    if (!this.requests.has(key)) {
      return limit.max;
    }
    
    const requestTimes = this.requests.get(key);
    const validRequests = requestTimes.filter(time => now - time < limit.window);
    
    return Math.max(0, limit.max - validRequests.length);
  }

  // Reset rate limit for an action
  reset(action, identifier = 'default') {
    const key = `${action}-${identifier}`;
    this.requests.delete(key);
  }

  // Clear all rate limits
  clear() {
    this.requests.clear();
  }

  // Get rate limit info
  getInfo(action, identifier = 'default') {
    const key = `${action}-${identifier}`;
    const now = Date.now();
    const limit = this.defaultLimits[action] || this.defaultLimits['api-call'];
    
    if (!this.requests.has(key)) {
      return {
        action,
        identifier,
        limit: limit.max,
        remaining: limit.max,
        window: limit.window,
        resetTime: null,
      };
    }
    
    const requestTimes = this.requests.get(key);
    const validRequests = requestTimes.filter(time => now - time < limit.window);
    const remaining = Math.max(0, limit.max - validRequests.length);
    const resetTime = validRequests.length > 0 ? Math.min(...validRequests) + limit.window : null;
    
    return {
      action,
      identifier,
      limit: limit.max,
      remaining,
      window: limit.window,
      resetTime,
    };
  }
}

export default new RateLimiter();
