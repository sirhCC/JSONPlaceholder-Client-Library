// Interceptors and Error Handling Example
const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');

async function interceptorsAndErrorHandlingExample() {
  console.log('🛡️ Interceptors and Error Handling Example\n');

  const client = new JsonPlaceholderClient();

  try {
    // Demo 1: Request Interceptors
    console.log('📤 Demo 1: Request Interceptors');

    // Add authentication interceptor
    console.log('   Adding authentication interceptor...');
    const authInterceptor = client.addAuthInterceptor('Bearer demo-token-12345');
    console.log('   ✅ Authentication interceptor added');

    // Add custom request interceptor
    console.log('   Adding custom request interceptor...');
    const customRequestInterceptor = client.addRequestInterceptor((config) => {
      console.log(`   🔍 Intercepting request to: ${config.url}`);
      config.headers = config.headers || {};
      config.headers['X-Client-Version'] = '1.0.0';
      config.headers['X-Request-ID'] = `req-${Date.now()}`;
      return config;
    });
    console.log('   ✅ Custom request interceptor added\n');

    // Demo 2: Response Interceptors
    console.log('📥 Demo 2: Response Interceptors');

    // Add response logging interceptor
    console.log('   Adding response logging interceptor...');
    const loggingInterceptor = client.addLoggingInterceptor();
    console.log('   ✅ Logging interceptor added');

    // Add custom response interceptor
    console.log('   Adding custom response interceptor...');
    const responseInterceptor = client.addResponseInterceptor((response) => {
      console.log(`   📊 Response status: ${response.status}, Data length: ${JSON.stringify(response.data).length} chars`);
      return response;
    });
    console.log('   ✅ Response interceptor added\n');

    // Demo 3: Making Requests with Interceptors
    console.log('🚀 Demo 3: Requests with Active Interceptors');
    console.log('   Making request with all interceptors active...');
    
    const posts = await client.getPosts();
    console.log(`   ✅ Retrieved ${posts.length} posts (interceptors processed)\n`);

    // Demo 4: Retry Interceptor
    console.log('🔄 Demo 4: Retry Logic');
    console.log('   Adding retry interceptor...');
    
    const retryInterceptor = client.addRetryInterceptor({
      retries: 3,
      delay: 1000,
      backoff: 'exponential',
      retryCondition: (error) => {
        console.log(`   🔍 Checking if error should be retried: ${error.status}`);
        return error.status >= 500 || error.code === 'NETWORK_ERROR';
      }
    });
    console.log('   ✅ Retry interceptor added (3 retries, exponential backoff)\n');

    // Demo 5: Error Handling
    console.log('❌ Demo 5: Error Handling');

    // Try to get a non-existent post
    console.log('   Attempting to get non-existent post (ID: 999)...');
    try {
      await client.getPost(999);
    } catch (error) {
      console.log(`   ⚠️  Caught expected error: ${error.status} - ${error.message}`);
      console.log(`   📍 Error context: ${error.context || 'N/A'}`);
    }

    // Try to get posts with invalid parameters
    console.log('   Testing error handling with invalid search...');
    try {
      await client.searchPosts({ _page: -1, _limit: 0 });
    } catch (error) {
      console.log(`   ⚠️  Caught validation error: ${error.message}`);
    }

    // Demo 6: Error Interceptor
    console.log('\n🔧 Demo 6: Error Response Interceptor');
    console.log('   Adding error response interceptor...');
    
    const errorInterceptor = client.addResponseInterceptor(
      (response) => response, // Success handler
      (error) => { // Error handler
        console.log(`   🚨 Error interceptor caught: ${error.status} ${error.message}`);
        
        // Add custom error metadata
        error.timestamp = new Date().toISOString();
        error.retryable = error.status >= 500;
        
        return Promise.reject(error);
      }
    );
    console.log('   ✅ Error interceptor added');

    // Test error interceptor
    console.log('   Testing error interceptor...');
    try {
      await client.getPost(999);
    } catch (error) {
      console.log(`   📊 Error metadata added: timestamp=${error.timestamp}, retryable=${error.retryable}\n`);
    }

    // Demo 7: Interceptor Management
    console.log('🔧 Demo 7: Interceptor Management');
    
    console.log('   Current interceptors active:');
    console.log(`      - Auth interceptor: ${authInterceptor ? 'Active' : 'Inactive'}`);
    console.log(`      - Logging interceptor: ${loggingInterceptor ? 'Active' : 'Inactive'}`);
    console.log(`      - Retry interceptor: ${retryInterceptor ? 'Active' : 'Inactive'}`);

    // Remove specific interceptors
    console.log('   Removing auth interceptor...');
    client.removeRequestInterceptor(authInterceptor);
    console.log('   ✅ Auth interceptor removed');

    console.log('   Removing response interceptor...');
    client.removeResponseInterceptor(responseInterceptor);
    console.log('   ✅ Response interceptor removed');

    // Test request without auth
    console.log('   Making request without auth interceptor...');
    const postsWithoutAuth = await client.getPost(1);
    console.log(`   ✅ Request successful: "${postsWithoutAuth.title}"\n`);

    // Demo 8: Default Interceptors Setup
    console.log('⚙️ Demo 8: Default Interceptors Setup');
    
    // Clear all interceptors first
    console.log('   Clearing all interceptors...');
    client.clearInterceptors();
    console.log('   ✅ All interceptors cleared');

    // Setup default interceptors
    console.log('   Setting up default interceptors...');
    client.setupDefaultInterceptors();
    console.log('   ✅ Default interceptors configured');
    console.log('      - Includes: logging, retry, error handling');

    // Test with defaults
    console.log('   Testing with default interceptors...');
    const defaultTest = await client.getPost(1);
    console.log(`   ✅ Default interceptors working: "${defaultTest.title}"\n`);

    // Demo 9: Real-world Error Scenarios
    console.log('🌍 Demo 9: Real-world Error Scenarios');
    
    // Simulate network timeout scenario
    console.log('   Scenario 1: Network timeout handling...');
    try {
      // This would timeout in a real network issue
      await client.getPosts({ forceRefresh: true });
      console.log('   ✅ Network request successful');
    } catch (error) {
      console.log(`   ⚠️  Network error handled: ${error.message}`);
    }

    // Simulate rate limiting scenario
    console.log('   Scenario 2: Rate limiting awareness...');
    const rateLimitStart = performance.now();
    try {
      // Multiple rapid requests
      await Promise.all([
        client.getPost(1),
        client.getPost(2),
        client.getPost(3),
        client.getPost(4),
        client.getPost(5)
      ]);
      const rateLimitTime = performance.now() - rateLimitStart;
      console.log(`   ✅ Handled 5 concurrent requests in ${rateLimitTime.toFixed(2)}ms`);
    } catch (error) {
      console.log(`   ⚠️  Rate limit error: ${error.message}`);
    }

    // Demo 10: Performance Monitoring
    console.log('\n📊 Demo 10: Performance Monitoring with Interceptors');
    
    let requestCount = 0;
    let totalResponseTime = 0;

    const performanceInterceptor = client.addRequestInterceptor((config) => {
      config.metadata = { startTime: performance.now() };
      requestCount++;
      return config;
    });

    const performanceResponseInterceptor = client.addResponseInterceptor((response) => {
      const endTime = performance.now();
      const startTime = response.config?.metadata?.startTime || endTime;
      const responseTime = endTime - startTime;
      totalResponseTime += responseTime;
      
      console.log(`   ⏱️  Request ${requestCount}: ${responseTime.toFixed(2)}ms`);
      return response;
    });

    console.log('   Making monitored requests...');
    await client.getPost(1);
    await client.getUsers();
    await client.getComments(1);

    const avgResponseTime = totalResponseTime / 3;
    console.log(`   📊 Average response time: ${avgResponseTime.toFixed(2)}ms`);

    // Cleanup
    client.removeRequestInterceptor(performanceInterceptor);
    client.removeResponseInterceptor(performanceResponseInterceptor);

    console.log('\n✨ Interceptors and error handling example completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the example
if (require.main === module) {
  interceptorsAndErrorHandlingExample();
}

module.exports = { interceptorsAndErrorHandlingExample };
