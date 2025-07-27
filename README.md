# JSONPlaceholder API Client Library

A TypeScript library that provides a simple, type-safe interface for interacting with the JSONPlaceholder API. Features comprehensive CRUD operations, advanced filtering & pagination, robust error handling, and full TypeScript support.

## Features

- ✅ **Full CRUD Operations**: Create, read, update, and delete posts
- ✅ **Advanced Filtering & Pagination**: Search and paginate through resources
- ✅ **Request/Response Interceptors**: Middleware system for authentication, logging, retries
- ✅ **Type Safety**: Written in TypeScript with comprehensive type definitions
- ✅ **Error Handling**: Custom error classes for different API scenarios
- ✅ **Easy to Use**: Simple, intuitive API
- ✅ **Well Tested**: Comprehensive test suite with 53+ test cases
- ✅ **Zero Dependencies**: Only requires axios for HTTP requests

## Installation

```bash
npm install jsonplaceholder-client-lib
```

## Quick Start

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

// Get all posts
const posts = await client.getPosts();

// Get a specific post
const post = await client.getPost(1);

// Create a new post
const newPost = await client.createPost({
  title: 'My New Post',
  body: 'This is the content of my post',
  userId: 1
});
```

## Advanced Filtering & Pagination

The library supports advanced filtering, searching, and pagination:

```typescript
// Get posts with pagination
const paginatedPosts = await client.getPostsWithPagination({
  _page: 1,
  _limit: 10
});

console.log(`Page: ${paginatedPosts.pagination.page}`);
console.log(`Total: ${paginatedPosts.pagination.total}`);
console.log(`Has next: ${paginatedPosts.pagination.hasNext}`);

// Search posts by user ID
const userPosts = await client.searchPosts({ userId: 1 });

// Search with sorting
const sortedPosts = await client.searchPosts({
  _sort: 'title',
  _order: 'desc'
});

// Full-text search
const searchResults = await client.searchPosts({
  q: 'important topic'
});

// Complex search with multiple filters
const complexSearch = await client.searchPosts({
  userId: 1,
  _sort: 'id',
  _order: 'asc',
  _page: 1,
  _limit: 5
});

// Search comments by post ID
const postComments = await client.searchComments({ postId: 1 });

// Search users by name
const usersByName = await client.searchUsers({ name: 'John Doe' });

// Get users with pagination
const paginatedUsers = await client.getUsersWithPagination({
  _page: 1,
  _limit: 3
});
```

## Caching & Performance System

The library includes a powerful caching and performance optimization system with multiple storage options, intelligent cache invalidation, and background refresh capabilities.

### Cache Configuration

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

// Initialize with caching enabled
const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // Maximum number of cached entries
  storage: 'memory', // 'memory' | 'localStorage' | 'sessionStorage'
  backgroundRefresh: true,
  refreshThreshold: 0.8, // Refresh when 80% of TTL has passed
  keyPrefix: 'jsonph_cache_'
});
```

### Storage Options

#### Memory Storage (Default)

- Fast in-memory caching
- Cleared when page reloads
- Best for short-term caching

#### localStorage Storage

- Persistent across browser sessions
- Survives page reloads and browser restarts
- Limited by browser storage quotas

#### sessionStorage Storage

- Persistent within browser session
- Cleared when tab is closed
- Good for session-based caching

```typescript
// Configure storage type
client.configureCaching({
  storage: 'localStorage', // Persist across sessions
  maxSize: 500,
  defaultTTL: 10 * 60 * 1000 // 10 minutes
});
```

### Cache Options per Request

```typescript
// Force refresh (bypass cache)
const freshPosts = await client.getPosts({ forceRefresh: true });

// Custom TTL for specific request
const posts = await client.getPosts({ ttl: 30 * 1000 }); // 30 seconds

// Stale-while-revalidate strategy
const posts = await client.getPosts({ 
  staleWhileRevalidate: true 
}); // Return cached data immediately, fetch fresh data in background

// Background refresh for specific request
const posts = await client.getPosts({ 
  backgroundRefresh: true 
});
```

