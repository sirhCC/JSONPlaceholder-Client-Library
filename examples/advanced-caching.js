// Advanced Caching Example
const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');

async function advancedCachingExample() {
  console.log('🚀 Advanced Caching Example\n');

  // Create client with advanced caching configuration
  const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    storage: 'localStorage',
    maxSize: 50,
    backgroundRefresh: true,
    refreshThreshold: 0.8, // Refresh when 80% of TTL has passed
    enableCompression: true
  });

  try {
    // Demo 1: Cache Performance
    console.log('📊 Demo 1: Cache Performance Benefits');
    
    console.log('   Making first request (will hit API)...');
    const start1 = performance.now();
    const posts1 = await client.getPosts();
    const time1 = performance.now() - start1;
    console.log(`   ⏱️  First request: ${time1.toFixed(2)}ms`);

    console.log('   Making second request (will use cache)...');
    const start2 = performance.now();
    const posts2 = await client.getPosts();
    const time2 = performance.now() - start2;
    console.log(`   ⚡ Cached request: ${time2.toFixed(2)}ms`);
    console.log(`   🚀 Speed improvement: ${(time1/time2).toFixed(1)}x faster!\n`);

    // Demo 2: Cache Statistics
    console.log('📈 Demo 2: Cache Statistics');
    let stats = client.getCacheStats();
    console.log(`   Hit Rate: ${stats.hitRate.toFixed(1)}%`);
    console.log(`   Total Requests: ${stats.totalRequests}`);
    console.log(`   Cache Hits: ${stats.hits}`);
    console.log(`   Cache Misses: ${stats.misses}\n`);

    // Demo 3: Different TTL for Different Data
    console.log('⏰ Demo 3: Custom TTL for Different Data Types');
    
    // Posts: 10 minutes (change frequently)
    await client.getPosts({ ttl: 10 * 60 * 1000 });
    console.log('   ✅ Posts cached for 10 minutes');
    
    // Users: 30 minutes (change less frequently)
    await client.getUsers({ ttl: 30 * 60 * 1000 });
    console.log('   ✅ Users cached for 30 minutes');
    
    // Comments: 5 minutes (can change often)
    await client.getComments(1, { ttl: 5 * 60 * 1000 });
    console.log('   ✅ Comments cached for 5 minutes\n');

    // Demo 4: Cache Management
    console.log('🔧 Demo 4: Cache Management');
    
    // Get updated stats
    stats = client.getCacheStats();
    console.log(`   Current cache entries: ${stats.entryCount}`);
    console.log(`   Cache size: ${(stats.currentSize / 1024).toFixed(2)} KB`);
    
    // Clear specific cache entry
    await client.deleteCacheEntry('posts');
    console.log('   🗑️  Cleared posts cache entry');
    
    // Force refresh example
    console.log('   🔄 Force refreshing user data...');
    const freshUser = await client.getUser(1, { forceRefresh: true });
    console.log(`   ✅ Fresh user data: ${freshUser.name}\n`);

    // Demo 5: Concurrent Request Deduplication
    console.log('🔀 Demo 5: Concurrent Request Deduplication');
    console.log('   Making 5 simultaneous requests for the same data...');
    
    const startConcurrent = performance.now();
    const promises = Array(5).fill(null).map(() => client.getPost(1));
    const results = await Promise.all(promises);
    const timeConcurrent = performance.now() - startConcurrent;
    
    console.log(`   ✅ All 5 requests completed in ${timeConcurrent.toFixed(2)}ms`);
    console.log('   🎯 Only 1 actual API call was made (deduplication)');
    console.log(`   📊 All requests returned identical data: ${results.every(r => r.id === results[0].id)}\n`);

    // Demo 6: Cache Events
    console.log('📡 Demo 6: Cache Event Monitoring');
    
    // Add cache event listener
    const eventListener = (event) => {
      console.log(`   📨 Cache ${event.type}: ${event.key} at ${new Date(event.timestamp).toLocaleTimeString()}`);
    };
    
    client.addCacheEventListener(eventListener);
    
    // Generate some cache events
    await client.getPost(2); // Cache miss
    await client.getPost(2); // Cache hit
    await client.clearCache(); // Cache clear
    
    // Remove listener
    client.removeCacheEventListener(eventListener);
    console.log('   🔇 Event listener removed\n');

    // Demo 7: Prefetching
    console.log('⚡ Demo 7: Data Prefetching');
    console.log('   Prefetching data for better UX...');
    
    await Promise.all([
      client.prefetchPosts(),
      client.prefetchUser(2),
      client.prefetchComments(2)
    ]);
    
    console.log('   ✅ Data prefetched successfully');
    console.log('   🚀 Next requests for this data will be instant!\n');

    // Final stats
    console.log('📊 Final Cache Statistics:');
    const finalStats = client.getCacheStats();
    console.log(`   Total Requests: ${finalStats.totalRequests}`);
    console.log(`   Hit Rate: ${finalStats.hitRate.toFixed(1)}%`);
    console.log(`   Background Refreshes: ${finalStats.backgroundRefreshes}`);
    console.log(`   Average Response Time: ${finalStats.averageResponseTime.toFixed(2)}ms`);

    console.log('\n✨ Advanced caching example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  advancedCachingExample();
}

module.exports = { advancedCachingExample };
