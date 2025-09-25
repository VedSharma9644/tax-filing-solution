// Request logging utility for mobile app

class RequestLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Keep only last 100 requests
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data) : null,
    };

    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console logging in development
    if (__DEV__) {
      console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`, data);
    }
  }

  info(message, data) {
    this.log('info', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  error(message, data) {
    this.log('error', message, data);
  }

  // Log API requests
  logApiRequest(method, url, data = null) {
    this.info(`API Request: ${method} ${url}`, {
      method,
      url,
      data: data ? this.sanitizeData(data) : null,
    });
  }

  // Log API responses
  logApiResponse(method, url, status, response = null) {
    this.info(`API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      response: response ? this.sanitizeData(response) : null,
    });
  }

  // Log API errors
  logApiError(method, url, error) {
    this.error(`API Error: ${method} ${url}`, {
      method,
      url,
      error: error.message || error,
      stack: error.stack,
    });
  }

  // Sanitize sensitive data
  sanitizeData(data) {
    if (!data || typeof data !== 'object') return data;
    
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'otp'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }

  // Get logs for debugging
  getLogs() {
    return [...this.logs];
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs (for debugging)
  exportLogs() {
    return {
      timestamp: new Date().toISOString(),
      logs: this.getLogs(),
      count: this.logs.length,
    };
  }
}

export default new RequestLogger();
