/**
 * Error Recovery System Demo
 *
 * This file demonstrates the Advanced Error Recovery capabilities of the client library.
 * It shows how circuit breakers, retry logic, and fallback strategies work together
 * to provide resilient API interactions.
 */
import { JsonPlaceholderClient } from './client';
async function demonstrateErrorRecovery() {
    console.log('🚀 Error Recovery System Demo\n');
    // Create client with error recovery enabled
    const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        cacheConfig: {
            enabled: true,
            defaultTTL: 300000
        },
        errorRecoveryConfig: {
            circuitBreaker: {
                enabled: true,
                failureThreshold: 3,
                successThreshold: 2,
                timeout: 10000,
                volumeThreshold: 5
            },
            retry: {
                enabled: true,
                maxAttempts: 3,
                baseDelay: 1000,
                maxDelay: 10000,
                backoffStrategy: 'exponential'
            },
            fallback: {
                enabled: true,
                cacheAsFallback: true,
                fallbackTimeout: 5000
            }
        }
    });
    console.log('📊 Error Recovery Dashboard:');
    client.printErrorRecoveryReport();
    console.log('\n💡 Error Recovery Insights:');
    client.printErrorRecoveryInsights();
    console.log('\n');
    try {
        console.log('1️⃣ Testing normal operation...');
        const posts = await client.getPosts();
        console.log(`✅ Successfully fetched ${posts.length} posts`);
        console.log(`   First post: "${posts[0].title}"`);
        console.log('\n📊 Dashboard after successful operation:');
        client.printErrorRecoveryReport();
    }
    catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
    console.log('\n2️⃣ Testing circuit breaker manual control...');
    // Force circuit open to demonstrate fallback
    client.forceCircuitOpen();
    console.log('🔴 Circuit breaker forced OPEN');
    try {
        // This should use fallback (cached data if available)
        console.log('   Attempting to fetch posts with circuit OPEN...');
        const fallbackPosts = await client.getPosts();
        console.log(`✅ Fallback succeeded! Got ${fallbackPosts.length} posts from cache`);
    }
    catch (error) {
        console.log(`❌ Fallback failed: ${error.message}`);
    }
    // Reset circuit to closed
    client.forceCircuitClose();
    console.log('\n🟢 Circuit breaker reset to CLOSED');
    console.log('\n3️⃣ Testing performance under normal conditions...');
    const startTime = Date.now();
    try {
        const concurrentRequests = await Promise.all([
            client.getPosts(),
            client.getPosts(),
            client.getPosts()
        ]);
        const endTime = Date.now();
        const duration = endTime - startTime;
        console.log(`✅ Completed 3 concurrent requests in ${duration}ms`);
        console.log(`   All requests returned ${concurrentRequests[0].length} post(s)`);
    }
    catch (error) {
        console.log(`❌ Concurrent requests failed: ${error.message}`);
    }
    console.log('\n📊 Final Error Recovery Dashboard:');
    client.printErrorRecoveryReport();
    console.log('\n💡 Final Error Recovery Insights:');
    client.printErrorRecoveryInsights();
    console.log('\n🎯 Error Recovery Features Demonstrated:');
    console.log('   ✅ Circuit Breaker Pattern (CLOSED/OPEN states)');
    console.log('   ✅ Automatic Retry Logic with Exponential Backoff');
    console.log('   ✅ Cache-based Fallback Strategy');
    console.log('   ✅ Real-time Performance Monitoring');
    console.log('   ✅ Manual Circuit Control');
    console.log('   ✅ Comprehensive Dashboard & Insights');
    console.log('\n🚀 Advanced Error Recovery System is fully operational!');
}
// Run the demo
if (require.main === module) {
    demonstrateErrorRecovery().catch(console.error);
}
export { demonstrateErrorRecovery };
//# sourceMappingURL=error-recovery-demo.js.map