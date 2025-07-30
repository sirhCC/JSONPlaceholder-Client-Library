/**
 * Security Configuration Example
 * 
 * This example demonstrates how to configure security settings
 * in the JsonPlaceholder Client Library for production usage.
 */

const { JsonPlaceholderClient, DataSanitizer } = require('../dist/index');

async function securityExample() {
  console.log('🔒 Security Configuration Example\n');

  // Demo 1: Custom Timeout Configuration
  console.log('⏱️  Demo 1: Custom Timeout Configuration');
  
  const secureClient = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    securityConfig: {
      timeout: 5000,        // 5 second timeout (shorter for better security)
      maxRedirects: 3,      // Limit redirects to prevent redirect loops
      validateStatus: (status) => {
        // Only accept 2xx status codes as successful
        return status >= 200 && status < 300;
      }
    }
  });

  try {
    console.log('   Making request with 5-second timeout...');
    const start = performance.now();
    const post = await secureClient.getPost(1);
    const duration = performance.now() - start;
    
    console.log(`   ✅ Request completed in ${duration.toFixed(2)}ms`);
    console.log(`   📄 Post title: "${post.title}"`);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('   ⚠️  Request timed out after 5 seconds');
    } else {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }

  // Demo 2: Data Sanitization
  console.log('\n🧹 Demo 2: Data Sanitization');
  
  const clientWithSanitization = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    securityConfig: {
      sanitization: {
        enabled: true,
        stripHtml: true,
        trimWhitespace: true,
        maxStringLength: 1000
      }
    }
  });

  // Test with potentially dangerous data
  const maliciousData = {
    title: '<script>alert("XSS Attack!")</script>My Safe Post',
    body: '  This post contains javascript:alert("XSS") and should be cleaned  ',
    userId: 1
  };

  console.log('   🔍 Original data:', JSON.stringify(maliciousData, null, 2));
  
  const sanitizedData = clientWithSanitization.sanitizeRequestData(maliciousData);
  console.log('   ✅ Sanitized data:', JSON.stringify(sanitizedData, null, 2));
  
  // Check if data is dangerous
  const isDangerous = clientWithSanitization.isDangerousData(maliciousData);
  console.log(`   🚨 Original data is dangerous: ${isDangerous}`);
  
  const isSafeSanitized = clientWithSanitization.isDangerousData(sanitizedData);
  console.log(`   ✅ Sanitized data is safe: ${!isSafeSanitized}`);

  // Demo 3: Standalone Data Sanitizer
  console.log('\n🛡️  Demo 3: Standalone Data Sanitizer');
  
  const sanitizer = new DataSanitizer({
    enabled: true,
    stripHtml: true,
    maxStringLength: 100,
    blockedPatterns: [
      /<script[^>]*>.*?<\/script>/gis,
      /javascript:\s*/gi,
      /on\w+\s*=/gi
    ]
  });

  const testData = [
    'Normal safe text',
    '<script>alert("XSS")</script>',
    'javascript:alert("XSS")',
    'onclick="alert(\'XSS\')"',
    '   Whitespace text   ',
    'a'.repeat(150) // Long string
  ];

  console.log('   Testing various inputs:');
  testData.forEach((input, index) => {
    const result = sanitizer.sanitize(input);
    const truncatedInput = input.length > 50 ? input.substring(0, 50) + '...' : input;
    console.log(`   ${index + 1}. Input:  "${truncatedInput}"`);
    console.log(`      Output: "${result.sanitized}"`);
    if (result.warnings.length > 0) {
      console.log(`      Warnings: ${result.warnings.join(', ')}`);
    }
    if (result.blocked.length > 0) {
      console.log(`      Blocked: ${result.blocked.join(', ')}`);
    }
    console.log('');
  });

  // Demo 4: Conservative Security Settings
  console.log('🛡️  Demo 4: Ultra-Secure Configuration');
  
  const ultraSecureClient = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    securityConfig: {
      timeout: 3000,        // Very short timeout
      maxRedirects: 0,      // No redirects allowed
      validateStatus: (status) => {
        // Very strict - only 200 OK
        return status === 200;
      },
      sanitization: {
        enabled: true,
        stripHtml: true,
        trimWhitespace: true,
        maxStringLength: 500,
        allowedTags: [], // No HTML tags allowed
        blockedPatterns: [
          /<[^>]*>/g,           // Block ALL HTML tags
          /javascript:/gi,
          /data:/gi,
          /vbscript:/gi
        ]
      }
    }
  });

  try {
    console.log('   Making ultra-secure request...');
    const users = await ultraSecureClient.getUsers();
    const sanitizedUsers = ultraSecureClient.sanitizeResponseData(users.slice(0, 2));
    console.log(`   ✅ Retrieved and sanitized ${sanitizedUsers.length} users with ultra-secure settings`);
    console.log('   🔒 Security features active:');
    console.log('      • 3-second timeout protection');
    console.log('      • Zero redirects allowed');
    console.log('      • Only 200 status accepted');
    console.log('      • All HTML tags stripped');
    console.log('      • All dangerous patterns blocked');
    console.log('      • 500 character limit enforced');
  } catch (error) {
    console.log(`   ⚠️  Ultra-secure request failed: ${error.message}`);
  }

  console.log('\n✨ Security configuration example completed!\n');
  console.log('💡 Key Security Benefits:');
  console.log('   • Prevents hanging requests with timeouts');
  console.log('   • Protects against redirect loops');
  console.log('   • Validates response status codes');
  console.log('   • Sanitizes request/response data');
  console.log('   • Blocks XSS and injection attacks');
  console.log('   • Configurable for different security levels');
  console.log('   • Production-ready with sensible defaults');
}

// Run the example
if (require.main === module) {
  securityExample().catch(console.error);
}

module.exports = { securityExample };
