/**
 * Performance Monitoring Example
 * 
 * This example demonstrates the comprehensive performance monitoring capabilities
 * of the JsonPlaceholderClient library. It shows real-time metrics, analytics,
 * and performance insights.
 */

const { JsonPlaceholderClient } = require('../dist/index.js');

async function performanceMonitoringExample() {
  console.log('🔥 Performance Monitoring Example\n');
  console.log('Demonstrating comprehensive performance tracking and analytics...\n');

  try {
    // Create client with performance monitoring enabled
    const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
      performanceConfig: {
        enabled: true,
        maxMetrics: 500,
        alertThresholds: {
          responseTime: 800, // 800ms threshold
          errorRate: 3, // 3% error rate
          cacheHitRate: 75, // 75% cache hit rate
          memoryUsage: 80 // 80% memory usage
        },
        trendInterval: 30000, // 30 seconds
        enableMemoryTracking: true,
        enableRealTimeAlerts: true
      },
      cacheConfig: {
        enabled: true,
        defaultTTL: 60000, // 1 minute
        maxSize: 100
      }
    });

    // Setup performance event listeners
    client.addPerformanceEventListener((event) => {
      switch (event.type) {
        case 'alert':
          console.log(`🚨 ALERT: ${event.data.message}`);
          break;
        case 'trend':
          console.log(`📊 Trend Update: ${event.data.responseTime.toFixed(2)}ms avg, ${event.data.cacheHitRate.toFixed(1)}% cache hit`);
          break;
      }
    });

    console.log('📈 Demo 1: Basic Performance Tracking');
    console.log('   Making initial API calls to collect baseline metrics...');
    
    // Make some initial requests
    const start1 = performance.now();
    await client.getPosts();
    const time1 = performance.now() - start1;
    console.log(`   ✅ First request (API): ${time1.toFixed(2)}ms`);

    const start2 = performance.now();
    await client.getPosts(); // This should be cached
    const time2 = performance.now() - start2;
    console.log(`   ✅ Second request (Cache): ${time2.toFixed(2)}ms\n`);

    // Demo 2: Performance Statistics
    console.log('📊 Demo 2: Real-time Performance Statistics');
    let stats = client.getPerformanceStats();
    console.log(`   Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%`);
    console.log(`   Total Requests: ${stats.totalRequests}`);
    console.log(`   Error Rate: ${stats.errorRate.toFixed(1)}%`);
    if (stats.memoryUsage) {
      console.log(`   Memory Usage: ${stats.memoryUsage.percentage.toFixed(1)}%`);
    }
    console.log('');

    // Demo 3: Concurrent Request Performance
    console.log('⚡ Demo 3: Concurrent Request Performance Analysis');
    console.log('   Executing 10 concurrent requests to test deduplication...');
    
    const concurrentStart = performance.now();
    const promises = Array.from({ length: 10 }, (_, i) => 
      client.getPost(Math.floor(i / 2) + 1) // Some duplicates to test deduplication
    );
    await Promise.all(promises);
    const concurrentTime = performance.now() - concurrentStart;
    
    console.log(`   ✅ 10 concurrent requests completed in ${concurrentTime.toFixed(2)}ms`);
    console.log(`   Average per request: ${(concurrentTime / 10).toFixed(2)}ms\n`);

    // Demo 4: Mixed Request Types Performance
    console.log('🎯 Demo 4: Mixed Request Types Performance');
    console.log('   Testing different API endpoints and their performance characteristics...');
    
    const operations = [
      { name: 'Get Posts', fn: () => client.getPosts() },
      { name: 'Get Users', fn: () => client.getUsers() },
      { name: 'Get Comments', fn: () => client.getComments(1) },
      { name: 'Get User Posts', fn: () => client.getPostsByUser(1) },
      { name: 'Search Posts', fn: () => client.searchPosts({ userId: 1 }) }
    ];

    for (const operation of operations) {
      const opStart = performance.now();
      await operation.fn();
      const opTime = performance.now() - opStart;
      console.log(`   ✅ ${operation.name}: ${opTime.toFixed(2)}ms`);
    }
    console.log('');

    // Demo 5: Performance Dashboard Report
    console.log('📋 Demo 5: Performance Dashboard Report');
    console.log('   Generating comprehensive performance report...\n');
    client.printPerformanceReport();

    // Demo 6: Performance Insights
    console.log('💡 Demo 6: AI-Powered Performance Insights');
    console.log('   Analyzing performance data for optimization recommendations...\n');
    client.printPerformanceInsights();

    // Demo 7: Export Performance Data
    console.log('📤 Demo 7: Performance Data Export');
    const exportData = client.exportPerformanceData();
    console.log(`   Exported ${exportData.metrics.length} performance metrics`);
    console.log(`   Data includes: response times, cache hits, error rates, memory usage`);
    console.log(`   Use this data for external analysis or monitoring dashboards\n`);

    // Demo 8: Custom Performance Alerts
    console.log('🔔 Demo 8: Custom Performance Alert Testing');
    console.log('   Configuring stricter thresholds to trigger alerts...');
    
    client.configurePerformanceMonitoring({
      alertThresholds: {
        responseTime: 100, // Very strict - 100ms
        errorRate: 1, // 1%
        cacheHitRate: 90, // 90%
        memoryUsage: 70 // 70%
      }
    });

    // Make a slow request to trigger alert
    console.log('   Making request that should trigger response time alert...');
    await client.getUsers();
    console.log('');

    // Demo 9: Performance Monitoring Configuration
    console.log('⚙️ Demo 9: Performance Monitoring Configuration');
    const config = client.getPerformanceStats();
    console.log('   Current performance monitoring settings:');
    console.log(`   - Tracking enabled: ${config.totalRequests > 0 ? 'Yes' : 'No'}`);
    console.log(`   - Metrics collected: ${config.totalRequests}`);
    console.log(`   - Cache monitoring: ${config.cacheHits + config.cacheMisses > 0 ? 'Yes' : 'No'}`);
    console.log(`   - Memory tracking: ${config.memoryUsage ? 'Yes' : 'No'}`);
    console.log('');

    // Demo 10: Real-world Scenarios
    console.log('🌍 Demo 10: Real-world Performance Scenarios');
    console.log('   Simulating various application usage patterns...\n');

    // Scenario 1: High-frequency requests (dashboard loading)
    console.log('   Scenario A: Dashboard Loading (high-frequency requests)');
    const dashboardStart = performance.now();
    await Promise.all([
      client.getPosts({ _limit: 10 }),
      client.getUsers({ _limit: 5 }),
      client.searchComments({ _limit: 20 })
    ]);
    const dashboardTime = performance.now() - dashboardStart;
    console.log(`   ✅ Dashboard data loaded in ${dashboardTime.toFixed(2)}ms`);

    // Scenario 2: User interaction sequence
    console.log('   Scenario B: User Interaction Sequence');
    const interactionStart = performance.now();
    const posts = await client.getPosts({ _limit: 5 });
    const user = await client.getUser(posts[0].userId);
    const comments = await client.getComments(posts[0].id);
    const interactionTime = performance.now() - interactionStart;
    console.log(`   ✅ User interaction flow completed in ${interactionTime.toFixed(2)}ms`);

    // Scenario 3: Search and filter operations
    console.log('   Scenario C: Search and Filter Operations');
    const searchStart = performance.now();
    await Promise.all([
      client.searchPosts({ userId: 1, _sort: 'title' }),
      client.searchUsers({ name: 'Leanne' }),
      client.searchComments({ email: 'Eliseo@gardner.biz' })
    ]);
    const searchTime = performance.now() - searchStart;
    console.log(`   ✅ Search operations completed in ${searchTime.toFixed(2)}ms\n`);

    // Final Performance Summary
    console.log('📊 FINAL PERFORMANCE SUMMARY');
    console.log('═'.repeat(50));
    const finalStats = client.getPerformanceStats();
    console.log(`Total Requests Processed: ${finalStats.totalRequests}`);
    console.log(`Average Response Time: ${finalStats.averageResponseTime.toFixed(2)}ms`);
    console.log(`95th Percentile: ${finalStats.p95ResponseTime.toFixed(2)}ms`);
    console.log(`Cache Hit Rate: ${finalStats.cacheHitRate.toFixed(1)}%`);
    console.log(`Error Rate: ${finalStats.errorRate.toFixed(1)}%`);
    console.log(`Throughput: ${finalStats.requestsPerSecond.toFixed(2)} req/s`);
    
    if (finalStats.averageCacheResponseTime > 0 && finalStats.averageApiResponseTime > 0) {
      const speedup = finalStats.averageApiResponseTime / finalStats.averageCacheResponseTime;
      console.log(`Cache Speedup: ${speedup.toFixed(1)}x faster than API calls`);
    }
    
    console.log('\n✨ Performance monitoring example completed successfully!');
    console.log('\n🎯 Key Takeaways:');
    console.log('   • Performance monitoring provides real-time insights');
    console.log('   • Cache hit rates dramatically improve response times');
    console.log('   • Concurrent request deduplication prevents redundant calls');
    console.log('   • Performance alerts help identify issues before they impact users');
    console.log('   • Detailed analytics enable data-driven optimization decisions');

  } catch (error) {
    console.error('❌ Error in performance monitoring example:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the example
if (require.main === module) {
  performanceMonitoringExample();
}

module.exports = { performanceMonitoringExample };
