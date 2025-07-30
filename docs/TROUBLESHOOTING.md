# 🔧 Troubleshooting Guide

This guide helps you resolve common issues when using the JSONPlaceholder Client Library.

## 📋 Quick Diagnostic Checklist

Before diving into specific issues, run through this quick checklist:

- [ ] Are you using Node.js v16.0.0 or higher?
- [ ] Is your library version up to date? (`npm list jsonplaceholder-client-lib`)
- [ ] Are you importing the library correctly?
- [ ] Do you have network connectivity to jsonplaceholder.typicode.com?
- [ ] Are there any console errors or warnings?

## 🚨 Common Issues & Solutions

### Installation & Setup Issues

#### Issue: `Module not found` or Import Errors

**Symptoms:**
```bash
Error: Cannot find module 'jsonplaceholder-client-lib'
Module '"jsonplaceholder-client-lib"' has no exported member 'JsonPlaceholderClient'
```

**Solutions:**

1. **Check Installation:**
   ```bash
   npm list jsonplaceholder-client-lib
   # If not installed:
   npm install jsonplaceholder-client-lib
   ```

2. **Verify Import Syntax:**
   ```typescript
   // ✅ Correct - Named import
   import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
   
   // ❌ Incorrect - Default import
   import JsonPlaceholderClient from 'jsonplaceholder-client-lib';
   
   // ✅ Correct - CommonJS
   const { JsonPlaceholderClient } = require('jsonplaceholder-client-lib');
   ```

