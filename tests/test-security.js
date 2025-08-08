// Simple Security Test - CommonJS
const { 
  JsonPlaceholderClient,
  MemorySecurityManager,
  TLSSecurityManager,
  CSRFProtectionManager
} = require('./dist/index.js');

console.log('🔒 Security Integration Test');
console.log('=============================\n');

async function testSecurityIntegration() {
  try {
    // 1. Test standalone security managers
    console.log('1️⃣ Testing standalone security managers...');
    
    const memoryManager = new MemorySecurityManager({
      enabled: true,
      autoCleanupInterval: 5000
    });
    
    const tlsManager = new TLSSecurityManager({
      enabled: true,
      minTlsVersion: '1.3'
    });
    
    const csrfManager = new CSRFProtectionManager({
      enabled: true,
      sameSitePolicy: 'strict'
    });
    
    console.log('✅ All security managers created successfully');
    
    // 2. Test memory security
    console.log('\n2️⃣ Testing memory security...');
    
    const sensitiveData = { password: 'secret123', token: 'abc-def' };
    const dataId = memoryManager.registerSensitiveData(sensitiveData);
    console.log(`📋 Registered sensitive data: ${dataId}`);
    
    const sanitized = memoryManager.sanitizeObject({ 
      id: 1, 
      name: 'Test', 
      password: 'secret', 
      data: 'normal' 
    });
    console.log('🧹 Sanitized object:', sanitized);
    
    // 3. Test CSRF protection
    console.log('\n3️⃣ Testing CSRF protection...');
    
    const token = csrfManager.generateToken();
    console.log(`🔐 Generated CSRF token: ${token.value.substring(0, 16)}...`);
    
    const validation = csrfManager.validateToken(token.value, {
      headers: { 'x-csrf-token': token.value },
      method: 'POST'
    });
    console.log(`✅ Token validation: ${validation.valid ? 'Valid' : 'Invalid'}`);
    
    // 4. Test TLS security
    console.log('\n4️⃣ Testing TLS security...');
    
    const tlsValidation = tlsManager.validateTLSRequest('https://example.com/api');
    console.log(`🌐 HTTPS validation: ${tlsValidation.allowed ? 'Allowed' : 'Blocked'}`);
    
    const httpValidation = tlsManager.validateTLSRequest('http://example.com/api');
    console.log(`🚫 HTTP validation: ${httpValidation.allowed ? 'Allowed' : 'Blocked'}`);
    
    // 5. Test client with security enabled
    console.log('\n5️⃣ Testing client with security features...');
    
    const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
      securityConfig: {
        memory: { enabled: true },
        tls: { enabled: true },
        csrf: { enabled: true }
      }
    });
    
    console.log('✅ Secure client created successfully');
    
    // Test security methods
    const memoryStats = client.getMemorySecurityStats();
    const tlsStats = client.getTLSSecurityStats();
    const csrfStats = client.getCSRFSecurityStats();
    
    console.log(`📊 Memory Stats: ${memoryStats.currentSensitiveRefs} refs`);
    console.log(`📊 TLS Stats: ${tlsStats.totalConnections} connections`);
    console.log(`📊 CSRF Stats: ${csrfStats.tokensGenerated} tokens generated`);
    
    // 6. Cleanup
    console.log('\n6️⃣ Cleaning up...');
    
    const cleaned = memoryManager.cleanupSensitiveData(dataId);
    console.log(`🧼 Cleaned sensitive data: ${cleaned ? 'Success' : 'Failed'}`);
    
    memoryManager.destroy();
    csrfManager.destroy();
    
    console.log('\n🎉 All security tests passed!');
    
  } catch (error) {
    console.error('❌ Security test failed:', error.message);
  }
}

testSecurityIntegration();
