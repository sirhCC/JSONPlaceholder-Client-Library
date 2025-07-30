# 🔒 Security Best Practices Guide

This guide covers security best practices for using the JSONPlaceholder Client Library in production environments, including built-in security features and recommended configurations.

## Table of Contents

- [🛡️ Built-in Security Features](#️-built-in-security-features)
- [⚙️ Security Configuration](#️-security-configuration)
- [🚦 Rate Limiting](#-rate-limiting)
- [🧹 Data Sanitization](#-data-sanitization)
- [⏱️ Timeout & Cancellation](#️-timeout--cancellation)
- [🌐 Network Security](#-network-security)
- [🔐 Authentication & Authorization](#-authentication--authorization)
- [📊 Monitoring & Logging](#-monitoring--logging)
- [🏢 Enterprise Security](#-enterprise-security)
- [✅ Security Checklist](#-security-checklist)

---

## 🛡️ Built-in Security Features

The JSONPlaceholder Client Library includes several built-in security features designed to protect your application:

### Core Security Components

1. **Data Sanitization** - XSS protection and input validation
2. **Rate Limiting** - Protection against abuse and DoS attacks
3. **Timeout Configuration** - Request timeout and cancellation
4. **Request Validation** - Input sanitization and validation helpers
5. **Security Headers** - Automatic security headers inclusion

---

## ⚙️ Security Configuration

### Basic Security Setup

```javascript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  // Enhanced timeout configuration
  securityConfig: {
    timeout: 10000,           // 10 second timeout
    maxRedirects: 3,          // Limit redirects
    validateStatus: (status) => status < 400 // Only accept success responses
  },
  
  // Rate limiting protection
  rateLimitConfig: {
    enabled: true,
    strategy: 'token-bucket',
    maxRequests: 100,         // 100 requests
    windowMs: 60000,          // per minute
    enableAnalytics: true
  },
  
  // Data sanitization
  sanitizationConfig: {
    enabled: true,
    strictMode: true,
    customPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
    ]
  }
});
```

### Production Security Configuration

```javascript
const productionClient = new JsonPlaceholderClient(process.env.API_BASE_URL, {
  securityConfig: {
    timeout: 5000,            // Shorter timeout for production
    maxRedirects: 1,          // Minimal redirects
    validateStatus: (status) => status >= 200 && status < 300
  },
  
  rateLimitConfig: {
    enabled: true,
    strategy: 'sliding-window',
    maxRequests: 1000,        // Higher limits for production
    windowMs: 60000,
    endpointLimits: {
      '/posts': { maxRequests: 100, windowMs: 60000 },
      '/users': { maxRequests: 50, windowMs: 60000 }
    },
    skipEndpoints: ['/health', '/metrics'],
    enableAnalytics: true,
    includeHeaders: true
  },
  
  sanitizationConfig: {
    enabled: true,
    strictMode: true,
    logBlocked: true,
    customPatterns: [
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      // SQL injection patterns
      /('|(\\'))|((\s)*union(\s)+select(\s)*)/gi,
      /((\s)*or(\s)+1(\s)*=(\s)*1(\s)*)/gi
    ]
  },
  
  logger: { level: 'warn' }   // Reduce logging in production
});
```

---

## 🚦 Rate Limiting

### Rate Limiting Strategies

#### Token Bucket (Recommended for APIs)

```javascript
const client = new JsonPlaceholderClient(baseURL, {
  rateLimitConfig: {
    strategy: 'token-bucket',
    maxRequests: 100,
    windowMs: 60000,          // Refill rate: 100 tokens per minute
    maxQueueSize: 10          // Queue up to 10 requests
  }
});
```

#### Sliding Window (Recommended for User Actions)

```javascript
const client = new JsonPlaceholderClient(baseURL, {
  rateLimitConfig: {
    strategy: 'sliding-window',
    maxRequests: 50,
    windowMs: 60000           // 50 requests per sliding minute
  }
});
```

#### Fixed Window (Recommended for Billing/Quotas)

```javascript
const client = new JsonPlaceholderClient(baseURL, {
  rateLimitConfig: {
    strategy: 'fixed-window',
    maxRequests: 1000,
    windowMs: 3600000         // 1000 requests per hour
  }
});
```

### Per-Endpoint Rate Limits

```javascript
const client = new JsonPlaceholderClient(baseURL, {
  rateLimitConfig: {
    enabled: true,
    maxRequests: 1000,        // Global limit
    windowMs: 60000,
    endpointLimits: {
      // Stricter limits for sensitive endpoints
      '/users': { maxRequests: 100, windowMs: 60000 },
      '/posts': { maxRequests: 200, windowMs: 60000 },
      
      // More lenient for read-only endpoints
      '/comments': { maxRequests: 500, windowMs: 60000 }
    },
    
    // Skip rate limiting for health checks
    skipEndpoints: ['/health', '/status', '/metrics']
  }
});
```

### Rate Limit Monitoring

```javascript
// Check current rate limit status
const status = await client.checkRateLimit('/posts');
console.log(`Remaining: ${status.remaining}/${status.limit}`);

// Get comprehensive analytics
const analytics = client.getRateLimitAnalytics();
console.log('Rate Limit Analytics:', {
  totalRequests: analytics.totalRequests,
  blockedRequests: analytics.blockedRequests,
  currentQueueSize: analytics.currentQueueSize,
  peakRequestsPerSecond: analytics.peakRequestsPerSecond
});

// Print detailed report
client.printRateLimitReport();
```

---

## 🧹 Data Sanitization

### XSS Protection

```javascript
import { DataSanitizer } from 'jsonplaceholder-client-lib/sanitization';

const sanitizer = new DataSanitizer({
  strictMode: true,
  logBlocked: true,
  customPatterns: [
    // Block script tags
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    
    // Block javascript: URLs
    /javascript:/gi,
    
    // Block event handlers
    /on\w+\s*=/gi,
    
    // Block data: URLs with script
    /data:text\/html/gi
  ]
});

// Sanitize user input
const userInput = '<script>alert("xss")</script>Hello World';
const sanitized = sanitizer.sanitize(userInput);
console.log(sanitized); // "Hello World"

// Check if input contains threats
const result = sanitizer.validate(userInput);
if (!result.isValid) {
  console.log('Blocked patterns:', result.blockedPatterns);
}
```

### SQL Injection Protection

```javascript
const sanitizer = new DataSanitizer({
  customPatterns: [
    // Common SQL injection patterns
    /('|(\\'))|((\s)*union(\s)+select(\s)*)/gi,
    /((\s)*or(\s)+1(\s)*=(\s)*1(\s)*)/gi,
    /((\s)*drop(\s)+table(\s)*)/gi,
    /((\s)*insert(\s)+into(\s)*)/gi,
    /((\s)*delete(\s)+from(\s)*)/gi,
    /((\s)*update(\s)+.*(\s)*set(\s)*)/gi
  ]
});

// Validate search queries
const searchQuery = "'; DROP TABLE users; --";
const result = sanitizer.validate(searchQuery);
if (!result.isValid) {
  throw new Error('Invalid search query detected');
}
```

### Client-Side Sanitization

```javascript
const client = new JsonPlaceholderClient(baseURL, {
  sanitizationConfig: {
    enabled: true,
    strictMode: true,
    
    // Automatically sanitize all request data
    sanitizeRequests: true,
    
    // Automatically sanitize all response data
    sanitizeResponses: true,
    
    // Log blocked patterns for monitoring
    logBlocked: true
  }
});

// Manual sanitization
const userData = {
  name: '<script>alert("xss")</script>John',
  email: 'john@example.com',
  bio: 'Hello <img src=x onerror=alert(1)>'
};

const sanitizedData = client.sanitizeRequestData(userData);
console.log(sanitizedData);
// { name: 'John', email: 'john@example.com', bio: 'Hello ' }
```

---

## ⏱️ Timeout & Cancellation

### Request Timeouts

```javascript
const client = new JsonPlaceholderClient(baseURL, {
  securityConfig: {
    timeout: 10000,           // Global 10 second timeout
    maxRedirects: 3,
    validateStatus: (status) => status < 400
  }
});

// Per-request timeouts
try {
  const post = await client.getPost(1, {
    timeout: 5000             // Override global timeout
  });
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.log('Request timed out');
  }
}
```

### Request Cancellation

```javascript
// Using AbortController for cancellation
const controller = new AbortController();

// Cancel request after 3 seconds
setTimeout(() => controller.abort(), 3000);

try {
  const posts = await client.getPosts({
    signal: controller.signal
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Request was cancelled');
  }
}
```

### Bulk Operation Security

```javascript
// Secure batch operations with timeouts
const postIds = [1, 2, 3, 4, 5];
const controller = new AbortController();

// Set overall timeout for batch operation
setTimeout(() => controller.abort(), 30000);

try {
  const posts = await Promise.all(
    postIds.map(id => 
      client.getPost(id, { 
        signal: controller.signal,
        timeout: 5000  // Per-request timeout
      })
    )
  );
} catch (error) {
  console.log('Batch operation failed or timed out');
}
```

---

## 🌐 Network Security

### HTTPS Enforcement

```javascript
// Always use HTTPS in production
const secureClient = new JsonPlaceholderClient('https://api.example.com', {
  securityConfig: {
    // Reject non-HTTPS redirects
    validateStatus: (status) => status < 400,
    maxRedirects: 1
  }
});

// Validate URL scheme
function validateApiUrl(url) {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== 'https:') {
    throw new Error('API URL must use HTTPS');
  }
  return url;
}
```

### Request Headers Security

```javascript
// Add security headers
client.addRequestInterceptor((config) => {
  config.headers = {
    ...config.headers,
    'X-Requested-With': 'XMLHttpRequest',
    'X-API-Version': '1.0',
    'User-Agent': 'MyApp/1.0.0'
  };
  return config;
});

// Remove sensitive headers from logs
client.addResponseInterceptor((response) => {
  // Log response without sensitive headers
  const logResponse = {
    ...response,
    config: {
      ...response.config,
      headers: {
        ...response.config.headers,
        'Authorization': '[REDACTED]',
        'X-API-Key': '[REDACTED]'
      }
    }
  };
  return response;
});
```

### CORS Configuration

```javascript
// For browser environments, ensure proper CORS setup
const corsClient = new JsonPlaceholderClient(baseURL, {
  // Configure for CORS requests
  withCredentials: false,     // Avoid sending cookies unless necessary
  
  securityConfig: {
    validateStatus: (status) => status < 400
  }
});

// Handle CORS errors
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.message.includes('CORS')) {
      console.error('CORS error: Check server CORS configuration');
    }
    throw error;
  }
);
```

---

## 🔐 Authentication & Authorization

### API Key Security

```javascript
// Secure API key handling
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}

client.addAuthInterceptor(apiKey, 'API-Key');

// Rotate API keys periodically
class ApiKeyManager {
  constructor() {
    this.currentKey = process.env.API_KEY;
    this.backupKey = process.env.API_KEY_BACKUP;
  }
  
  async rotateKey() {
    try {
      // Try with current key first
      await this.testApiKey(this.currentKey);
    } catch (error) {
      console.warn('Primary API key failed, trying backup');
      await this.testApiKey(this.backupKey);
      this.currentKey = this.backupKey;
    }
  }
  
  async testApiKey(key) {
    const testClient = new JsonPlaceholderClient(baseURL);
    testClient.addAuthInterceptor(key, 'API-Key');
    await testClient.getPosts({ limit: 1 });
  }
}
```

### Bearer Token Security

```javascript
// JWT token handling
class TokenManager {
  constructor() {
    this.token = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }
  
  isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
  
  async refreshAccessToken() {
    if (!this.refreshToken || this.isTokenExpired(this.refreshToken)) {
      throw new Error('Refresh token expired');
    }
    
    // Implement token refresh logic
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.refreshToken}` }
    });
    
    const { access_token } = await response.json();
    this.token = access_token;
    localStorage.setItem('access_token', access_token);
    
    return access_token;
  }
}

// Auto-refresh token interceptor
client.addRequestInterceptor(async (config) => {
  const tokenManager = new TokenManager();
  
  if (tokenManager.isTokenExpired(tokenManager.token)) {
    await tokenManager.refreshAccessToken();
  }
  
  config.headers.Authorization = `Bearer ${tokenManager.token}`;
  return config;
});
```

---

## 📊 Monitoring & Logging

### Security Event Logging

```javascript
// Security-focused logging configuration
const client = new JsonPlaceholderClient(baseURL, {
  logger: {
    level: 'info',
    // Custom logger for security events
    customLogger: {
      warn: (message, context) => {
        if (message.includes('Rate limit') || message.includes('sanitization')) {
          // Send security events to monitoring system
          sendSecurityAlert({
            type: 'SECURITY_WARNING',
            message,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: context.clientIP
          });
        }
        console.warn(message, context);
      }
    }
  }
});

// Monitor rate limiting events
client.addRequestInterceptor((config) => {
  config.metadata = {
    requestId: generateRequestId(),
    timestamp: Date.now()
  };
  return config;
});

client.addResponseInterceptor(
  (response) => {
    // Log successful requests
    const duration = Date.now() - response.config.metadata.timestamp;
    if (duration > 5000) {
      console.warn('Slow request detected', {
        url: response.config.url,
        duration,
        requestId: response.config.metadata.requestId
      });
    }
    return response;
  },
  (error) => {
    // Log security-related errors
    if (error.name === 'RateLimitingError') {
      console.warn('Rate limit exceeded', {
        endpoint: error.endpoint,
        retryAfter: error.retryAfter,
        requestId: error.config?.metadata?.requestId
      });
    }
    throw error;
  }
);
```

### Performance Monitoring

```javascript
// Monitor for potential security issues
const performanceMonitor = client.getPerformanceMonitor();

performanceMonitor.on('slowRequest', (event) => {
  if (event.duration > 10000) {
    console.warn('Potential DoS attack or network issue', event);
  }
});

performanceMonitor.on('highErrorRate', (event) => {
  if (event.errorRate > 0.5) {
    console.error('High error rate detected', event);
  }
});

// Regular security health checks
setInterval(async () => {
  const analytics = client.getRateLimitAnalytics();
  const performance = performanceMonitor.getMetrics();
  
  // Check for suspicious patterns
  if (analytics.blockedRequests > analytics.totalRequests * 0.3) {
    console.warn('High rate limit blocks detected');
  }
  
  if (performance.averageResponseTime > 5000) {
    console.warn('Degraded performance detected');
  }
}, 60000); // Check every minute
```

---

## 🏢 Enterprise Security

### Environment-Specific Configuration

```javascript
// Development environment
const devConfig = {
  securityConfig: {
    timeout: 30000,           // Longer timeouts for debugging
    validateStatus: () => true // Accept all status codes
  },
  rateLimitConfig: {
    enabled: true,
    maxRequests: 1000,        // Higher limits for testing
    windowMs: 60000
  },
  sanitizationConfig: {
    enabled: true,
    strictMode: false,        // Less strict for development
    logBlocked: true
  },
  logger: { level: 'debug' }
};

// Production environment
const prodConfig = {
  securityConfig: {
    timeout: 5000,            // Strict timeouts
    maxRedirects: 1,
    validateStatus: (status) => status >= 200 && status < 300
  },
  rateLimitConfig: {
    enabled: true,
    strategy: 'token-bucket',
    maxRequests: 100,
    windowMs: 60000,
    enableAnalytics: true,
    includeHeaders: true
  },
  sanitizationConfig: {
    enabled: true,
    strictMode: true,
    logBlocked: true
  },
  logger: { level: 'warn' }
};

// Environment-aware client creation
function createSecureClient(baseURL) {
  const config = process.env.NODE_ENV === 'production' ? prodConfig : devConfig;
  return new JsonPlaceholderClient(baseURL, config);
}
```

### Compliance & Audit

```javascript
// GDPR compliance helpers
class GDPRCompliantClient {
  constructor(baseURL, userId) {
    this.client = new JsonPlaceholderClient(baseURL, {
      sanitizationConfig: { enabled: true, strictMode: true }
    });
    this.userId = userId;
    this.auditLog = [];
  }
  
  async getData(endpoint, purpose) {
    // Log data access for audit
    this.auditLog.push({
      userId: this.userId,
      endpoint,
      purpose,
      timestamp: new Date().toISOString(),
      action: 'DATA_ACCESS'
    });
    
    return await this.client.request({ url: endpoint });
  }
  
  async deleteUserData(userId) {
    // Implement right to be forgotten
    this.auditLog.push({
      userId,
      action: 'DATA_DELETION',
      timestamp: new Date().toISOString()
    });
    
    // Delete user data from cache
    this.client.cacheManager.delete(`user:${userId}`);
  }
  
  getAuditLog() {
    return this.auditLog;
  }
}
```

---

## ✅ Security Checklist

### Pre-Production Checklist

#### Configuration Security

- [ ] HTTPS enabled for all API endpoints
- [ ] Rate limiting configured with appropriate limits
- [ ] Data sanitization enabled with strict mode
- [ ] Request timeouts configured (≤ 10 seconds)
- [ ] Redirect limits set (≤ 3 redirects)
- [ ] Error logging configured without sensitive data

#### Authentication & Authorization

- [ ] API keys stored in environment variables
- [ ] Bearer tokens have expiration validation
- [ ] Token refresh mechanism implemented
- [ ] Authorization headers not logged
- [ ] Proper CORS configuration verified

#### Input Validation

- [ ] XSS protection patterns configured
- [ ] SQL injection patterns configured
- [ ] Custom validation patterns for your use case
- [ ] Input sanitization tested with malicious payloads
- [ ] Response sanitization enabled

#### Monitoring & Logging

- [ ] Security event logging implemented
- [ ] Rate limit monitoring configured
- [ ] Performance monitoring enabled
- [ ] Error tracking system integrated
- [ ] Audit logging for compliance

#### Network Security

- [ ] TLS/SSL certificates validated
- [ ] Certificate pinning considered (mobile apps)
- [ ] Network timeouts configured
- [ ] Request/response size limits set
- [ ] Proxy configuration secured (if applicable)

### Runtime Security Monitoring

```javascript
// Security monitoring dashboard
function createSecurityDashboard(client) {
  return {
    getRateLimitStatus: () => client.getRateLimitAnalytics(),
    
    getSecurityMetrics: () => ({
      sanitizationBlocks: client.getSanitizationStats(),
      rateLimitBlocks: client.getRateLimitAnalytics().blockedRequests,
      averageResponseTime: client.getPerformanceMonitor().getMetrics().averageResponseTime,
      errorRate: client.getPerformanceMonitor().getMetrics().errorRate
    }),
    
    getSecurityAlerts: () => {
      const analytics = client.getRateLimitAnalytics();
      const alerts = [];
      
      if (analytics.blockedRequests > analytics.totalRequests * 0.1) {
        alerts.push({
          type: 'HIGH_RATE_LIMIT_BLOCKS',
          severity: 'WARNING',
          message: 'High rate of blocked requests detected'
        });
      }
      
      return alerts;
    }
  };
}
```

---

## 🚨 Security Incident Response

### Rate Limit Attack Response

```javascript
// Detect and respond to rate limit attacks
client.addResponseInterceptor(
  (response) => response,
  (error) => {
    if (error.name === 'RateLimitingError') {
      // Log potential attack
      console.warn('Potential rate limit attack', {
        endpoint: error.endpoint,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      
      // Implement exponential backoff
      const backoffDelay = Math.min(error.retryAfter * 2, 60000);
      return new Promise(resolve => {
        setTimeout(() => resolve(error), backoffDelay);
      });
    }
    throw error;
  }
);
```

### XSS Attack Response

```javascript
// Monitor for XSS attempts
const sanitizer = client.getSanitizer();
const originalSanitize = sanitizer.sanitize.bind(sanitizer);

sanitizer.sanitize = function(input) {
  const result = originalSanitize(input);
  
  if (result.blockedPatterns && result.blockedPatterns.length > 0) {
    // Log XSS attempt
    console.warn('XSS attempt detected', {
      input: input.substring(0, 100), // Log only first 100 chars
      patterns: result.blockedPatterns,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    // Optional: Report to security team
    reportSecurityIncident({
      type: 'XSS_ATTEMPT',
      details: result.blockedPatterns
    });
  }
  
  return result;
};
```

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Mozilla Web Security Guidelines](https://infosec.mozilla.org/guidelines/web_security)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## 🆘 Support

For security-related questions or to report security vulnerabilities:

- **Email**: [security@yourcompany.com](mailto:security@yourcompany.com)
- **Security Issues**: Create a private GitHub issue
- **Documentation**: Check the troubleshooting guide
- **Community**: Join our Discord for general questions

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security configuration as your application evolves.