3. **Check TypeScript Configuration:**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "moduleResolution": "node",
       "esModuleInterop": true,
       "allowSyntheticDefaultImports": true
     }
   }
   ```

#### Issue: React Hooks Not Working

**Symptoms:**
```bash
Module '"jsonplaceholder-client-lib"' has no exported member 'usePosts'
```

**Solutions:**

1. **Install React Package:**
   ```bash
   npm install @jsonplaceholder-client-lib/react
   ```

2. **Import from React Package:**
   ```typescript
   // ✅ Correct
   import { usePosts, JsonPlaceholderProvider } from '@jsonplaceholder-client-lib/react';
   
   // ❌ Incorrect
   import { usePosts } from 'jsonplaceholder-client-lib';
   ```

3. **Wrap App with Provider:**
   ```tsx
   import { JsonPlaceholderProvider } from '@jsonplaceholder-client-lib/react';
   
   function App() {
     return (
       <JsonPlaceholderProvider>
         <YourComponent />
       </JsonPlaceholderProvider>
     );
   }
   ```

### Runtime Issues

#### Issue: Network Requests Failing

**Symptoms:**
- API calls return errors
- Timeout errors
- CORS errors in browser

**Debugging Steps:**

1. **Test Network Connectivity:**
   ```bash
   curl https://jsonplaceholder.typicode.com/posts/1
   ```

2. **Check Client Configuration:**
   ```typescript
   const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
     logger: { level: 'debug' }, // Enable debug logging
     performance: { enabled: true }
   });
   
   // Test basic connectivity
   try {
     const post = await client.getPost(1);
     console.log('Connection successful:', post);
   } catch (error) {
     console.error('Connection failed:', error);
   }
   ```

3. **Common Network Issues:**

   **CORS in Browser:**
   ```typescript
   // If using in browser, ensure CORS is handled
   const client = new JsonPlaceholderClient();
   // JSONPlaceholder supports CORS, but your custom API might not
   ```

   **Timeout Issues:**
   ```typescript
   import axios from 'axios';
   
   const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
     // Custom axios config
   });
   
   // Access underlying axios instance if needed
   client['axiosInstance'].defaults.timeout = 10000; // 10 seconds
   ```

#### Issue: Caching Not Working

**Symptoms:**
- Same requests hitting the network repeatedly
- Cache stats showing 0% hit rate
- Data not persisting between page refreshes

**Solutions:**

1. **Verify Cache Configuration:**
   ```typescript
   const client = new JsonPlaceholderClient();
   
   // Enable caching explicitly
   client.enableCache({
     enabled: true,
     storage: 'localStorage', // or 'memory', 'sessionStorage'
     ttl: 300000, // 5 minutes
     refreshThreshold: 240000 // 4 minutes
   });
   
   // Check cache status
   console.log('Cache config:', client.getCacheConfig());
   console.log('Cache stats:', client.getCacheStats());
   ```

2. **Debug Cache Issues:**
   ```typescript
   // Listen to cache events
   client.addCacheEventListener('hit', (event) => {
     console.log('Cache hit:', event);
   });
   
   client.addCacheEventListener('miss', (event) => {
     console.log('Cache miss:', event);
   });
   
   client.addCacheEventListener('error', (event) => {
     console.error('Cache error:', event);
   });
   ```

3. **Storage Issues:**
   ```typescript
   // Test storage availability
   try {
     localStorage.setItem('test', 'test');
     localStorage.removeItem('test');
     console.log('localStorage available');
   } catch (error) {
     console.warn('localStorage not available, using memory cache');
   }
   ```

#### Issue: TypeScript Errors

**Symptoms:**
```bash
Property 'getPosts' does not exist on type 'JsonPlaceholderClient'
Type 'Post' is missing the following properties from type 'MyPost'
```

**Solutions:**

1. **Check Type Imports:**
   ```typescript
   import { JsonPlaceholderClient, Post, User, Comment } from 'jsonplaceholder-client-lib';
   
   const client = new JsonPlaceholderClient();
   const posts: Post[] = await client.getPosts();
   ```

2. **Custom Type Extensions:**
   ```typescript
   // If extending the default types
   interface ExtendedPost extends Post {
     customField: string;
   }
   
   const posts = await client.getPosts() as ExtendedPost[];
   ```

3. **Type Assertion for API Responses:**
   ```typescript
   // If the API returns additional fields
   interface CustomPost {
     id: number;
     title: string;
     body: string;
     userId: number;
     customField?: string;
   }
   
   const posts = await client.getPosts() as CustomPost[];
   ```

### Performance Issues

#### Issue: Slow API Responses

**Symptoms:**
- Requests taking longer than expected
- UI blocking during API calls
- Memory usage increasing over time

**Solutions:**

1. **Enable Performance Monitoring:**
   ```typescript
   const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
     performance: { enabled: true }
   });
   
   // Monitor performance
   client.addPerformanceEventListener('requestComplete', (metrics) => {
     console.log('Request metrics:', metrics);
   });
   
   // Get performance report
   console.log(client.getPerformanceReport());
   ```

2. **Optimize with Caching:**
   ```typescript
   // Enable aggressive caching for better performance
   client.enableCache({
     enabled: true,
     storage: 'localStorage',
     ttl: 900000, // 15 minutes
     refreshThreshold: 600000, // 10 minutes
     maxSize: 100 // Limit cache entries
   });
   ```

3. **Use Pagination for Large Datasets:**
   ```typescript
   // Instead of loading all posts at once
   const allPosts = await client.getPosts(); // Could be slow
   
   // Use pagination
   const firstPage = await client.getPostsWithPagination(1, 10);
   const secondPage = await client.getPostsWithPagination(2, 10);
   ```

4. **Prefetch Data:**
   ```typescript
   // Prefetch commonly used data
   await client.prefetchPosts();
   await client.prefetchUser(1);
   
   // Later requests will be served from cache
   const posts = await client.getPosts(); // Fast!
   ```

### React Hooks Issues

#### Issue: Hooks Not Updating

**Symptoms:**
- UI not re-rendering when data changes
- Stale data in components
- Infinite re-render loops

**Solutions:**

1. **Provider Setup:**
   ```tsx
   // Ensure provider is at app root
   import { JsonPlaceholderProvider } from '@jsonplaceholder-client-lib/react';
   
   function App() {
     return (
       <JsonPlaceholderProvider baseURL="https://jsonplaceholder.typicode.com">
         <MyComponent />
       </JsonPlaceholderProvider>
     );
   }
   ```

2. **Proper Hook Usage:**
   ```tsx
   function PostList() {
     // ✅ Correct
     const { data: posts, loading, error } = usePosts();
     
     // ❌ Incorrect - missing dependencies
     const [posts, setPosts] = useState([]);
     useEffect(() => {
       client.getPosts().then(setPosts);
     }, []); // Missing dependency
     
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
   ```

3. **Mutation Hook Issues:**
   ```tsx
   function CreatePost() {
     const { mutate: createPost, loading, error } = useCreatePost();
     
     const handleSubmit = async (postData) => {
       try {
         await createPost(postData);
         // Handle success
       } catch (error) {
         // Handle error
         console.error('Failed to create post:', error);
       }
     };
     
     return (
       <form onSubmit={handleSubmit}>
         {/* form fields */}
         <button disabled={loading}>
           {loading ? 'Creating...' : 'Create Post'}
         </button>
         {error && <div>Error: {error.message}</div>}
       </form>
     );
   }
   ```

## 🔍 Advanced Debugging

### Enable Debug Logging

```typescript
const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  logger: {
    level: 'debug', // 'silent' | 'error' | 'warn' | 'info' | 'debug'
  }
});

