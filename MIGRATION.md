# 🚀 Migration Guide

This guide helps you migrate to the JSONPlaceholder Client Library from other solutions.

## Overview

The JSONPlaceholder Client Library provides a modern, type-safe interface for the JSONPlaceholder API with advanced features like caching, performance monitoring, and React hooks integration.

## Migration Scenarios

### From Direct Fetch/Axios Usage

If you're currently using raw `fetch` or `axios` calls:

#### Before (Raw Fetch)

```typescript
// Old approach - manual fetch calls
async function getPosts() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const posts = await response.json();
    return posts;
  } catch (error) {
    console.error('Failed to fetch posts:', error);
    throw error;
  }
}

async function getPost(id: number) {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  return response.json();
}

async function createPost(post: any) {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(post),
  });
  return response.json();
}
```

#### After (JSONPlaceholder Client)

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

// Initialize once
const client = new JsonPlaceholderClient();

// Simple, type-safe calls
async function getPosts() {
  return await client.getPosts(); // Automatic error handling, caching, types
}

async function getPost(id: number) {
  return await client.getPost(id);
}

async function createPost(post: CreatePostData) {
  return await client.createPost(post);
}
```

**Migration Benefits:**
- ✅ Automatic error handling with custom error types
- ✅ Built-in TypeScript support
- ✅ Intelligent caching (optional)
- ✅ Request/response interceptors
- ✅ Performance monitoring
- ✅ Retry logic with exponential backoff

### From Axios with Custom Configuration

If you have existing axios setup:

#### Before (Custom Axios)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptors
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Manual caching logic
const cache = new Map();
async function getCachedPosts() {
  const cacheKey = 'posts';
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (Date.now() - timestamp < 300000) { // 5 minutes
      return data;
    }
  }
  
  const response = await apiClient.get('/posts');
  cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  return response.data;
}
```

#### After (JSONPlaceholder Client)

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  // Built-in caching with multiple storage options
  cache: {
    enabled: true,
    storage: 'localStorage', // or 'memory', 'sessionStorage'
    ttl: 300000, // 5 minutes
    refreshThreshold: 240000 // Background refresh after 4 minutes
  },
  
  // Professional logging
  logger: {
    level: 'info' // 'silent', 'error', 'warn', 'info', 'debug'
  },
  
  // Performance monitoring
  performance: {
    enabled: true
  }
});

// Add custom interceptors if needed
client.addRequestInterceptor((config) => {
  console.log('Request:', config);
  return config;
});

