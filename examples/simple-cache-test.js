// Simple Caching Test
const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');

async function simpleCacheTest() {
  console.log('🔧 Simple Cache Test\n');

  try {
    // Create client with caching
    const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
      enabled: true,
      defaultTTL: 5 * 60 * 1000,
      storage: 'memory'
    });

    console.log('1. Making first API call...');
    const posts1 = await client.getPosts();
    console.log(`   ✅ Retrieved ${posts1.length} posts`);

    console.log('2. Making second API call (should use cache)...');
    const posts2 = await client.getPosts();
    console.log(`   ✅ Retrieved ${posts2.length} posts (from cache)`);

    console.log('3. Checking cache stats...');
    const stats = client.getCacheStats();
    console.log(`   📊 Hit rate: ${stats.hitRate}%`);
    console.log(`   📈 Total requests: ${stats.totalRequests}`);

    console.log('\n✨ Simple cache test completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  simpleCacheTest();
}

module.exports = { simpleCacheTest };