// You'll see detailed logs like:
// [JsonPlaceholderClient] [INFO] Making request to /posts
// [JsonPlaceholderClient] [DEBUG] Cache miss for key: posts
// [JsonPlaceholderClient] [INFO] Request completed in 234ms
```

### Inspect Network Requests

```typescript
// Add request/response interceptors for debugging
client.addRequestInterceptor((config) => {
  console.log('Outgoing request:', config);
  return config;
});

client.addResponseInterceptor(
  (response) => {
    console.log('Response received:', response);
    return response;
  },
  (error) => {
    console.error('Request failed:', error);
    return Promise.reject(error);
  }
);
```

### Monitor Cache Behavior

```typescript
// Comprehensive cache monitoring
const cacheStats = client.getCacheStats();
console.log('Cache Statistics:', {
  hitRate: `${cacheStats.hitRate}%`,
  totalRequests: cacheStats.totalRequests,
  cacheHits: cacheStats.cacheHits,
  cacheMisses: cacheStats.cacheMisses,
  cacheSize: cacheStats.cacheSize
});

// Export cache data for analysis
const cacheData = client.exportDebugData();
console.log('Cache entries:', cacheData.cache);
```

### Performance Analysis

```typescript
// Get detailed performance metrics
const perfReport = client.getPerformanceReport();
console.log('Performance Report:', {
  averageRequestTime: perfReport.averageRequestTime,
  totalRequests: perfReport.totalRequests,
  slowestRequest: perfReport.slowestRequest,
  fastestRequest: perfReport.fastestRequest
});

// Get performance insights and recommendations
const insights = client.getPerformanceInsights();
console.log('Performance Insights:', insights);
```

## 🆘 Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Search existing GitHub issues**
3. **Try the latest version**
4. **Create a minimal reproduction case**

### Creating a Bug Report

When reporting issues, include:

```markdown
## Environment
- Library version: 1.0.0
- Node.js version: 18.17.0
- Browser: Chrome 91.0.4472.124
- Operating System: Windows 10

## Code Sample
```typescript
// Minimal code that reproduces the issue
const client = new JsonPlaceholderClient();
const posts = await client.getPosts(); // This fails
```

## Expected vs Actual Behavior
Expected: Should return array of posts
Actual: Throws TypeError: Cannot read property 'data' of undefined

## Additional Context
- Using behind corporate firewall
- Only happens with specific endpoint
- Console errors: [paste errors here]
```

### Community Resources

- **GitHub Issues**: [https://github.com/sirhCC/client-library/issues](https://github.com/sirhCC/client-library/issues)
- **Discussions**: [https://github.com/sirhCC/client-library/discussions](https://github.com/sirhCC/client-library/discussions)
- **Documentation**: [./README.md](./README.md)
- **Examples**: [../examples/](../examples/)

### Emergency Workarounds

If you need immediate solutions while waiting for fixes:

```typescript
// Bypass caching temporarily
client.clearCache();
client.configureCaching({ enabled: false });

// Use direct axios for critical requests
import axios from 'axios';
const response = await axios.get('https://jsonplaceholder.typicode.com/posts');

// Increase timeout for slow networks
client['axiosInstance'].defaults.timeout = 30000;

// Disable error recovery if causing issues
const posts = await client.executeWithErrorRecovery(() => 
  client.getPosts(), 
  { retries: 0 }
);
```

---

**Still having issues?** Open a [GitHub issue](https://github.com/sirhCC/client-library/issues) with your specific problem and we'll help you out! 🚀
