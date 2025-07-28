<div align="center">

# 🚀 JSONPlaceholder API Client Library

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Bundle Size](https://img.shields.io/badge/Bundle%20Size-1.1KB--2.4KB-brightgreen?style=for-the-badge)](./BUNDLE_OPTIMIZATION.md)
[![Tests](https://img.shields.io/badge/Tests-91%20Passing-success?style=for-the-badge)](./src/__tests__)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-blue?style=for-the-badge)](#installation)

**A modern, production-ready TypeScript library for the JSONPlaceholder API**  
*Features intelligent caching, modular imports, React hooks, and enterprise-grade logging*

[🚀 Quick Start](#-quick-start) • [📚 Documentation](#-documentation) • [⚛️ React Hooks](#️-react-hooks) • [🎯 Examples](#-examples)

</div>

---

## ✨ Key Features

<table>
<tr>
<td>

### 🎯 **Developer Experience**
- 📦 **Modular Imports** - Tree-shakeable (1.1KB - 2.4KB)
- 🔒 **Type Safety** - Full TypeScript support
- 📖 **Intuitive API** - Easy to learn and use
- 🧪 **Well Tested** - 91 comprehensive test cases

</td>
<td>

### ⚡ **Performance**
- 🚀 **Intelligent Caching** - Memory/localStorage/sessionStorage
- 🔄 **Background Refresh** - Stale-while-revalidate strategy  
- 📊 **Request Deduplication** - Prevent duplicate API calls
- ⏱️ **TTL Management** - Automatic cache invalidation

</td>
</tr>
<tr>
<td>

### 🛠️ **Enterprise Features**
- 📝 **Production Logging** - Configurable levels (silent → debug)
- 🔌 **Interceptors** - Request/response middleware
- 🔄 **Auto Retry** - Exponential backoff
- 🎯 **Error Handling** - Custom error classes

</td>
<td>

### ⚛️ **React Integration**
- 🪝 **Modern Hooks** - useQuery, useMutation patterns
- 💾 **Smart Caching** - Automatic background updates  
- 🔄 **Optimistic Updates** - Instant UI feedback
- ⏸️ **Suspense Support** - Loading states handled

</td>
</tr>
</table>

---

## 📦 Installation

### Core Library

```bash
# Choose your bundle size based on features needed
npm install jsonplaceholder-client-lib
```

**Bundle Size Options:**
- 🪶 **Core only**: 1.1KB (client + types)
- 💾 **With caching**: 1.6KB (+ intelligent caching)  
- 📝 **With logging**: 1.3KB (+ production logging)
- 🎯 **Full featured**: 2.4KB (everything included)

### React Hooks Package

```bash
npm install @jsonplaceholder-client-lib/react
```

---

## 🚀 Quick Start

### 1️⃣ **Simple Usage** (1.1KB)

```typescript
// Minimal import - only what you need
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/core';

const client = new JsonPlaceholderClient();

// Get all posts
const posts = await client.getPosts();

// Get specific post
const post = await client.getPost(1);

// Create new post  
const newPost = await client.createPost({
  title: 'My Amazing Post',
  body: 'This is the content of my post',
  userId: 1
});
```

### 2️⃣ **With Intelligent Caching** (1.6KB)

```typescript
// Add smart caching for better performance
import { 
  JsonPlaceholderClient, 
  CacheManager, 
  MemoryCacheStorage 
} from 'jsonplaceholder-client-lib/caching';

const client = new JsonPlaceholderClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  cacheManager: new CacheManager({
    storage: new MemoryCacheStorage(100),
    defaultTTL: 300000, // 5 minutes
    backgroundRefresh: true
  })
});

// First call hits API
const posts1 = await client.getPosts(); 

// Second call served from cache (instant!)
const posts2 = await client.getPosts();
```

### 3️⃣ **Production Ready** (2.4KB)

```typescript
// Full featured for production applications
import { 
  JsonPlaceholderClient,
  CacheManager,
  MemoryCacheStorage,
  createLogger
} from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient({
  baseURL: 'https://jsonplaceholder.typicode.com',
  cacheManager: new CacheManager({
    storage: new MemoryCacheStorage(100),
    defaultTTL: 300000,
    backgroundRefresh: true
  }),
  loggerConfig: {
    level: 'info',  // 'silent' | 'error' | 'warn' | 'info' | 'debug'
    enableColors: true
  }
});

// Rich logging and caching automatically handled
const posts = await client.getPosts();
```

---

## ⚛️ React Hooks

### Setup Provider

```tsx
import { JsonPlaceholderProvider } from '@jsonplaceholder-client-lib/react';
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

function App() {
  return (
    <JsonPlaceholderProvider client={client}>
      <PostsList />
    </JsonPlaceholderProvider>
  );
}
```

### Modern Hook Patterns

```tsx
import { usePosts, useCreatePost, useUpdatePost } from '@jsonplaceholder-client-lib/react';

function PostsList() {
  // Automatic caching, background updates, error handling
  const { data: posts, isLoading, error, refetch } = usePosts();
  
  // Optimistic updates, automatic cache invalidation
  const createPost = useCreatePost({
    onSuccess: () => {
      refetch(); // Refresh posts list
    }
  });

  const updatePost = useUpdatePost();

  if (isLoading) return <div className="spinner">Loading...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <div className="posts-container">
      <h1>Posts ({posts?.length})</h1>
      
      {posts?.map(post => (
        <article key={post.id} className="post-card">
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <button
            onClick={() => updatePost.mutate({
              id: post.id,
              title: `Updated: ${post.title}`
            })}
            disabled={updatePost.isLoading}
          >
            {updatePost.isLoading ? 'Updating...' : 'Update'}
          </button>
        </article>
      ))}
      
      <button
        onClick={() => createPost.mutate({
          title: 'New Post',
          body: 'Post content here...',
          userId: 1
        })}
        disabled={createPost.isLoading}
        className="create-btn"
      >
        {createPost.isLoading ? 'Creating...' : '+ Create Post'}
      </button>
    </div>
  );
}
```

---

## 🎯 Advanced Features

### 🔍 **Smart Filtering & Pagination**

```typescript
// Paginated results with metadata
const paginatedPosts = await client.getPostsWithPagination({
  _page: 1,
  _limit: 10
});

console.log(`Page: ${paginatedPosts.pagination.page}`);
console.log(`Total: ${paginatedPosts.pagination.total}`);
console.log(`Has next: ${paginatedPosts.pagination.hasNext}`);

// Advanced search with multiple filters
const searchResults = await client.searchPosts({
  userId: 1,
  _sort: 'title',
  _order: 'desc',
  _page: 1,
  _limit: 5,
  q: 'important topic' // Full-text search
});

// Search users, comments, posts
const usersByName = await client.searchUsers({ name: 'John Doe' });
const postComments = await client.searchComments({ postId: 1 });
```

### 💾 **Intelligent Caching System**

```typescript
// Cache configuration with multiple storage options
const client = new JsonPlaceholderClient({
  cacheManager: new CacheManager({
    storage: new MemoryCacheStorage(100),     // Fast in-memory
    // storage: new LocalStorageCacheStorage(), // Persistent across sessions  
    // storage: new SessionStorageCacheStorage(), // Session-based
    defaultTTL: 300000, // 5 minutes
    backgroundRefresh: true,
    refreshThreshold: 0.8 // Refresh at 80% of TTL
  })
});

// Per-request cache options
const posts = await client.getPosts({ 
  forceRefresh: true,           // Bypass cache
  ttl: 30000,                  // Custom TTL (30 seconds)
  staleWhileRevalidate: true   // Return cache, fetch in background
});

// Cache management
const stats = client.getCacheStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
await client.clearCache();
```

### 📝 **Production-Grade Logging**

```typescript
import { createLogger } from 'jsonplaceholder-client-lib/logging';

const client = new JsonPlaceholderClient({
  loggerConfig: {
    level: 'info',        // 'silent' | 'error' | 'warn' | 'info' | 'debug'
    enableColors: true,   // ANSI colors for terminal
    enableTimestamp: true // Timestamp each log
  }
});

// Logs are silent by default in production
// Perfect for libraries - no console pollution!
```

### 🔌 **Request/Response Interceptors**

```typescript
// Authentication interceptor
client.addRequestInterceptor((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// Retry logic with exponential backoff
client.addResponseInterceptor(
  undefined,
  async (error) => {
    if (error.response?.status === 429) { // Rate limited
      await new Promise(resolve => setTimeout(resolve, 1000));
      return client.request(error.config); // Retry
    }
    throw error;
  }
);

// Request/response logging
client.addRequestInterceptor((config) => {
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

client.addResponseInterceptor((response) => {
  console.log(`✅ ${response.status} ${response.config.url}`);
  return response;
});
```

---

## 📚 Documentation

| Resource | Description |
|----------|-------------|
| 📖 **[API Reference](./docs/API_REFERENCE.md)** | Complete API documentation with examples |
| 📦 **[Bundle Optimization](./BUNDLE_OPTIMIZATION.md)** | Tree-shaking and modular import guide |
| ⚛️ **[React Hooks Guide](./packages/react/README.md)** | React hooks documentation |
| 🚀 **[Examples](./examples/README.md)** | Practical usage examples and tutorials |
| 📋 **[Publishing Guide](./docs/PUBLISHING.md)** | NPM publishing instructions |

---

## 🎯 Examples

### 🪝 **React Hook Patterns**

```tsx
// Advanced hook usage with optimistic updates
function EditablePost({ postId }: { postId: number }) {
  const { data: post, isLoading } = usePost(postId);
  const updatePost = useUpdatePost({
    onMutate: async (variables) => {
      // Optimistic update - instant UI feedback
      await queryClient.cancelQueries(['post', postId]);
      const previousPost = queryClient.getQueryData(['post', postId]);
      
      queryClient.setQueryData(['post', postId], {
        ...previousPost,
        ...variables
      });
      
      return { previousPost };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    }
  });

  if (isLoading) return <PostSkeleton />;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      updatePost.mutate({
        id: postId,
        title: formData.get('title'),
        body: formData.get('body')
      });
    }}>
      <input name="title" defaultValue={post?.title} />
      <textarea name="body" defaultValue={post?.body} />
      <button type="submit" disabled={updatePost.isLoading}>
        {updatePost.isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### 🔄 **Background Data Fetching**

```typescript
// Prefetch data for better UX
async function optimizedDataFlow() {
  const client = new JsonPlaceholderClient();
  
  // Prefetch commonly needed data
  await Promise.all([
    client.prefetchPosts(),
    client.prefetchUsers(),
    client.prefetchComments(1)
  ]);
  
  // These calls will be served from cache (instant!)
  const posts = await client.getPosts();
  const users = await client.getUsers();
  const comments = await client.getComments(1);
  
  console.log('All data loaded instantly from cache! 🚀');
}
```

### 🏭 **Enterprise Production Setup**

```typescript
// Production-ready configuration
function createProductionClient() {
  const client = new JsonPlaceholderClient({
    baseURL: process.env.API_BASE_URL,
    cacheManager: new CacheManager({
      storage: new LocalStorageCacheStorage(), // Persistent cache
      defaultTTL: 10 * 60 * 1000, // 10 minutes
      maxSize: 500,
      backgroundRefresh: true
    }),
    loggerConfig: {
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'silent',
      enableColors: process.env.NODE_ENV === 'development'
    }
  });

  // Authentication
  client.addRequestInterceptor((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Global error handling
  client.addResponseInterceptor(
    undefined,
    (error) => {
      if (error.response?.status === 401) {
        // Handle auth errors
        window.location.href = '/login';
      } else if (error.response?.status >= 500) {
        // Handle server errors
        showErrorToast('Server error. Please try again later.');
      }
      throw error;
    }
  );

  // Retry logic for failed requests
  client.addResponseInterceptor(
    undefined,
    async (error) => {
      const config = error.config;
      if (!config._retry && error.response?.status >= 500) {
        config._retry = true;
        await new Promise(resolve => setTimeout(resolve, 1000));
        return client.request(config);
      }
      throw error;
    }
  );

  return client;
}
```

---

## 📊 Performance & Bundle Analysis

### 📦 **Bundle Size Comparison**

| Import Strategy | Bundle Size | Features | Use Case |
|----------------|-------------|----------|----------|
| `library/core` | **1.1KB** | Client + Types | Simple API calls |
| `library/caching` | **1.6KB** | Core + Caching | Performance-focused apps |
| `library/logging` | **1.3KB** | Core + Logging | Development/debugging |
| `library` (full) | **2.4KB** | All Features | Full-featured applications |

### ⚡ **Performance Benefits**

- **99.6% smaller** bundles for minimal use cases
- **Zero console pollution** in production (silent by default)
- **Intelligent caching** prevents duplicate API calls
- **Background refresh** keeps data fresh automatically
- **Request deduplication** for concurrent identical requests
- **Tree-shakeable** - only bundle what you use

---

## 🧪 Testing & Quality

### ✅ **Test Coverage**

- **91 comprehensive test cases** covering all functionality
- **Unit tests** for core client functionality  
- **Integration tests** for caching and interceptors
- **Error handling tests** for edge cases
- **React hooks tests** with React Testing Library
- **Performance tests** for caching efficiency

### 🔧 **Development**

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Build library
npm run build

# Lint code
npm run lint
```

---

## 📁 Project Structure

```text
jsonplaceholder-client-lib/
├── 📦 src/                    # Core library source
│   ├── client.ts              # Main client class
│   ├── cache.ts               # Caching system
│   ├── logger.ts              # Logging system
│   ├── types.ts               # TypeScript definitions
│   ├── core.ts                # Minimal entry point (1.1KB)
│   ├── caching.ts             # Caching entry point (1.6KB)  
│   ├── logging.ts             # Logging entry point (1.3KB)
│   └── index.ts               # Full library (2.4KB)
├── ⚛️ packages/react/         # React hooks package
│   ├── src/hooks.ts           # Custom hooks
│   ├── src/context.tsx        # React context
│   └── src/api-hooks.ts       # API-specific hooks
├── 🧪 tests/                  # Test files and demos
├── 📚 docs/                   # Documentation
├── 🏗️ dist/                   # Built files
└── 📖 README.md               # This file
```

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 🎯 **Development Setup**

```bash
# Clone the repo
git clone https://github.com/your-username/jsonplaceholder-client-lib.git

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run build:watch
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by developers, for developers**

⭐ **Star this repo** if you find it helpful! ⭐

[🚀 Get Started](#-quick-start) • [📚 Documentation](#-documentation) • [🐛 Report Bug](https://github.com/your-username/jsonplaceholder-client-lib/issues) • [💡 Request Feature](https://github.com/your-username/jsonplaceholder-client-lib/issues)

</div>
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

### Cache Resilience & Error Handling

The caching system is designed to be resilient and never interfere with your application:

```typescript
// Cache failures are handled gracefully
// If cache storage fails, data is still returned from the API
const posts = await client.getPosts(); // Always works, even if cache fails

// Storage errors are logged but don't break functionality
client.addCacheEventListener((event) => {
  if (event.metadata?.error) {
    console.warn('Cache operation failed:', event.metadata.error);
    // Application continues to work normally
  }
});

// Cache is automatically disabled if storage is unavailable
// Your app continues to work without caching
```

### Cache Performance Benefits

Real-world performance improvements with caching enabled:

```typescript
// First request - from API (~100-500ms)
console.time('first-request');
await client.getPosts();
console.timeEnd('first-request'); // ~200ms

// Second request - from cache (~1-5ms)  
console.time('cached-request');
await client.getPosts(); 
console.timeEnd('cached-request'); // ~2ms (100x faster!)

// Concurrent requests - only 1 API call
const promises = Array(10).fill(null).map(() => client.getPosts());
const results = await Promise.all(promises); // Only 1 network request made
```

## Request/Response Interceptors

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

## 📁 Project Structure

```text
jsonplaceholder-client-lib/
├── src/                    # Core library source code
├── packages/               # Package workspace
│   └── react/             # React hooks package
├── tests/                 # Test files and demos
│   ├── integration/       # Integration tests
│   └── demos/            # Demo applications
├── docs/                  # Documentation files
├── scripts/              # Build and utility scripts
├── dist/                 # Built library files
└── README.md             # Main documentation
```

### Key Directories

- **`src/`** - Core TypeScript library source code
- **`packages/react/`** - React hooks package with its own build system
- **`tests/integration/`** - Package validation and integration tests
- **`tests/demos/`** - HTML demos and example applications
- **`docs/`** - Additional documentation and guides

## License

This project is licensed under the MIT License.
