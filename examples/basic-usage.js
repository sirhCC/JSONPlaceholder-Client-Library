// Basic Usage Example
const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');

async function basicUsageExample() {
  // Create client with default configuration
  const client = new JsonPlaceholderClient();

  try {
    console.log('🚀 Basic API Calls\n');

    // Get all posts
    console.log('1. Fetching all posts...');
    const posts = await client.getPosts();
    console.log(`   ✅ Retrieved ${posts.length} posts`);

    // Get a specific post
    console.log('\n2. Fetching post #1...');
    const post = await client.getPost(1);
    console.log(`   ✅ Post: "${post.title}"`);

    // Get comments for the post
    console.log('\n3. Fetching comments for post #1...');
    const comments = await client.getComments(1);
    console.log(`   ✅ Retrieved ${comments.length} comments`);

    // Get user who created the post
    console.log('\n4. Fetching user info...');
    const user = await client.getUser(post.userId);
    console.log(`   ✅ User: ${user.name} (${user.email})`);

    console.log('\n✨ Basic usage example completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
if (require.main === module) {
  basicUsageExample();
}

module.exports = { basicUsageExample };
