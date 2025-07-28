# API Reference

Complete reference for the JSONPlaceholder Client Library.

## Table of Contents

- [JsonPlaceholderClient](#jsonplaceholderclient)
- [Configuration](#configuration)
- [Caching System](#caching-system)
- [Request/Response Interceptors](#requestresponse-interceptors)
- [Error Handling](#error-handling)
- [TypeScript Types](#typescript-types)

## JsonPlaceholderClient

### Constructor

```typescript
new JsonPlaceholderClient(baseURL?: string, cacheConfig?: CacheConfig)
```

**Parameters:**
- `baseURL` (optional): Custom base URL for the API. Defaults to 'https://jsonplaceholder.typicode.com'
- `cacheConfig` (optional): Cache configuration object

**Example:**
```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

// Basic usage with defaults
const client = new JsonPlaceholderClient();

// With custom base URL and caching
const client = new JsonPlaceholderClient('https://api.example.com', {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storage: 'localStorage',
  maxSize: 100
});
```

## Configuration

### Cache Configuration

```typescript
interface CacheConfig {
  enabled?: boolean;
  defaultTTL?: number;
  storage?: 'memory' | 'localStorage' | 'sessionStorage';
  maxSize?: number;
  backgroundRefresh?: boolean;
  refreshThreshold?: number;
  enableCompression?: boolean;
}
```

#### Cache Options per Request

```typescript
interface CacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
  skipCache?: boolean;
  cacheKey?: string;
}

// Usage example
const posts = await client.getPosts(1, { 
  ttl: 10 * 60 * 1000, // 10 minutes
  forceRefresh: false 
});
```

## Posts API

### getPosts()

Retrieve all posts or posts with filters.

```typescript
getPosts(cacheOptions?: CacheOptions): Promise<Post[]>
```

**Example:**
```typescript
// Get all posts
const posts = await client.getPosts();

// With caching options
const posts = await client.getPosts({ 
  ttl: 5 * 60 * 1000, // Cache for 5 minutes
  forceRefresh: false 
});
```

### getPost()

Retrieve a specific post by ID.

```typescript
getPost(id: number, cacheOptions?: CacheOptions): Promise<Post>
```

**Example:**
```typescript
const post = await client.getPost(1);
```

### getPostsWithPagination()

Retrieve posts with pagination support.

```typescript
getPostsWithPagination(options?: PostSearchOptions): Promise<PaginatedResponse<Post>>
```

**Example:**
```typescript
const result = await client.getPostsWithPagination({
  _page: 1,
  _limit: 10,
  _sort: 'id',
  _order: 'desc'
});

console.log(`Page ${result.pagination.page} of ${result.pagination.totalPages}`);
console.log(`${result.data.length} posts`);
```

### searchPosts()

Search posts with filters and full-text search.

```typescript
searchPosts(options: PostSearchOptions): Promise<Post[]>
```

**Example:**
```typescript
// Search by user
const userPosts = await client.searchPosts({ userId: 1 });

// Full-text search
const searchResults = await client.searchPosts({ 
  q: 'javascript',
  _limit: 5 
});

// Complex search
const posts = await client.searchPosts({
  userId: 1,
  title: 'sunt',
  _sort: 'id',
  _order: 'asc',
  _page: 1,
  _limit: 10
});
```

### getPostsByUser()

Get all posts for a specific user.

```typescript
getPostsByUser(userId: number, options?: PostSearchOptions): Promise<Post[]>
```

**Example:**
```typescript
const userPosts = await client.getPostsByUser(1, {
  _sort: 'title',
  _order: 'asc'
});
```

### createPost()

Create a new post.

```typescript
createPost(post: Omit<Post, 'id'>): Promise<Post>
```

**Example:**
```typescript
const newPost = await client.createPost({
  userId: 1,
  title: 'My New Post',
  body: 'This is the content of my new post.'
});
```

### updatePost()

Update an existing post.

```typescript
updatePost(id: number, post: Partial<Post>): Promise<Post>
```

**Example:**
```typescript
const updatedPost = await client.updatePost(1, {
  title: 'Updated Title',
  body: 'Updated content'
});
```

### deletePost()

Delete a post.

```typescript
deletePost(id: number): Promise<void>
```

**Example:**
```typescript
await client.deletePost(1);
```

## Comments API

### getComments()

Get comments for a specific post.

```typescript
getComments(postId: number, cacheOptions?: CacheOptions): Promise<Comment[]>
```

**Example:**
```typescript
const comments = await client.getComments(1);
```

### getCommentsWithPagination()

Get comments with pagination.

```typescript
getCommentsWithPagination(options?: CommentSearchOptions): Promise<PaginatedResponse<Comment>>
```

**Example:**
```typescript
const result = await client.getCommentsWithPagination({
  _page: 1,
  _limit: 20
});
```

### searchComments()

Search comments with filters.

```typescript
searchComments(options: CommentSearchOptions): Promise<Comment[]>
```

**Example:**
```typescript
// Search by post
const postComments = await client.searchComments({ postId: 1 });

// Search by email domain
const gmailComments = await client.searchComments({ 
  email: '@gmail.com' 
});
```

### getCommentsByPost()

Get comments for a specific post with options.

```typescript
getCommentsByPost(postId: number, options?: CommentSearchOptions): Promise<Comment[]>
```

## Users API

### getUsers()

Get all users.

```typescript
getUsers(cacheOptions?: CacheOptions): Promise<User[]>
```

### getUser()

Get a specific user by ID.

```typescript
getUser(id: number, cacheOptions?: CacheOptions): Promise<User>
```

### getUsersWithPagination()

Get users with pagination.

```typescript
getUsersWithPagination(options?: UserSearchOptions): Promise<PaginatedResponse<User>>
```

### searchUsers()

Search users with filters.

```typescript
searchUsers(options: UserSearchOptions): Promise<User[]>
```

**Example:**
```typescript
// Search by name
const users = await client.searchUsers({ 
  name: 'Leanne' 
});

// Search by email domain
const users = await client.searchUsers({ 
  email: '@biz' 
});

// Search with pagination
const result = await client.searchUsers({
  username: 'Bret',
  _page: 1,
  _limit: 10
});
```

## Caching System

### Cache Management

```typescript
// Enable/disable cache
client.enableCache(true);

// Configure caching
client.configureCaching({
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxSize: 200,
  backgroundRefresh: true
});

// Get cache statistics
const stats = client.getCacheStats();
console.log(`Hit rate: ${stats.hitRate}%`);

// Clear cache
await client.clearCache();

// Delete specific cache entry
await client.deleteCacheEntry('posts');
```

### Cache Events

```typescript
// Listen for cache events
client.addCacheEventListener((event) => {
  console.log(`Cache ${event.type}: ${event.key}`);
});

// Remove listener
client.removeCacheEventListener(listener);
```

### Prefetching

```typescript
// Prefetch data for better performance
await client.prefetchPosts();
await client.prefetchUser(1);
await client.prefetchComments(1);
```

## Request/Response Interceptors

### Request Interceptors

```typescript
// Add authentication
const authInterceptor = client.addAuthInterceptor('Bearer your-token');

// Add custom headers
const requestInterceptor = client.addRequestInterceptor((config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
});

// Remove interceptor
client.removeRequestInterceptor(requestInterceptor);
```

### Response Interceptors

```typescript
// Add response logging
const responseInterceptor = client.addResponseInterceptor((response) => {
  console.log(`Response: ${response.status}`);
  return response;
});

// Add retry logic
const retryInterceptor = client.addRetryInterceptor({
  retries: 3,
  delay: 1000,
  backoff: 'exponential'
});
```

### Built-in Interceptors

```typescript
// Setup default interceptors (auth, logging, retry)
client.setupDefaultInterceptors();

// Add logging interceptor
client.addLoggingInterceptor();

// Clear all interceptors
client.clearInterceptors();
```

## Error Handling

### Custom Error Types

The library provides typed error handling:

```typescript
try {
  const post = await client.getPost(999);
} catch (error) {
  if (error.status === 404) {
    console.log('Post not found');
  } else if (error.status >= 500) {
    console.log('Server error:', error.message);
  }
}
```

### Error Context

Errors include contextual information:

```typescript
interface ApiError {
  status: number;
  error: string;
  message: string;
  context?: string; // e.g., 'post/1', 'comments'
}
```

## TypeScript Types

### Core Types

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
  address: Address;
  phone: string;
  website: string;
  company: Company;
}
```

### Search and Filter Types

```typescript
interface PostSearchOptions extends PostFilters, SearchOptions {
  userId?: number;
  title?: string;
  body?: string;
  id?: number;
}

interface SearchOptions extends PaginationOptions, SortOptions {
  q?: string; // Full-text search
}

interface PaginationOptions {
  _page?: number;
  _limit?: number;
  _start?: number;
  _end?: number;
}

interface SortOptions {
  _sort?: string;
  _order?: 'asc' | 'desc';
}
```

### Response Types

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}
```

## Advanced Usage Examples

### Complex Caching Strategy

```typescript
// Set up intelligent caching
const client = new JsonPlaceholderClient('', {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes default
  storage: 'localStorage',
  maxSize: 100,
  backgroundRefresh: true,
  refreshThreshold: 0.8 // Refresh when 80% of TTL elapsed
});

// Use different TTL for different data types
const posts = await client.getPosts({ ttl: 10 * 60 * 1000 }); // 10 min
const users = await client.getUsers({ ttl: 30 * 60 * 1000 }); // 30 min
const comments = await client.getComments(1, { ttl: 2 * 60 * 1000 }); // 2 min
```

### Performance Optimization

```typescript
// Prefetch data for better UX
await Promise.all([
  client.prefetchPosts(),
  client.prefetchUser(1),
  client.prefetchComments(1)
]);

// Concurrent request deduplication happens automatically
const promises = Array(5).fill(null).map(() => client.getPosts());
const results = await Promise.all(promises); // Only 1 API call made
```

### Error Handling with Retry

```typescript
// Setup retry logic
client.addRetryInterceptor({
  retries: 3,
  delay: 1000,
  backoff: 'exponential',
  retryCondition: (error) => error.status >= 500
});

try {
  const posts = await client.getPosts();
} catch (error) {
  console.error('Failed after retries:', error);
}
```

### Monitoring and Analytics

```typescript
// Monitor cache performance
client.addCacheEventListener((event) => {
  analytics.track('cache_event', {
    type: event.type,
    key: event.key,
    timestamp: event.timestamp
  });
});

// Regular performance reporting
setInterval(() => {
  const stats = client.getCacheStats();
  console.log('Cache Performance:', {
    hitRate: `${stats.hitRate}%`,
    totalRequests: stats.totalRequests,
    averageResponseTime: `${stats.averageResponseTime}ms`
  });
}, 60000); // Every minute
```
