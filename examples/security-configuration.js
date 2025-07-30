/**
 * Security Configuration Example
 * 
 * This example demonstrates how to configure security settings
 * in the JsonPlaceholder Client Library for production usage.
 */

const { JsonPlaceholderClient } = require('../dist/index');

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

  // Demo 2: Conservative Security Settings
  console.log('\n🛡️  Demo 2: Conservative Security Settings');
  
  const ultraSecureClient = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    securityConfig: {
      timeout: 3000,        // Very short timeout
      maxRedirects: 0,      // No redirects allowed
      validateStatus: (status) => {
        // Very strict - only 200 OK
        return status === 200;
      }
    }
  });

  try {
    console.log('   Making request with ultra-secure settings...');
    const posts = await ultraSecureClient.getPosts();
    console.log(`   ✅ Retrieved ${posts.length} posts with strict security settings`);
  } catch (error) {
    console.log(`   ⚠️  Ultra-secure request failed: ${error.message}`);
  }

  // Demo 3: Production-Ready Settings
  console.log('\n🏭 Demo 3: Production-Ready Settings');
  
  const productionClient = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    securityConfig: {
      timeout: 8000,        // Reasonable timeout for production
      maxRedirects: 2,      // Limited but not zero redirects
      validateStatus: (status) => {
        // Accept 2xx and 304 (not modified) responses
        return (status >= 200 && status < 300) || status === 304;
      }
    },
    loggerConfig: {
      level: 'warn'         // Only log warnings and errors in production
    }
  });

  try {
    console.log('   Making request with production-ready settings...');
    const users = await productionClient.getUsers();
    console.log(`   ✅ Retrieved ${users.length} users with production settings`);
    console.log('   🔒 Security features active:');
    console.log('      • 8-second timeout protection');
    console.log('      • Maximum 2 redirects allowed');
    console.log('      • Strict status code validation');
    console.log('      • Production logging level');
  } catch (error) {
    console.log(`   ❌ Production request failed: ${error.message}`);
  }

  console.log('\n✨ Security configuration example completed!\n');
  console.log('💡 Key Benefits:');
  console.log('   • Prevents hanging requests');
  console.log('   • Protects against redirect loops');
  console.log('   • Validates response status codes');
  console.log('   • Configurable for different environments');
}

// Run the example
if (require.main === module) {
  securityExample().catch(console.error);
}

module.exports = { securityExample };
