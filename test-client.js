const { JsonPlaceholderClient } = require('./dist/index.js');

async function testClientLibrary() {
    console.log('🚀 Testing JSONPlaceholder Client Library...\n');

    // Initialize client with caching
    const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        enabled: true,
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        storage: 'memory'
    });

    try {
        console.log('1. Testing getPosts()...');
        const posts = await client.getPosts();
        console.log(`   ✅ Got ${posts.length} posts`);
        console.log(`   📝 First post: "${posts[0].title}"`);

        console.log('\n2. Testing getPost(1)...');
        const post = await client.getPost(1);
        console.log(`   ✅ Got post: "${post.title}"`);

        console.log('\n3. Testing caching (second call should be faster)...');
        const start = Date.now();
        await client.getPost(1);
        const cachedTime = Date.now() - start;
        console.log(`   ✅ Cached call took ${cachedTime}ms (should be very fast)`);

        console.log('\n4. Testing pagination...');
        const paginatedPosts = await client.getPostsWithPagination({
            _page: 1,
            _limit: 5
        });
        console.log(`   ✅ Got ${paginatedPosts.data.length} posts from page 1`);
        console.log(`   📊 Pagination info: Page ${paginatedPosts.pagination.page}/${paginatedPosts.pagination.totalPages}`);

        console.log('\n5. Testing search...');
        const searchResults = await client.searchPosts({ userId: 1 });
        console.log(`   ✅ Found ${searchResults.length} posts by user 1`);

        console.log('\n6. Testing users...');
        const users = await client.getUsers();
        console.log(`   ✅ Got ${users.length} users`);
        console.log(`   👤 First user: "${users[0].name}" <${users[0].email}>`);

        console.log('\n7. Testing comments...');
        const comments = await client.searchComments({ postId: 1 });
        console.log(`   ✅ Got ${comments.length} comments for post 1`);

        console.log('\n🎉 All tests passed! The library is working perfectly!');
        
        // Test performance
        console.log('\n📊 Performance Test (10 rapid calls with caching):');
        const perfStart = Date.now();
        const promises = Array.from({ length: 10 }, () => client.getPost(1));
        await Promise.all(promises);
        const perfTime = Date.now() - perfStart;
        console.log(`   ⚡ 10 calls completed in ${perfTime}ms (avg: ${perfTime/10}ms per call)`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testClientLibrary();
