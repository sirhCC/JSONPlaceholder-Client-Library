/**
 * Security Configuration Examples
 * 
 * This file demonstrates various security configurations for the
 * JSONPlaceholder Client Library in different environments.
 */

const { JsonPlaceholderClient, DataSanitizer } = require('../dist/index');

// ===== BASIC SECURITY SETUP =====

// Simple security-enabled client
const basicSecureClient = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  securityConfig: {
    timeout: 10000,           // 10 second timeout
    maxRedirects: 3,          // Limit redirects to prevent redirect loops
    validateStatus: (status) => status < 400 // Only accept success responses
  },
  
  rateLimitConfig: {
    enabled: true,
    strategy: 'token-bucket',
    maxRequests: 100,         // 100 requests per minute
    windowMs: 60000
  },
  
  sanitizationConfig: {
    enabled: true,
    strictMode: true          // Enable strict XSS protection
  }
});

// ===== PRODUCTION SECURITY CONFIGURATION =====

const productionClient = new JsonPlaceholderClient(process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com', {
  // Enhanced timeout and connection security
  securityConfig: {
    timeout: 5000,            // Strict 5 second timeout
    maxRedirects: 1,          // Minimal redirects
    validateStatus: (status) => status >= 200 && status < 300,
    
    // Additional axios security options
    maxContentLength: 10000,  // Limit response size to 10KB
    maxBodyLength: 2000       // Limit request size to 2KB
  },
  
  // Advanced rate limiting with endpoint-specific rules
  rateLimitConfig: {
    enabled: true,
    strategy: 'sliding-window',
    maxRequests: 1000,        // Global limit: 1000/minute
    windowMs: 60000,
    
    // Different limits for different endpoints
    endpointLimits: {
      '/posts': { maxRequests: 100, windowMs: 60000 },    // 100/min for posts
      '/users': { maxRequests: 50, windowMs: 60000 },     // 50/min for users
      '/comments': { maxRequests: 200, windowMs: 60000 }  // 200/min for comments
    },
    
    // Skip rate limiting for monitoring endpoints
    skipEndpoints: ['/health', '/metrics', '/status'],
    
    // Enable analytics and headers
    enableAnalytics: true,
    includeHeaders: true,
    
    // Queue management
    maxQueueSize: 20,
    queueTimeout: 5000
  },
  
  // Comprehensive data sanitization
  sanitizationConfig: {
    enabled: true,
    strictMode: true,
    logBlocked: true,         // Log blocked patterns for monitoring
    
    // Custom security patterns
    customPatterns: [
      // XSS protection patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi,
      
      // SQL injection protection patterns
      /('|(\\'))|((\s)*union(\s)+select(\s)*)/gi,
      /((\s)*or(\s)+1(\s)*=(\s)*1(\s)*)/gi,
      /((\s)*drop(\s)+table(\s)*)/gi,
      /((\s)*insert(\s)+into(\s)*)/gi,
      /((\s)*delete(\s)+from(\s)*)/gi
    ]
  },
  
  // Security-focused logging
  logger: {
    level: 'warn',            // Only log warnings and errors in production
    customLogger: {
      warn: (message, context) => {
        // Send security warnings to monitoring system
        if (message.includes('Rate limit') || 
            message.includes('sanitization') || 
            message.includes('timeout')) {
          console.warn(`[SECURITY] ${message}`, context);
          // Here you could send to your monitoring system
          // sendSecurityAlert({ type: 'SECURITY_WARNING', message, context });
        }
      },
      error: (message, context) => {
        console.error(`[SECURITY ERROR] ${message}`, context);
        // sendSecurityAlert({ type: 'SECURITY_ERROR', message, context });
      }
    }
  }
});

// ===== DEVELOPMENT SECURITY CONFIGURATION =====

const developmentClient = new JsonPlaceholderClient('http://localhost:3001', {
  securityConfig: {
    timeout: 30000,           // Longer timeout for debugging
    maxRedirects: 5,
    validateStatus: () => true // Accept all status codes in development
  },
  
  rateLimitConfig: {
    enabled: true,
    strategy: 'token-bucket',
    maxRequests: 1000,        // Higher limits for testing
    windowMs: 60000,
    enableAnalytics: true     // Enable analytics for debugging
  },
  
  sanitizationConfig: {
    enabled: true,
    strictMode: false,        // Less strict in development
    logBlocked: true          // Log everything for debugging
  },
  
  logger: { level: 'debug' }  // Verbose logging in development
});

// ===== API KEY SECURITY =====

