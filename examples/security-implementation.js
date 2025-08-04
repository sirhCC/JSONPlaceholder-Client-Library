/**
 * Complete Security Implementation Example
 * Demonstrates all three security enhancements working together
 */

import { 
  JsonPlaceholderClient,
  MemorySecurityManager,
  TLSSecurityManager,
  CSRFProtectionManager
} from '../dist/esm/index.js';

console.log('🔒 Security Implementation Demo');
console.log('===============================\n');

async function demonstrateCompleteSecurity() {
  // 1. Initialize client with all security features enabled
  console.log('1️⃣ Initializing secure client...');
  
  const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    securityConfig: {
      // Memory Security
      memory: {
        enabled: true,
        autoCleanupInterval: 10000, // 10 seconds for demo
        sensitiveFields: ['password', 'token', 'secret', 'key'],
        secureRandomOverwrite: true,
        trackSensitiveAllocations: true
      },
      
      // TLS Security
      tls: {
        enabled: true,
        minTlsVersion: '1.3',
        enforceTls13: true,
        certificatePinning: false, // Disabled for demo
        hsts: {
          enabled: true,
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        securityHeaders: {
          enforceSecurityHeaders: true,
          expectedHeaders: {
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      },
      
      // CSRF Protection
      csrf: {
        enabled: true,
        sameSitePolicy: 'strict',
        secure: true,
        doubleSubmit: true,
        refererChecking: true,
        tokenExpiry: 3600000, // 1 hour
        rotationInterval: 1800000 // 30 minutes
      }
    }
  });
  
  console.log('✅ Secure client initialized with all protections\n');
  
  // 2. Demonstrate Memory Security
  console.log('2️⃣ Memory Security Demo...');
  
  // Create secure strings that auto-clean
  const securePassword = client.createSecureString('super-secret-password-123', 5000);
  console.log(`📋 Secure string created (length: ${securePassword.length})`);
  
  // Sanitize sensitive data
  const userData = {
    id: 1,
    name: 'John Doe',
    password: 'secret123',
    apiKey: 'abc-def-ghi',
    email: 'john@example.com'
  };
  
  const sanitizedData = client.sanitizeObject(userData);
  console.log('🧹 Original data sanitized:');
  console.log('   Before:', userData);
  console.log('   After:', sanitizedData);
  
  // Check memory stats
  const memoryStats = client.getMemorySecurityStats();
  console.log(`📊 Memory Security Stats:`, {
    sensitiveRefs: memoryStats.currentSensitiveRefs,
    totalAllocations: memoryStats.totalAllocations,
    memoryLeaks: memoryStats.memoryLeaksDetected
  });
  console.log('');
  
  // 3. Demonstrate CSRF Protection
  console.log('3️⃣ CSRF Protection Demo...');
  
  // Generate CSRF token
  const csrfToken = client.generateCSRFToken('session-123', 'https://example.com');
  console.log(`🔐 CSRF Token generated: ${csrfToken.value.substring(0, 16)}...`);
  
  // Validate CSRF token
  const validationResult = client.validateCSRFToken(csrfToken.value, {
    headers: { 'x-csrf-token': csrfToken.value },
    origin: 'https://example.com',
    method: 'POST'
  });
  
  console.log('✅ CSRF Token validation:', {
    valid: validationResult.valid,
    securityLevel: validationResult.securityLevel,
    warnings: validationResult.warnings
  });
  
  const csrfStats = client.getCSRFSecurityStats();
  console.log(`📊 CSRF Stats:`, {
    tokensGenerated: csrfStats.tokensGenerated,
    tokensValidated: csrfStats.tokensValidated,
    successRate: `${Math.round((csrfStats.tokensValidated - csrfStats.tokensRejected) / csrfStats.tokensValidated * 100)}%`
  });
  console.log('');
  
  // 4. Make secure API requests
  console.log('4️⃣ Secure API Request Demo...');
  
  try {
    // GET request (automatically secured)
    const posts = await client.getPosts({ limit: 3 });
    console.log(`📡 Fetched ${posts.length} posts securely`);
    
    // POST request (with CSRF protection)
    const newPost = await client.createPost({
      title: 'Secure Post',
      body: 'This post was created with full security protection',
      userId: 1
    });
    console.log(`📝 Created post ${newPost.id} with security protection`);
    
  } catch (error) {
    console.log('❌ Request failed:', error.message);
  }
  
  // 5. Comprehensive Security Report
  console.log('5️⃣ Generating Security Report...');
  
  const securityReport = client.generateSecurityReport();
  console.log(`🛡️ Overall Security Score: ${securityReport.overallSecurityScore}/100`);
  console.log('');
  
  // Print detailed security report
  client.printSecurityReport();
  
  // 6. Demonstrate security cleanup
  console.log('6️⃣ Security Cleanup Demo...');
  
  // Clean up sensitive data
  const cleanedCount = client.cleanupSensitiveData();
  console.log(`🧼 Cleaned up ${cleanedCount} sensitive data references`);
  
  // Wait for secure string to auto-clean
  setTimeout(() => {
    try {
      const value = securePassword.toString();
      console.log('🔒 Secure string still accessible:', value.length > 0);
    } catch (error) {
      console.log('✅ Secure string auto-cleaned:', error.message);
    }
  }, 6000);
  
  // Final security stats
  setTimeout(() => {
    console.log('\n🏁 Final Security Stats:');
    const finalStats = client.getMemorySecurityStats();
    console.log(`   Sensitive References: ${finalStats.currentSensitiveRefs}`);
    console.log(`   Total Cleanups: ${finalStats.cleanedAllocations}`);
    console.log(`   Average Cleanup Time: ${finalStats.averageCleanupTime}ms`);
    
    // Cleanup all security resources
    client.destroySecurity();
    console.log('✅ All security resources cleaned up');
    console.log('\n🎉 Security demonstration complete!\n');
  }, 8000);
}

// Advanced Security Configuration Example
function demonstrateAdvancedSecurity() {
  console.log('🚀 Advanced Security Configuration Example');
  console.log('==========================================\n');
  
  // Create standalone security managers for fine-grained control
  const memoryManager = new MemorySecurityManager({
    enabled: true,
    autoCleanupInterval: 30000,
    sensitiveFields: [
      'password', 'secret', 'token', 'key', 'auth',
      'credential', 'session', 'jwt', 'bearer'
    ],
    secureRandomOverwrite: true,
    trackSensitiveAllocations: true
  });
  
  const tlsManager = new TLSSecurityManager({
    enabled: true,
    minTlsVersion: '1.3',
    enforceTls13: true,
    allowedCipherSuites: [
      'TLS_AES_256_GCM_SHA384',
      'TLS_AES_128_GCM_SHA256',
      'TLS_CHACHA20_POLY1305_SHA256'
    ],
    certificatePinning: true,
    pinnedCertificates: [], // Add your certificate fingerprints
    hsts: {
      enabled: true,
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });
  
  const csrfManager = new CSRFProtectionManager({
    enabled: true,
    tokenName: 'csrf-token',
    cookieName: '__csrf-token',
    doubleSubmit: true,
    sameSitePolicy: 'strict',
    secure: true,
    httpOnly: true,
    tokenExpiry: 3600000,
    rotationInterval: 1800000,
    customHeaderName: 'X-CSRF-Token',
    allowedOrigins: ['https://yourdomain.com'],
    refererChecking: true,
    tokenEntropy: 256
  });
  
  console.log('🔧 Advanced security managers configured');
  console.log('   - Memory Security: Auto-cleanup every 30s');
  console.log('   - TLS Security: TLS 1.3 enforced with HSTS');
  console.log('   - CSRF Protection: Double-submit with strict SameSite');
  
  // Example of using standalone managers
  const sensitiveData = {
    userCredentials: { username: 'admin', password: 'secret123' },
    apiKeys: ['key1', 'key2', 'key3'],
    sessionTokens: { access: 'token1', refresh: 'token2' }
  };
  
  // Register sensitive data for automatic cleanup
  const dataId = memoryManager.registerSensitiveData(sensitiveData);
  console.log(`📋 Registered sensitive data with ID: ${dataId}`);
  
  // Generate and validate CSRF token
  const token = csrfManager.generateToken();
  const validation = csrfManager.validateToken(token.value, {
    headers: { 'x-csrf-token': token.value },
    method: 'POST'
  });
  
  console.log(`🔐 CSRF token validation: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);
  
  // Cleanup
  setTimeout(() => {
    memoryManager.cleanupSensitiveData(dataId);
    memoryManager.destroy();
    csrfManager.destroy();
    console.log('✅ Advanced security demo cleanup complete\n');
  }, 3000);
}

// Run demonstrations
demonstrateCompleteSecurity();

setTimeout(() => {
  demonstrateAdvancedSecurity();
}, 10000);

console.log('⏳ Security demonstrations will run for ~15 seconds...\n');