client.addResponseInterceptor(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Caching is automatic now
async function getPosts() {
  return await client.getPosts(); // Automatically cached
}
```

**Migration Benefits:**
- ✅ Replace manual cache logic with intelligent built-in caching
- ✅ Multiple cache storage options (memory, localStorage, sessionStorage)
- ✅ Background cache refresh (stale-while-revalidate)
- ✅ Built-in performance monitoring and analytics
- ✅ Professional logging with configurable levels

### From React Data Fetching Libraries

If you're using libraries like SWR, React Query, or custom hooks:

#### Before (SWR)

```tsx
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

function PostList() {
  const { data: posts, error, isLoading } = useSWR(
    'https://jsonplaceholder.typicode.com/posts',
    fetcher
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error!</div>;

  return (
    <ul>
      {posts?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

function PostDetail({ id }: { id: number }) {
  const { data: post } = useSWR(
    `https://jsonplaceholder.typicode.com/posts/${id}`,
    fetcher
  );

  return <div>{post?.title}</div>;
}
```

#### After (JSONPlaceholder React Hooks)

```tsx
import { 
  JsonPlaceholderProvider, 
  usePosts, 
  usePost 
} from '@jsonplaceholder-client-lib/react';

// Wrap your app
function App() {
  return (
    <JsonPlaceholderProvider>
      <PostList />
      <PostDetail id={1} />
    </JsonPlaceholderProvider>
  );
}

function PostList() {
  const { data: posts, loading, error } = usePosts();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

function PostDetail({ id }: { id: number }) {
  const { data: post } = usePost(id);

  return <div>{post?.title}</div>;
}
```

**Migration Benefits:**
- ✅ Built-in TypeScript support with proper types
- ✅ Automatic caching and background updates
- ✅ Error handling with custom error types
- ✅ Performance monitoring integration
- ✅ Consistent API across all endpoints
- ✅ Mutations with optimistic updates

### From Custom API Classes

If you have custom API service classes:

#### Before (Custom Service)

```typescript
class PostService {
  private baseURL = 'https://jsonplaceholder.typicode.com';
  
  async getPosts(): Promise<Post[]> {
    const response = await fetch(`${this.baseURL}/posts`);
    return response.json();
  }
  
  async getPost(id: number): Promise<Post> {
    const response = await fetch(`${this.baseURL}/posts/${id}`);
    return response.json();
  }
  
  async getPostsByUser(userId: number): Promise<Post[]> {
    const response = await fetch(`${this.baseURL}/posts?userId=${userId}`);
    return response.json();
  }
  
  async searchPosts(query: string): Promise<Post[]> {
    const posts = await this.getPosts();
    return posts.filter(post => 
      post.title.includes(query) || post.body.includes(query)
    );
  }
}

class UserService {
  // Similar pattern...
}

class CommentService {
  // Similar pattern...
}
```

#### After (Unified Client)

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

// Single client for all resources
const client = new JsonPlaceholderClient();

// All functionality in one place
const posts = await client.getPosts();
const post = await client.getPost(id);
const userPosts = await client.getPostsByUser(userId);
const searchResults = await client.searchPosts(query);

// Users and comments too
const users = await client.getUsers();
const comments = await client.getComments();

// Advanced features built-in
const paginatedPosts = await client.getPostsWithPagination(1, 10);
const cachedPosts = await client.getPosts(); // Automatically cached
```

**Migration Benefits:**
- ✅ Unified API for all JSONPlaceholder resources
- ✅ Built-in search, filtering, and pagination
- ✅ Automatic caching eliminates redundant requests
- ✅ Error handling with retry logic
- ✅ Performance monitoring and insights

## Step-by-Step Migration Process

### Step 1: Install the Library

```bash
# Core library
npm install jsonplaceholder-client-lib

# React hooks (if using React)
npm install @jsonplaceholder-client-lib/react
```

### Step 2: Replace API Calls Gradually

Start with the most frequently used endpoints:

```typescript
// Replace one endpoint at a time
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

// Old way
// const posts = await fetch('/posts').then(r => r.json());

// New way
const posts = await client.getPosts();
```

### Step 3: Enable Advanced Features

Once basic migration is complete, add advanced features:

```typescript
const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  cache: { 
    enabled: true,
    storage: 'localStorage',
    ttl: 300000 // 5 minutes
  },
  logger: { level: 'info' },
  performance: { enabled: true }
});

// Monitor performance
const report = client.getPerformanceReport();
console.log('API Performance:', report);
```

### Step 4: Add Error Handling

Replace generic error handling with specific error types:

```typescript
import { 
  JsonPlaceholderClient, 
  PostNotFoundError, 
  ValidationError,
  ServerError 
} from 'jsonplaceholder-client-lib';

try {
  const post = await client.getPost(999999);
} catch (error) {
  if (error instanceof PostNotFoundError) {
    // Handle missing post specifically
    console.log('Post not found');
  } else if (error instanceof ValidationError) {
    // Handle validation errors
    console.log('Invalid request:', error.details);
  } else if (error instanceof ServerError) {
    // Handle server errors
    console.log('Server error:', error.status);
  } else {
    // Handle other errors
    console.error('Unexpected error:', error);
  }
}
```

### Step 5: Migrate React Components

For React applications, migrate to hooks:

```tsx
// Before - useEffect with manual state management
function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/posts')
      .then(r => r.json())
      .then(setPosts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // render logic...
}

// After - simple hook
function PostList() {
  const { data: posts, loading, error } = usePosts();

  // render logic...
}
```

## Configuration Migration

### Environment Variables

If you're using environment variables:

```typescript
// Before
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://jsonplaceholder.typicode.com';

// After - same pattern works
const client = new JsonPlaceholderClient(
  process.env.REACT_APP_API_URL || 'https://jsonplaceholder.typicode.com'
);
```

### Custom Headers/Authentication

```typescript
// Migrate custom headers
const client = new JsonPlaceholderClient();

client.addRequestInterceptor((config) => {
  // Add authentication headers
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});
```

## Performance Optimization During Migration

### 1. Parallel Migration

Migrate endpoints in parallel while monitoring performance:

```typescript
// Before migration - measure current performance
console.time('oldAPI');
const oldData = await oldApiCall();
console.timeEnd('oldAPI');

// After migration - compare
console.time('newAPI');
const newData = await client.getPosts();
console.timeEnd('newAPI');

// Compare results
console.log('Performance improvement:', /* calculate difference */);
```

### 2. Cache Warming

Pre-populate cache for better user experience:

```typescript
// Warm cache during app initialization
await Promise.all([
  client.prefetchPosts(),
  client.prefetchUsers(),
  client.prefetchComments()
]);

// Later requests will be served from cache
const posts = await client.getPosts(); // Fast!
```

### 3. Gradual Feature Adoption

Start with basic features, add advanced features gradually:

```typescript
// Phase 1: Basic replacement
const client = new JsonPlaceholderClient();

// Phase 2: Add caching
client.enableCache({ enabled: true });

// Phase 3: Add monitoring
client.configurePerformanceMonitoring({ enabled: true });

// Phase 4: Add custom interceptors
client.addRequestInterceptor(/* custom logic */);
```

## Testing During Migration

### Unit Tests

Update your tests to use the new client:

```typescript
// Before
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// After
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

jest.mock('jsonplaceholder-client-lib');
const mockClient = new JsonPlaceholderClient() as jest.Mocked<JsonPlaceholderClient>;
```

### Integration Tests

Test the migration with integration tests:

```typescript
describe('API Migration', () => {
  it('should return same data as old implementation', async () => {
    const client = new JsonPlaceholderClient();
    const newData = await client.getPosts();
    
    // Compare with expected structure
    expect(newData).toHaveLength(100);
    expect(newData[0]).toHaveProperty('id');
    expect(newData[0]).toHaveProperty('title');
  });
});
```

## Common Migration Issues

### Issue: Different Response Structure

If the library returns data differently than expected:

```typescript
// If your old code expected response.data
const posts = await axios.get('/posts');
console.log(posts.data); // axios wraps in .data

// New library returns data directly
const posts = await client.getPosts();
console.log(posts); // direct data
```

### Issue: Missing Custom Configuration

If you need custom axios configuration:

```typescript
const client = new JsonPlaceholderClient();

// Access underlying axios instance for custom config
client['axiosInstance'].defaults.timeout = 10000;
client['axiosInstance'].defaults.headers['Custom-Header'] = 'value';
```

### Issue: Type Conflicts

If TypeScript types conflict:

```typescript
// Create type aliases for smooth migration
import { Post as LibraryPost } from 'jsonplaceholder-client-lib';

type Post = LibraryPost; // Use library types
// or extend if needed
interface ExtendedPost extends LibraryPost {
  customField: string;
}
```

## Rollback Plan

If you need to rollback:

1. **Keep old implementation** during migration period
2. **Use feature flags** to switch between implementations
3. **Monitor metrics** to compare performance
4. **Have rollback script** ready

```typescript
// Feature flag approach
const USE_NEW_CLIENT = process.env.USE_NEW_CLIENT === 'true';

const getPosts = USE_NEW_CLIENT 
  ? () => client.getPosts()
  : () => oldGetPosts();
```

## Post-Migration Checklist

- [ ] All API calls migrated and tested
- [ ] Performance monitoring enabled
- [ ] Caching configured appropriately
- [ ] Error handling updated
- [ ] Tests updated
- [ ] Documentation updated
- [ ] Team trained on new API
- [ ] Monitoring/alerting configured
- [ ] Old code removed

## Getting Help

Need help with migration?

- **Check examples**: [./examples/](./examples/)
- **Read troubleshooting**: [./TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Open GitHub issue**: Include your current implementation and migration goals
- **Use discussions**: For architecture and best practices questions

---

**Happy migrating! 🚀 The new client will significantly improve your development experience and application performance.**