### Prefetching

Improve performance by prefetching data before it's needed:

```typescript
// Prefetch posts
await client.prefetchPosts();

// Prefetch user data
await client.prefetchUser(1);

// Prefetch comments for a post
await client.prefetchComments(1);

// Use prefetched data (will be served from cache)
const posts = await client.getPosts(); // Fast - served from cache
const user = await client.getUser(1); // Fast - served from cache
```

### Cache Management

```typescript
// Get cache statistics
const stats = client.getCacheStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Cache size: ${stats.entryCount}/${stats.maxSize}`);
console.log(`Total requests: ${stats.totalRequests}`);

// Clear entire cache
await client.clearCache();

// Delete specific cache entry
const cacheKey = 'GET|/posts|';
await client.deleteCacheEntry(cacheKey);

// Enable/disable caching
client.enableCache(false); // Disable caching
client.enableCache(true);  // Re-enable caching
```

### Cache Events

Monitor cache operations with event listeners:

```typescript
client.addCacheEventListener((event) => {
  switch (event.type) {
    case 'hit':
      console.log(`Cache hit for ${event.key}`);
      break;
    case 'miss':
      console.log(`Cache miss for ${event.key}`);
      break;
    case 'set':
      console.log(`Data cached for ${event.key}`);
      break;
    case 'evict':
      console.log(`Cache entry evicted: ${event.key}`);
      break;
    case 'refresh':
      console.log(`Background refresh for ${event.key}`);
      break;
  }
});
```

### Background Refresh

Automatically refresh cached data in the background to keep it fresh:

```typescript
// Configure background refresh
client.configureCaching({
  backgroundRefresh: true,
  refreshThreshold: 0.8 // Start refreshing when 80% of TTL has elapsed
});

// When you request data that's approaching expiry,
// the cached data is returned immediately while fresh data
// is fetched in the background for future requests
const posts = await client.getPosts(); // Returns cached data + triggers background refresh
```

### Performance Optimizations

#### Concurrent Request Deduplication

Multiple simultaneous requests for the same resource are automatically deduplicated:

```typescript
// These 5 concurrent requests will result in only 1 API call
const promises = Array(5).fill(null).map(() => client.getPosts());
const results = await Promise.all(promises); // All return the same data
```

#### Intelligent Cache Keys

Cache keys are automatically generated based on request parameters:

```typescript
// These will have different cache entries
await client.getPosts(); // Key: "GET|/posts|"
await client.getPostsWithPagination({ _page: 1 }); // Key: "GET|/posts|_page=1"
await client.getPostsWithPagination({ _page: 2 }); // Key: "GET|/posts|_page=2"
```

#### Cache Statistics and Monitoring

```typescript
const stats = client.getCacheStats();

console.log({
  hitRate: stats.hitRate, // Percentage of requests served from cache
  hits: stats.hits, // Number of cache hits
  misses: stats.misses, // Number of cache misses
  evictions: stats.evictions, // Number of entries evicted due to size limits
  backgroundRefreshes: stats.backgroundRefreshes, // Number of background refreshes
  totalRequests: stats.totalRequests, // Total cache requests
  currentSize: stats.currentSize, // Current cache size in bytes
  entryCount: stats.entryCount, // Number of cached entries
  averageResponseTime: stats.averageResponseTime // Average response time
});
```

### Production Examples

#### Production Configuration

```typescript
const client = new JsonPlaceholderClient('https://api.example.com', {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000,
  storage: 'localStorage', // Persist across sessions
  backgroundRefresh: true,
  refreshThreshold: 0.7, // Aggressive refresh at 70% of TTL
  keyPrefix: 'myapp_cache_'
});

