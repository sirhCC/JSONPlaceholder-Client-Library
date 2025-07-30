/**
 * Developer Experience Enhancement Demo
 *
 * This file demonstrates the enhanced developer experience features of the client library.
 * It shows interactive debugging, code generation, network simulation, and enhanced error handling.
 */
import { JsonPlaceholderClient } from './client';
async function demonstrateDeveloperExperience() {
    // Create client with developer mode enabled
    const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        devModeConfig: {
            enabled: true,
            verboseLogging: true,
            requestInspection: true,
            responseInspection: true,
            performanceWarnings: true,
            cacheDebugging: true,
            autoGenerateExamples: true,
            networkSimulation: {
                enabled: false // We'll enable this later
            }
        },
        cacheConfig: {
            enabled: true,
            defaultTTL: 300000 // 5 minutes
        },
        loggerConfig: {
            level: 'debug'
        }
    });
    console.log('🚀 Developer Experience Enhancement Demo\n');
    // 1. Auto-generated Code Examples
    console.log('📝 1. Auto-Generated Code Examples:');
    const examples = client.getCodeExamples();
    examples.slice(0, 2).forEach((example, index) => {
        console.log(`\n   Example ${index + 1}: ${example.title}`);
        console.log(`   Description: ${example.description}`);
        console.log(`   Category: ${example.category}`);
        console.log(`   Code preview: ${example.code.split('\n')[0]}...`);
    });
    // Generate specific example
    const postsExample = client.generateCodeExample('getPosts');
    if (postsExample) {
        console.log(`\n   Generated example for 'getPosts':`);
        console.log(`   ${postsExample.code}`);
    }
    // 2. Request/Response Inspection
    console.log('\n🔍 2. Request/Response Inspection:');
    console.log('   Making requests with detailed inspection...');
    try {
        // Make a few requests to populate inspection data
        await client.getPosts();
        await client.getUsers();
        // Get inspection data
        const requests = client.getRequestInspections();
        const responses = client.getResponseInspections();
        console.log(`   📊 Captured ${requests.length} requests and ${responses.length} responses`);
        if (requests.length > 0) {
            const lastRequest = requests[requests.length - 1];
            console.log(`   🔍 Last request: ${lastRequest.method} ${lastRequest.url}`);
            console.log(`   📱 Cache key: ${lastRequest.cacheKey}`);
        }
        if (responses.length > 0) {
            const lastResponse = responses[responses.length - 1];
            console.log(`   📥 Last response: ${lastResponse.status} (${lastResponse.responseTime}ms)`);
            console.log(`   💾 Cache hit: ${lastResponse.cacheHit ? 'Yes' : 'No'}`);
            console.log(`   📦 Size: ${lastResponse.size ? Math.round(lastResponse.size / 1024) : 'Unknown'}KB`);
        }
    }
    catch (error) {
        console.log(`   ❌ Error during requests: ${error.message}`);
    }
    // 3. Developer Debug Report
    console.log('\n📊 3. Developer Debug Report:');
    console.log(client.getDeveloperDebugReport());
    // 4. Network Simulation
    console.log('\n🌐 4. Network Simulation Testing:');
    console.log('   Simulating slow network conditions...');
    client.simulateNetworkConditions({
        latency: 200, // 200ms delay
        packetLoss: 0.05, // 5% packet loss
        bandwidth: 50000 // 50KB/s
    });
    const slowStart = Date.now();
    try {
        await client.getPosts();
        const slowEnd = Date.now();
        console.log(`   🐌 Request with simulation took: ${slowEnd - slowStart}ms`);
    }
    catch (error) {
        console.log(`   ❌ Simulated network error: ${error.message}`);
    }
    // Disable network simulation
    client.simulateNetworkConditions({ latency: 0 });
    console.log('   ✅ Network simulation disabled');
    // 5. Enhanced Error Handling
    console.log('\n⚠️ 5. Enhanced Error Handling:');
    // Create a developer-friendly error with tips
    const devError = client.createDeveloperFriendlyError('Failed to fetch posts', 'FETCH_POSTS_ERROR', [
        'Check your internet connection',
        'Verify the API endpoint is accessible',
        'Consider enabling caching for better reliability',
        'Use error recovery features for automatic retries'
    ], [
        'client.getPosts({ cache: { enabled: true } })',
        'client.setDeveloperMode(true) // for better debugging'
    ]);
    console.log('   📝 Developer-friendly error example:');
    console.log(`   ${devError.toString()}`);
    // 6. Performance Monitoring Integration
    console.log('\n⚡ 6. Performance & Error Recovery Integration:');
    // Get comprehensive insights
    const performanceReport = client.getPerformanceReport();
    const errorRecoveryReport = client.getErrorRecoveryReport();
    console.log('   📊 Performance Report Summary:');
    const performanceLines = performanceReport.split('\n');
    performanceLines.slice(0, 8).forEach((line) => {
        if (line.trim())
            console.log(`   ${line}`);
    });
    console.log('\n   🛡️ Error Recovery Status:');
    const errorLines = errorRecoveryReport.split('\n');
    errorLines.slice(0, 8).forEach((line) => {
        if (line.trim())
            console.log(`   ${line}`);
    });
    // 7. Debug Data Export
    console.log('\n💾 7. Debug Data Export:');
    const debugData = client.exportDebugData();
    console.log(`   📦 Debug data contains:`);
    console.log(`   • Configuration settings`);
    console.log(`   • ${Object.keys(debugData).includes('requests') ? 'Request inspection data' : 'No request data'}`);
    console.log(`   • ${Object.keys(debugData).includes('responses') ? 'Response inspection data' : 'No response data'}`);
    console.log(`   • ${Object.keys(debugData).includes('warnings') ? 'Performance warnings' : 'No warnings'}`);
    console.log(`   • Timestamp: ${debugData.timestamp}`);
    // 8. Interactive Console Tools (Browser only)
    console.log('\n🛠️ 8. Interactive Console Tools:');
    if (typeof window !== 'undefined') {
        console.log('   ✅ JsonPlaceholder Developer Tools are available in browser console');
        console.log('   🔧 Try: window.JsonPlaceholderDevTools.inspectRequests()');
        console.log('   🔍 Try: window.JsonPlaceholderDevTools.getPerformanceWarnings()');
        console.log('   📊 Try: window.JsonPlaceholderDevTools.exportDebugData()');
    }
    else {
        console.log('   ℹ️ Interactive console tools available in browser environment');
        console.log('   🌐 Run this demo in a browser to access window.JsonPlaceholderDevTools');
    }
    // 9. Code Quality and Best Practices
    console.log('\n✨ 9. Developer Experience Features Summary:');
    console.log('   ✅ Auto-generated code examples for quick integration');
    console.log('   ✅ Real-time request/response inspection for debugging');
    console.log('   ✅ Network condition simulation for testing');
    console.log('   ✅ Enhanced error messages with actionable tips');
    console.log('   ✅ Performance monitoring with developer insights');
    console.log('   ✅ Debug data export for issue reporting');
    console.log('   ✅ Interactive browser console tools');
    console.log('   ✅ Comprehensive logging with context');
    console.log('   ✅ Developer-friendly configuration options');
    // Clean up debug data
    console.log('\n🧹 Cleaning up debug data...');
    client.clearDebugData();
    console.log('   ✅ Debug data cleared');
    console.log('\n🎯 Developer Experience Enhancement System is fully operational!');
    console.log('🚀 Ready to accelerate your development workflow!');
}
// Helper function to demonstrate error handling
async function demonstrateErrorHandling() {
    console.log('\n📚 Error Handling Best Practices:');
    const client = new JsonPlaceholderClient('https://invalid-api-endpoint.com', {
        devModeConfig: { enabled: true },
        errorRecoveryConfig: {
            retry: { enabled: true, maxAttempts: 2 },
            fallback: { enabled: true, cacheAsFallback: true }
        }
    });
    try {
        await client.getPosts();
    }
    catch (error) {
        if (error instanceof Error) {
            console.log('   🔧 Developer tip: This error includes debugging context');
            console.log(`   📝 Error message: ${error.message}`);
            console.log('   💡 Consider enabling fallback strategies for better resilience');
        }
    }
}
// Run the demo
if (require.main === module) {
    demonstrateDeveloperExperience()
        .then(() => demonstrateErrorHandling())
        .catch(console.error);
}
export { demonstrateDeveloperExperience, demonstrateErrorHandling };
//# sourceMappingURL=developer-experience-demo.js.map