// Secure API key management
function createAuthenticatedClient(apiKey) {
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  const client = new JsonPlaceholderClient('https://api.example.com', {
    securityConfig: {
      timeout: 10000,
      validateStatus: (status) => status < 400
    },
    rateLimitConfig: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000
    }
  });
  
  // Add authentication interceptor
  client.addAuthInterceptor(apiKey, 'X-API-Key');
  
  // Add request logging that excludes sensitive headers
  client.addRequestInterceptor((config) => {
    console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    // Don't log the actual API key
    return config;
  });
  
  return client;
}

// ===== SECURITY MONITORING =====

// Security monitoring and alerting
function createMonitoredClient(baseURL, alertCallback) {
  const client = new JsonPlaceholderClient(baseURL, {
    securityConfig: {
      timeout: 10000,
      validateStatus: (status) => status < 400
    },
    rateLimitConfig: {
      enabled: true,
      maxRequests: 100,
      windowMs: 60000,
      enableAnalytics: true
    },
    sanitizationConfig: {
      enabled: true,
      strictMode: true,
      logBlocked: true
    }
  });
  
  // Monitor for security events
  setInterval(() => {
    const analytics = client.getRateLimitAnalytics();
    const performance = client.getPerformanceStats();
    
    // Check for suspicious patterns
    const alerts = [];
    
    if (analytics.blockedRequests > analytics.totalRequests * 0.3) {
      alerts.push({
        type: 'HIGH_RATE_LIMIT_BLOCKS',
        severity: 'WARNING',
        message: `High rate of blocked requests: ${analytics.blockedRequests}/${analytics.totalRequests}`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (performance.errorRate > 0.1) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'ERROR',
        message: `High error rate detected: ${(performance.errorRate * 100).toFixed(1)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (performance.averageResponseTime > 5000) {
      alerts.push({
        type: 'SLOW_RESPONSE_TIME',
        severity: 'WARNING',
        message: `Slow average response time: ${performance.averageResponseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Send alerts
    alerts.forEach(alert => {
      if (alertCallback) {
        alertCallback(alert);
      } else {
        console.warn(`[SECURITY ALERT] ${alert.type}: ${alert.message}`);
      }
    });
    
  }, 60000); // Check every minute
  
  return client;
}

// ===== USAGE EXAMPLES =====

async function demonstrateSecurityFeatures() {
  console.log('🔒 Security Configuration Examples\n');
  
  // 1. Basic secure client
  console.log('1. Creating basic secure client...');
  const client = basicSecureClient;
  
  try {
    // Test rate limiting
    console.log('   Testing rate limiting...');
    for (let i = 0; i < 5; i++) {
      await client.getPost(1);
      console.log(`   ✅ Request ${i + 1} successful`);
    }
    
    // Check rate limit status
    const rateLimitStatus = await client.checkRateLimit('/posts');
    console.log('   📊 Rate limit status:', rateLimitStatus);
    
  } catch (error) {
    console.error('   ❌ Rate limit error:', error.message);
  }
  
  // 2. Data sanitization
  console.log('\n2. Testing data sanitization...');
  const sanitizer = new DataSanitizer({
    strictMode: true,
    logBlocked: true
  });
  
  const maliciousInput = '<script>alert("XSS")</script>Hello World';
  const sanitized = sanitizer.sanitize(maliciousInput);
  console.log('   Original:', maliciousInput);
  console.log('   Sanitized:', sanitized);
  
  // 3. Security monitoring
  console.log('\n3. Security analytics...');
  const analytics = client.getRateLimitAnalytics();
  console.log('   📈 Rate limit analytics:', {
    totalRequests: analytics.totalRequests,
    blockedRequests: analytics.blockedRequests,
    successRate: `${((1 - analytics.blockedRequests / analytics.totalRequests) * 100).toFixed(1)}%`
  });
  
  // 4. Performance monitoring
  const performanceStats = client.getPerformanceStats();
  console.log('   ⚡ Performance metrics:', {
    averageResponseTime: `${performanceStats.averageResponseTime}ms`,
    errorRate: `${(performanceStats.errorRate * 100).toFixed(1)}%`,
    cacheHitRate: `${(performanceStats.cacheHitRate * 100).toFixed(1)}%`
  });
  
  console.log('\n🎯 Security best practices demonstrated!');
}

// Export configurations for use in other files
module.exports = {
  basicSecureClient,
  productionClient,
  developmentClient,
  createAuthenticatedClient,
  createMonitoredClient,
  demonstrateSecurityFeatures
};

// Run demonstration if this file is executed directly
if (require.main === module) {
  demonstrateSecurityFeatures()
    .then(() => console.log('\n=== Security demonstration complete ==='))
    .catch(console.error);
}
