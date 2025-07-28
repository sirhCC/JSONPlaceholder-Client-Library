# Examples Directory

This directory contains practical examples demonstrating different features and use cases of the JSONPlaceholder Client Library.

## Available Examples

### 1. [Basic Usage](./basic-usage.js)
Demonstrates the fundamental operations of the library:
- Creating a client instance
- Fetching posts, comments, and users
- Basic error handling

**Run:** `node examples/basic-usage.js`

### 2. [Advanced Caching](./advanced-caching.js)
Showcases the powerful caching system:
- Cache configuration and performance benefits
- Custom TTL for different data types
- Cache statistics and monitoring
- Concurrent request deduplication
- Cache events and prefetching

**Run:** `node examples/advanced-caching.js`

### 3. [Search and Filtering](./search-and-filtering.js)
Demonstrates search and filtering capabilities:
- Basic and advanced post filtering
- Pagination and sorting
- Full-text search
- Complex multi-parameter searches
- Real-world search scenarios

**Run:** `node examples/search-and-filtering.js`

### 4. [Interceptors and Error Handling](./interceptors-and-errors.js)
Shows interceptor usage and robust error handling:
- Request and response interceptors
- Authentication and logging interceptors
- Retry logic with exponential backoff
- Error handling strategies
- Performance monitoring

**Run:** `node examples/interceptors-and-errors.js`

## Running Examples

### Prerequisites
Make sure you have the library installed:

```bash
npm install jsonplaceholder-client-lib
```

### Running Individual Examples

```bash
# Basic usage
node examples/basic-usage.js

# Advanced caching
node examples/advanced-caching.js

# Search and filtering
node examples/search-and-filtering.js

# Interceptors and error handling
node examples/interceptors-and-errors.js
```

### Running All Examples

```bash
# Run all examples sequentially
node -e "
const examples = [
  './examples/basic-usage.js',
  './examples/advanced-caching.js', 
  './examples/search-and-filtering.js',
  './examples/interceptors-and-errors.js'
];

async function runAll() {
  for (const example of examples) {
    console.log('\\n' + '='.repeat(60));
    console.log(\`Running \${example}\`);
    console.log('='.repeat(60));
    try {
      await import(example);
    } catch (error) {
      console.error(\`Error running \${example}:\`, error.message);
    }
  }
}

runAll();
"
```

## TypeScript Usage

All examples are written in JavaScript for simplicity, but the library is fully TypeScript compatible. Here's how to use them in TypeScript:

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
import type { Post, User, Comment, CacheConfig } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

// All methods are fully typed
const posts: Post[] = await client.getPosts();
const user: User = await client.getUser(1);
const comments: Comment[] = await client.getComments(1);
```

## Performance Tips

1. **Enable Caching**: Always enable caching for better performance
2. **Use Appropriate TTL**: Set longer TTL for data that changes less frequently
3. **Prefetch Data**: Use prefetching for better user experience
4. **Monitor Performance**: Use interceptors to track response times
5. **Handle Errors Gracefully**: Implement retry logic for transient failures

## Common Use Cases

### Blog Application
```javascript
// Get latest posts with their authors
const posts = await client.getPostsWithPagination({ _page: 1, _limit: 10 });
for (const post of posts.data) {
  const author = await client.getUser(post.userId);
  console.log(`${post.title} by ${author.name}`);
}
```

### User Dashboard
```javascript
// Get user's content summary
const user = await client.getUser(1);
const userPosts = await client.getPostsByUser(1);
const totalComments = (await Promise.all(
  userPosts.map(post => client.getComments(post.id))
)).reduce((sum, comments) => sum + comments.length, 0);

console.log(`${user.name} has ${userPosts.length} posts with ${totalComments} total comments`);
```

### Search Interface
```javascript
// Implement search with debouncing
let searchTimeout;
function searchPosts(query) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(async () => {
    const results = await client.searchPosts({ q: query, _limit: 10 });
    displayResults(results);
  }, 300); // 300ms debounce
}
```

## Contributing

When adding new examples:

1. Follow the existing naming convention
2. Include comprehensive error handling
3. Add clear console output with emojis for better readability
4. Update this README with the new example
5. Include both basic and advanced usage patterns
