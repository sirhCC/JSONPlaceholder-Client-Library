// Search and Filtering Example
const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');

async function searchAndFilteringExample() {
  console.log('🔍 Search and Filtering Example\n');

  const client = new JsonPlaceholderClient();

  try {
    // Demo 1: Basic Post Filtering
    console.log('📝 Demo 1: Post Filtering');
    
    // Get posts by specific user
    console.log('   Finding posts by user #1...');
    const userPosts = await client.getPostsByUser(1);
    console.log(`   ✅ Found ${userPosts.length} posts by user #1`);
    
    // Search posts with pagination
    console.log('   Searching posts with pagination...');
    const paginatedPosts = await client.getPostsWithPagination({
      _page: 1,
      _limit: 5,
      _sort: 'id',
      _order: 'desc'
    });
    console.log(`   ✅ Page ${paginatedPosts.pagination.page} of ${paginatedPosts.pagination.totalPages}`);
    console.log(`   📊 ${paginatedPosts.data.length} posts (${paginatedPosts.pagination.total} total)\n`);

    // Demo 2: Advanced Post Search
    console.log('🔎 Demo 2: Advanced Post Search');
    
    // Full-text search
    console.log('   Searching for posts containing "qui"...');
    const searchResults = await client.searchPosts({
      q: 'qui',
      _limit: 3
    });
    console.log(`   ✅ Found ${searchResults.length} posts matching "qui"`);
    searchResults.forEach((post, index) => {
      console.log(`      ${index + 1}. "${post.title.substring(0, 30)}..."`);
    });

    // Complex search with multiple filters
    console.log('\n   Complex search: User #1 posts, sorted by title...');
    const complexSearch = await client.searchPosts({
      userId: 1,
      _sort: 'title',
      _order: 'asc',
      _limit: 3
    });
    console.log(`   ✅ Found ${complexSearch.length} posts:`);
    complexSearch.forEach((post, index) => {
      console.log(`      ${index + 1}. "${post.title}"`);
    });

    // Demo 3: Comment Filtering
    console.log('\n💬 Demo 3: Comment Filtering');
    
    // Get comments with pagination
    console.log('   Getting comments with pagination...');
    const paginatedComments = await client.getCommentsWithPagination({
      _page: 1,
      _limit: 10
    });
    console.log(`   ✅ Retrieved ${paginatedComments.data.length} comments`);
    
    // Search comments by post
    console.log('   Finding comments for post #1...');
    const postComments = await client.getCommentsByPost(1);
    console.log(`   ✅ Found ${postComments.length} comments for post #1`);
    
    // Search comments by email pattern
    console.log('   Searching comments by email pattern...');
    const emailComments = await client.searchComments({
      email: '@hildegard.org'
    });
    console.log(`   ✅ Found ${emailComments.length} comments from @hildegard.org`);

    // Demo 4: User Filtering
    console.log('\n👥 Demo 4: User Filtering');
    
    // Get users with pagination
    console.log('   Getting users with pagination...');
    const paginatedUsers = await client.getUsersWithPagination({
      _page: 1,
      _limit: 5
    });
    console.log(`   ✅ Page ${paginatedUsers.pagination.page}: ${paginatedUsers.data.length} users`);
    
    // Search users by name
    console.log('   Searching users by name pattern...');
    const nameSearch = await client.searchUsers({
      name: 'Leanne'
    });
    console.log(`   ✅ Found ${nameSearch.length} users with "Leanne" in name`);
    nameSearch.forEach(user => {
      console.log(`      - ${user.name} (${user.username})`);
    });
    
    // Search users by email domain
    console.log('   Searching users by email domain...');
    const domainSearch = await client.searchUsers({
      email: '.biz'
    });
    console.log(`   ✅ Found ${domainSearch.length} users with .biz email`);

    // Demo 5: Range and Sorting
    console.log('\n📊 Demo 5: Range Queries and Sorting');
    
    // Get posts in a specific range
    console.log('   Getting posts 5-10...');
    const rangeResults = await client.getPostsWithPagination({
      _start: 4, // 0-based
      _end: 9
    });
    console.log(`   ✅ Retrieved posts ${rangeResults.data[0]?.id} to ${rangeResults.data[rangeResults.data.length-1]?.id}`);
    
    // Sort by different fields
    console.log('   Getting posts sorted by title (desc)...');
    const sortedPosts = await client.searchPosts({
      _sort: 'title',
      _order: 'desc',
      _limit: 5
    });
    console.log(`   ✅ First post title: "${sortedPosts[0]?.title}"`);

    // Demo 6: Performance with Filtering
    console.log('\n⚡ Demo 6: Filter Performance');
    
    console.log('   Measuring search performance...');
    const searchStart = performance.now();
    
    // Perform multiple searches
    await Promise.all([
      client.searchPosts({ userId: 1 }),
      client.searchPosts({ userId: 2 }),
      client.searchUsers({ name: 'C' }),
      client.searchComments({ postId: 1 })
    ]);
    
    const searchTime = performance.now() - searchStart;
    console.log(`   ⏱️  Completed 4 concurrent searches in ${searchTime.toFixed(2)}ms`);

    // Demo 7: Real-world Search Scenario
    console.log('\n🌍 Demo 7: Real-world Search Scenario');
    console.log('   Scenario: Find all content for user "Bret"...');
    
    // Find user by username
    const bretUsers = await client.searchUsers({ username: 'Bret' });
    if (bretUsers.length > 0) {
      const bret = bretUsers[0];
      console.log(`   👤 Found user: ${bret.name} (ID: ${bret.id})`);
      
      // Get their posts
      const bretPosts = await client.getPostsByUser(bret.id);
      console.log(`   📝 User has ${bretPosts.length} posts`);
      
      // Get comments on their first post
      if (bretPosts.length > 0) {
        const firstPostComments = await client.getCommentsByPost(bretPosts[0].id);
        console.log(`   💬 First post has ${firstPostComments.length} comments`);
        
        console.log(`   📊 Summary for ${bret.name}:`);
        console.log(`      - ${bretPosts.length} posts written`);
        console.log(`      - ${firstPostComments.length} comments on first post`);
        console.log(`      - Email: ${bret.email}`);
        console.log(`      - Website: ${bret.website}`);
      }
    }

    console.log('\n✨ Search and filtering example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  searchAndFilteringExample();
}

module.exports = { searchAndFilteringExample };