// Monitor cache performance
client.addCacheEventListener((event) => {
  if (event.type === 'evict') {
    console.warn('Cache at capacity, consider increasing maxSize');
  }
  
  // Send metrics to monitoring service
  analytics.track('cache_event', {
    type: event.type,
    key: event.key,
    timestamp: event.timestamp
  });
});
```

#### Cache Warming Strategy

```typescript
async function warmCache() {
  // Prefetch critical data at application startup
  await Promise.all([
    client.prefetchPosts(),
    client.prefetchUsers(),
    client.prefetchUser(1), // Current user
    client.prefetchComments(1) // Popular post comments
  ]);
  
  console.log('Cache warmed with critical data');
}

// Call during app initialization
await warmCache();
```

#### Conditional Caching

```typescript
async function getPostsWithSmartCaching(userId?: number) {
  const options = {
    // Cache user-specific data for shorter time
    ttl: userId ? 2 * 60 * 1000 : 10 * 60 * 1000, // 2 min vs 10 min
    // Use background refresh for frequently accessed data
    backgroundRefresh: !userId // Only for general posts
  };
  
  return userId 
    ? await client.getPostsByUser(userId, {}, options)
    : await client.getPosts(options);
}
```

### Cache Invalidation Strategies

```typescript
// Manual invalidation after data modification
async function createPost(postData) {
  const newPost = await client.createPost(postData);
  
  // Invalidate related cache entries
  await client.deleteCacheEntry('GET|/posts|');
  await client.deleteCacheEntry(`GET|/users/${postData.userId}/posts|`);
  
  return newPost;
}

// Time-based invalidation with different TTLs
client.configureCaching({
  defaultTTL: 5 * 60 * 1000 // 5 minutes for most data
});

// Override TTL for specific data types
await client.getPosts({ ttl: 10 * 60 * 1000 }); // 10 minutes for posts
await client.getUsers({ ttl: 30 * 60 * 1000 }); // 30 minutes for users
```

The library provides a powerful middleware system for customizing requests and responses:

### Authentication Interceptors

```typescript
// Add Bearer token authentication
client.addAuthInterceptor('your-jwt-token', 'Bearer');

// Add API key authentication  
client.addAuthInterceptor('your-api-key', 'API-Key');

// Custom authentication
client.addRequestInterceptor((config) => {
  config.headers = config.headers || {};
  config.headers.Authorization = `Custom ${getToken()}`;
  return config;
});
```

### Logging Interceptors

```typescript
// Log all requests and responses
client.addLoggingInterceptor(true, true);

// Log only requests
client.addLoggingInterceptor(true, false);

// Custom logging
client.addRequestInterceptor((config) => {
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

client.addResponseInterceptor((response) => {
  console.log(`✅ ${response.status} ${response.config.url}`);
  return response;
});
```

### Retry Interceptors

```typescript
// Basic retry configuration
client.addRetryInterceptor({
  attempts: 3,
  delay: 1000
});

// Exponential backoff retry
client.addRetryInterceptor({
  attempts: 5,
  delay: 500,
  exponentialBackoff: true
});

// Custom retry logic
client.addResponseInterceptor(
  undefined,
  async (error) => {
    if (error.response?.status === 429) {
      console.log('Rate limited, retrying...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return client.client.request(error.config);
    }
    throw error;
  }
);
```

### Custom Interceptors

```typescript
// Request transformation
client.addRequestInterceptor((config) => {
  // Add timestamp to all requests
  config.headers = config.headers || {};
  config.headers['X-Request-Time'] = new Date().toISOString();
  
  // Transform request data
  if (config.data) {
    config.data = { ...config.data, version: '1.0' };
  }
  
  return config;
});

// Response transformation
client.addResponseInterceptor((response) => {
  // Add metadata to all responses
  response.data = {
    ...response.data,
    _meta: {
      requestTime: response.config.headers['X-Request-Time'],
      responseTime: new Date().toISOString()
    }
  };
  
  return response;
});

// Error handling
client.addResponseInterceptor(
  undefined,
  (error) => {
    // Transform API errors to custom format
    if (error.response?.status === 404) {
      error.userMessage = 'The requested resource was not found';
    }
    throw error;
  }
);
```

### Interceptor Management

```typescript
// Add interceptors and get their IDs for later removal
const authInterceptorId = client.addAuthInterceptor('token');
const retryInterceptorId = client.addRetryInterceptor({ attempts: 3 });

// Remove specific interceptors
client.removeRequestInterceptor(authInterceptorId);
client.removeResponseInterceptor(retryInterceptorId);

// Clear all interceptors
client.clearInterceptors();
```

### Advanced Usage Examples

```typescript
// Combine multiple interceptors for a production setup
const client = new JsonPlaceholderClient();

// 1. Authentication
client.addAuthInterceptor(process.env.API_TOKEN, 'Bearer');

// 2. Request ID tracking
client.addRequestInterceptor((config) => {
  config.headers = config.headers || {};
  config.headers['X-Request-ID'] = generateRequestId();
  return config;
});

// 3. Retry with exponential backoff
client.addRetryInterceptor({
  attempts: 3,
  delay: 1000,
  exponentialBackoff: true
});

// 4. Performance monitoring
client.addRequestInterceptor((config) => {
  config._startTime = Date.now();
  return config;
});

client.addResponseInterceptor((response) => {
  const duration = Date.now() - response.config._startTime;
  console.log(`Request to ${response.config.url} took ${duration}ms`);
  return response;
});

// 5. Error reporting
client.addResponseInterceptor(
  undefined,
  (error) => {
    // Send error to monitoring service
    errorReportingService.report(error);
    throw error;
  }
);
```

## Error Handling

The library provides comprehensive error handling with custom error classes:

```typescript
import { 
  JsonPlaceholderClient, 
  PostNotFoundError, 
  ValidationError, 
  ServerError, 
  RateLimitError 
} from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

try {
  const post = await client.getPost(999);
} catch (error) {
  if (error instanceof PostNotFoundError) {
    console.log(`Post ${error.postId} not found`);
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.validationErrors);
  } else if (error instanceof ServerError) {
    console.log('Server error occurred');
  } else if (error instanceof RateLimitError) {
    console.log('Rate limit exceeded');
  }
}
```

## API Reference

### Basic Operations

#### Posts

```typescript
// Get all posts
const posts = await client.getPosts();

// Get posts with pagination
const paginatedPosts = await client.getPostsWithPagination({
  _page: 1,
  _limit: 10
});

// Get a specific post
const post = await client.getPost(1);

// Create a new post
const newPost = await client.createPost({
  title: 'My Post Title',
  body: 'Post content here',
  userId: 1
});

// Update a post
const updatedPost = await client.updatePost(1, {
  title: 'Updated Title',
  body: 'Updated content',
  userId: 1
});

// Delete a post
await client.deletePost(1);
```

#### Comments

```typescript
// Get all comments
const comments = await client.getComments();

// Get comments with pagination
const paginatedComments = await client.getCommentsWithPagination({
  _page: 1,
  _limit: 5
});

// Get comments for a specific post
const postComments = await client.getCommentsByPost(1);
```

#### Users

```typescript
// Get all users
const users = await client.getUsers();

// Get users with pagination
const paginatedUsers = await client.getUsersWithPagination({
  _page: 1,
  _limit: 5
});

// Get a specific user
const user = await client.getUser(1);
```

### Search Methods

```typescript
// Search posts by user ID
const userPosts = await client.searchPosts({ userId: 1 });

// Get posts by specific user with pagination
const userPostsPaginated = await client.getPostsByUser(1, {
  _page: 1,
  _limit: 5
});

// Search comments by post ID
const postComments = await client.searchComments({ postId: 1 });

// Search users by name
const usersByName = await client.searchUsers({ name: 'John Doe' });
```

## TypeScript Support

The library is written in TypeScript and provides comprehensive type definitions:

```typescript
import { Post, Comment, User, PaginatedResponse } from 'jsonplaceholder-client-lib';

// All API methods are fully typed
const posts: Post[] = await client.getPosts();
const paginatedResult: PaginatedResponse<Comment> = await client.getCommentsWithPagination();
```

### Available Types

```typescript
interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  address: {
    street: string;
    suite: string;
    city: string;
    zipcode: string;
    geo: {
      lat: string;
      lng: string;
    };
  };
  phone: string;
  website: string;
  company: {
    name: string;
    catchPhrase: string;
    bs: string;
  };
}

// Filtering and search options
interface PostSearchOptions {
  userId?: number;
  title?: string;
  body?: string;
  q?: string; // Full-text search
  _sort?: string;
  _order?: 'asc' | 'desc';
  _page?: number;
  _limit?: number;
}

interface PaginationOptions {
  _page?: number;
  _limit?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Interceptor types
interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}

interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
type ResponseInterceptor = (response: ResponseData) => ResponseData | Promise<ResponseData>;
type ResponseErrorInterceptor = (error: any) => any | Promise<any>;

interface InterceptorOptions {
  retry?: {
    attempts: number;
    delay: number;
    exponentialBackoff?: boolean;
  };
  timeout?: number;
}
```

## Complete Examples

### CRUD Example

```typescript
import { JsonPlaceholderClient, PostNotFoundError } from 'jsonplaceholder-client-lib';

async function demonstrateCRUD() {
  const client = new JsonPlaceholderClient();
  
  try {
    // Create
    const newPost = await client.createPost({
      title: 'My Blog Post',
      body: 'This is a great post about APIs',
      userId: 1
    });
    console.log('Created post:', newPost);
    
    // Read
    const posts = await client.getPosts();
    console.log(`Found ${posts.length} posts`);
    
    // Update
    const updatedPost = await client.updatePost(newPost.id, {
      ...newPost,
      title: 'My Updated Blog Post'
    });
    console.log('Updated post:', updatedPost);
    
    // Delete
    await client.deletePost(newPost.id);
    console.log('Post deleted successfully');
    
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      console.error(`Post ${error.postId} not found`);
    } else {
      console.error('An error occurred:', error);
    }
  }
}
```

### Pagination Example

```typescript
async function paginateAllPosts() {
  const client = new JsonPlaceholderClient();
  let page = 1;
  const limit = 10;
  
  do {
    const result = await client.getPostsWithPagination({ 
      _page: page, 
      _limit: limit 
    });
    
    console.log(`Page ${page}: ${result.data.length} posts`);
    result.data.forEach(post => console.log(`- ${post.title}`));
    
    if (!result.pagination.hasNext) break;
    page++;
    
  } while (true);
}
```

### Interceptor Example

```typescript
async function productionSetup() {
  const client = new JsonPlaceholderClient();
  
  // Add authentication
  client.addAuthInterceptor(process.env.API_TOKEN, 'Bearer');
  
  // Add request/response logging
  client.addLoggingInterceptor(true, true);
  
  // Add retry logic
  client.addRetryInterceptor({
    attempts: 3,
    delay: 1000,
    exponentialBackoff: true
  });
  
  // Custom error handling
  client.addResponseInterceptor(
    undefined,
    (error) => {
      if (error.response?.status === 401) {
        // Handle authentication errors
        redirectToLogin();
      }
      throw error;
    }
  );
  
  return client;
}
```

## Testing

The library includes a comprehensive test suite with 53+ test cases covering:

- Basic CRUD operations
- Error handling scenarios  
- Filtering and pagination
- Request/Response interceptors
- Authentication and retry logic
- Query parameter encoding
- Edge cases and validation

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
