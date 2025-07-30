# 🚨 Error Handling Guide

This guide covers comprehensive error handling strategies when using the JSONPlaceholder Client Library.

## Overview

The JSONPlaceholder Client Library provides a robust error handling system with custom error types, automatic retry logic, and recovery strategies to ensure your applications handle failures gracefully.

## Error Types

The library defines specific error types for different failure scenarios:

### Base Error Class

```typescript
import { ApiClientError } from 'jsonplaceholder-client-lib';

// Base class for all library errors
class ApiClientError extends Error {
  public readonly timestamp: Date;
  public readonly context?: any;
  
  constructor(message: string, context?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.timestamp = new Date();
    this.context = context;
  }
}
```

### Specific Error Types

#### 1. PostNotFoundError

```typescript
import { PostNotFoundError } from 'jsonplaceholder-client-lib';

try {
  const post = await client.getPost(999999);
} catch (error) {
  if (error instanceof PostNotFoundError) {
    console.log(`Post ${error.postId} not found`);
    // Handle missing post scenario
    return { id: 0, title: 'Post not found', body: '', userId: 0 };
  }
}
```

**Properties:**
- `postId: number` - The ID that was not found
- `message: string` - Error description
- `timestamp: Date` - When the error occurred

#### 2. ValidationError

```typescript
import { ValidationError } from 'jsonplaceholder-client-lib';

try {
  const newPost = await client.createPost({
    title: '', // Invalid: empty title
    body: 'Content',
    userId: 1
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation failed:', error.details);
    // error.details contains field-specific validation errors
    // { title: ['Title is required'], userId: ['Must be a positive number'] }
  }
}
```

**Properties:**
- `details: Record<string, string[]>` - Field-specific validation errors
- `field?: string` - Primary field that failed validation

#### 3. ServerError

```typescript
import { ServerError } from 'jsonplaceholder-client-lib';

try {
  const posts = await client.getPosts();
} catch (error) {
  if (error instanceof ServerError) {
    console.log(`Server error ${error.status}: ${error.message}`);
    
    if (error.status >= 500) {
      // Server-side error - retry might help
      console.log('Server issue, will retry later');
    } else if (error.status >= 400) {
      // Client-side error - fix request
      console.log('Client error, check request:', error.response);
    }
  }
}
```

**Properties:**
- `status: number` - HTTP status code
- `response?: any` - Server response data
- `headers?: Record<string, string>` - Response headers

#### 4. RateLimitError

```typescript
import { RateLimitError } from 'jsonplaceholder-client-lib';

try {
  const posts = await client.getPosts();
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`);
    
    // Wait and retry
    setTimeout(async () => {
      try {
        const posts = await client.getPosts();
        console.log('Retry successful');
      } catch (retryError) {
        console.log('Retry also failed');
      }
    }, error.retryAfter * 1000);
  }
}
```

**Properties:**
- `retryAfter: number` - Seconds to wait before retrying
- `limit: number` - Request limit per window
- `remaining: number` - Requests remaining in current window

#### 5. NetworkError

```typescript
import { NetworkError } from 'jsonplaceholder-client-lib';

try {
  const posts = await client.getPosts();
} catch (error) {
  if (error instanceof NetworkError) {
    if (error.isTimeout) {
      console.log('Request timed out');
    } else if (error.isOffline) {
      console.log('Network is offline');
    } else {
      console.log('Network error:', error.message);
    }
  }
}
```

**Properties:**
- `isTimeout: boolean` - Whether error was due to timeout
- `isOffline: boolean` - Whether network is offline
- `originalError: Error` - Original network error

## Error Handling Patterns

### 1. Basic Try-Catch

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

async function handleBasicErrors() {
  try {
    const posts = await client.getPosts();
    return posts;
  } catch (error) {
    console.error('Failed to fetch posts:', error.message);
    
    // Return fallback data
    return [];
  }
}
```

### 2. Specific Error Type Handling

```typescript
import { 
  JsonPlaceholderClient,
  PostNotFoundError,
  ValidationError,
  ServerError,
  NetworkError
} from 'jsonplaceholder-client-lib';

async function handleSpecificErrors(postId: number) {
  try {
    const post = await client.getPost(postId);
    return post;
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      // Specific handling for missing posts
      throw new Error(`Post ${postId} does not exist`);
    } else if (error instanceof NetworkError) {
      // Handle network issues
      if (error.isOffline) {
        throw new Error('You are offline. Please check your connection.');
      } else if (error.isTimeout) {
        throw new Error('Request timed out. Please try again.');
      }
    } else if (error instanceof ServerError) {
      // Handle server errors
      if (error.status >= 500) {
        throw new Error('Server is experiencing issues. Please try again later.');
      } else {
        throw new Error('Invalid request. Please check your parameters.');
      }
    } else {
      // Handle unexpected errors
      console.error('Unexpected error:', error);
      throw new Error('An unexpected error occurred');
    }
  }
}
```

### 3. Error Recovery with Retry

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error instanceof ValidationError || error instanceof PostNotFoundError) {
        throw error;
      }
      
      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError!;
}

// Usage
const posts = await withRetry(() => client.getPosts(), 3, 1000);
```

### 4. Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const circuitBreaker = new CircuitBreaker(5, 60000);

async function fetchWithCircuitBreaker() {
  try {
    return await circuitBreaker.execute(() => client.getPosts());
  } catch (error) {
    console.log('Circuit breaker prevented request or request failed');
    return []; // fallback
  }
}
```

## Built-in Error Recovery

The library includes built-in error recovery features:

### Automatic Retry Configuration

```typescript
const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  errorRecovery: {
    retries: 3,
    retryDelay: 1000,
    retryDelayMultiplier: 2,
    retryOnStatus: [408, 429, 500, 502, 503, 504]
  }
});

// Automatic retries for configured status codes
const posts = await client.getPosts(); // Will retry on 5xx errors
```

### Using Built-in Error Recovery

```typescript
// Execute with custom error recovery settings
const posts = await client.executeWithErrorRecovery(
  () => client.getPosts(),
  {
    retries: 5,
    retryDelay: 2000,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt} after error:`, error.message);
    }
  }
);
```

### Error Recovery Events

```typescript
// Listen to error recovery events
client.addErrorRecoveryEventListener('retry', (event) => {
  console.log(`Retry ${event.attempt}/${event.maxRetries} for ${event.operation}`);
});

client.addErrorRecoveryEventListener('giveUp', (event) => {
  console.log(`Giving up on ${event.operation} after ${event.attempts} attempts`);
});

client.addErrorRecoveryEventListener('success', (event) => {
  console.log(`${event.operation} succeeded after ${event.attempts} attempts`);
});
```

## React Error Handling

### Error Boundaries for React Hooks

```tsx
import { ErrorBoundary } from 'react-error-boundary';
import { usePosts } from '@jsonplaceholder-client-lib/react';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function PostList() {
  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <PostListContent />
    </ErrorBoundary>
  );
}

function PostListContent() {
  const { data: posts, loading, error } = usePosts();
  
  if (loading) return <div>Loading...</div>;
  if (error) {
    // Handle specific error types
    if (error instanceof NetworkError) {
      return <div>Network error. Please check your connection.</div>;
    }
    if (error instanceof ServerError) {
      return <div>Server error. Please try again later.</div>;
    }
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Hook-level Error Handling

```tsx
import { usePosts, usePost } from '@jsonplaceholder-client-lib/react';

function PostDetail({ id }: { id: number }) {
  const { data: post, loading, error, retry } = usePost(id);
  
  if (loading) return <div>Loading...</div>;
  
  if (error) {
    return (
      <div>
        <p>Failed to load post: {error.message}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }
  
  return <div>{post?.title}</div>;
}
```

### Mutation Error Handling

```tsx
import { useCreatePost } from '@jsonplaceholder-client-lib/react';

function CreatePostForm() {
  const { mutate: createPost, loading, error } = useCreatePost();
  const [formData, setFormData] = useState({ title: '', body: '', userId: 1 });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createPost(formData);
      // Success - handle accordingly
      alert('Post created successfully!');
    } catch (error) {
      // Error is automatically set in hook state
      console.error('Failed to create post:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={formData.title}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
        placeholder="Title"
      />
      <textarea 
        value={formData.body}
        onChange={(e) => setFormData({...formData, body: e.target.value})}
        placeholder="Body"
      />
      
      {error && (
        <div style={{ color: 'red' }}>
          Error: {error.message}
          {error instanceof ValidationError && (
            <ul>
              {Object.entries(error.details).map(([field, errors]) => (
                <li key={field}>{field}: {errors.join(', ')}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

## Advanced Error Handling

### Global Error Handler

```typescript
class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorQueue: Array<{ error: Error; context: any; timestamp: Date }> = [];
  
  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }
  
  handleError(error: Error, context?: any) {
    const errorInfo = {
      error,
      context,
      timestamp: new Date()
    };
    
    this.errorQueue.push(errorInfo);
    
    // Log to console
    console.error('Global error:', errorInfo);
    
    // Send to error tracking service
    this.sendToErrorTracking(errorInfo);
    
    // Show user notification for critical errors
    if (error instanceof ServerError && error.status >= 500) {
      this.showUserNotification('System error occurred. Please try again later.');
    }
  }
  
  private sendToErrorTracking(errorInfo: any) {
    // Send to service like Sentry, LogRocket, etc.
    // Example:
    // Sentry.captureException(errorInfo.error, { extra: errorInfo.context });
  }
  
  private showUserNotification(message: string) {
    // Show toast, modal, or other user notification
    console.log('User notification:', message);
  }
  
  getErrorHistory() {
    return this.errorQueue;
  }
  
  clearErrors() {
    this.errorQueue = [];
  }
}

// Set up global error handler
const errorHandler = GlobalErrorHandler.getInstance();

// Use with client
const client = new JsonPlaceholderClient();

client.addResponseInterceptor(
  (response) => response,
  (error) => {
    errorHandler.handleError(error, { endpoint: error.config?.url });
    return Promise.reject(error);
  }
);
```

### Error Analytics

```typescript
class ErrorAnalytics {
  private errorCounts = new Map<string, number>();
  private errorTrends: Array<{ type: string; timestamp: Date }> = [];
  
  recordError(error: Error) {
    const errorType = error.constructor.name;
    
    // Count errors by type
    this.errorCounts.set(errorType, (this.errorCounts.get(errorType) || 0) + 1);
    
    // Track trends
    this.errorTrends.push({ type: errorType, timestamp: new Date() });
    
    // Clean old trends (keep only last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.errorTrends = this.errorTrends.filter(trend => trend.timestamp > cutoff);
  }
  
  getErrorReport() {
    return {
      totalErrors: this.errorTrends.length,
      errorsByType: Object.fromEntries(this.errorCounts),
      recentTrends: this.getRecentTrends(),
      recommendations: this.getRecommendations()
    };
  }
  
  private getRecentTrends() {
    const last4Hours = new Date(Date.now() - 4 * 60 * 60 * 1000);
    return this.errorTrends.filter(trend => trend.timestamp > last4Hours);
  }
  
  private getRecommendations() {
    const recommendations = [];
    
    if (this.errorCounts.get('NetworkError') > 5) {
      recommendations.push('High network errors detected. Consider implementing offline functionality.');
    }
    
    if (this.errorCounts.get('ServerError') > 10) {
      recommendations.push('Multiple server errors detected. Check API status or implement circuit breaker.');
    }
    
    return recommendations;
  }
}

// Usage
const analytics = new ErrorAnalytics();

client.addResponseInterceptor(
  (response) => response,
  (error) => {
    analytics.recordError(error);
    return Promise.reject(error);
  }
);

// Get error insights
console.log('Error Report:', analytics.getErrorReport());
```

## Testing Error Scenarios

### Unit Tests for Error Handling

```typescript
import { JsonPlaceholderClient, PostNotFoundError } from 'jsonplaceholder-client-lib';
import MockAdapter from 'axios-mock-adapter';

describe('Error Handling', () => {
  let client: JsonPlaceholderClient;
  let mockAxios: MockAdapter;
  
  beforeEach(() => {
    client = new JsonPlaceholderClient();
    mockAxios = new MockAdapter(client['axiosInstance']);
  });
  
  it('should throw PostNotFoundError for 404 responses', async () => {
    mockAxios.onGet('/posts/999').reply(404);
    
    await expect(client.getPost(999)).rejects.toThrow(PostNotFoundError);
  });
  
  it('should retry on server errors', async () => {
    let attempts = 0;
    mockAxios.onGet('/posts').reply(() => {
      attempts++;
      if (attempts < 3) {
        return [500, 'Server Error'];
      }
      return [200, []];
    });
    
    const posts = await client.getPosts();
    expect(attempts).toBe(3);
    expect(posts).toEqual([]);
  });
  
  it('should handle network timeouts', async () => {
    mockAxios.onGet('/posts').timeout();
    
    await expect(client.getPosts()).rejects.toThrow(NetworkError);
  });
});
```

### Integration Tests

```typescript
describe('Error Recovery Integration', () => {
  it('should recover from temporary server issues', async () => {
    // Test with real API or comprehensive mocking
    const client = new JsonPlaceholderClient();
    
    // Simulate recovery scenario
    const result = await client.executeWithErrorRecovery(
      () => client.getPosts(),
      { retries: 3, retryDelay: 100 }
    );
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
```

## Best Practices

### 1. Always Handle Specific Error Types

```typescript
// ✅ Good - specific error handling
try {
  const post = await client.getPost(id);
} catch (error) {
  if (error instanceof PostNotFoundError) {
    return null; // or default value
  }
  if (error instanceof NetworkError) {
    throw new Error('Network issue, please try again');
  }
  throw error; // re-throw unexpected errors
}

// ❌ Bad - generic error handling
try {
  const post = await client.getPost(id);
} catch (error) {
  console.log('Error:', error.message);
  return null; // Loses important error context
}
```

### 2. Provide Meaningful Error Messages

```typescript
// ✅ Good - user-friendly messages
const handleError = (error: Error) => {
  if (error instanceof NetworkError) {
    if (error.isOffline) {
      return 'You appear to be offline. Please check your internet connection.';
    }
    return 'Unable to connect to the server. Please try again.';
  }
  
  if (error instanceof ValidationError) {
    const fields = Object.keys(error.details).join(', ');
    return `Please check the following fields: ${fields}`;
  }
  
  return 'An unexpected error occurred. Please try again or contact support.';
};

// ❌ Bad - technical error messages
const handleError = (error: Error) => {
  return error.message; // Often too technical for users
};
```

### 3. Implement Graceful Degradation

```typescript
async function getPostsWithFallback() {
  try {
    return await client.getPosts();
  } catch (error) {
    console.warn('Failed to fetch live posts, using cache:', error.message);
    
    // Try cache
    try {
      return await getCachedPosts();
    } catch (cacheError) {
      console.warn('Cache also failed, using static data');
      
      // Return minimal fallback data
      return [
        { id: 1, title: 'Welcome', body: 'Content unavailable', userId: 1 }
      ];
    }
  }
}
```

### 4. Monitor and Alert

```typescript
// Set up error monitoring
const client = new JsonPlaceholderClient();

let errorCount = 0;
const ERROR_THRESHOLD = 10;
const TIME_WINDOW = 60000; // 1 minute

client.addResponseInterceptor(
  (response) => response,
  (error) => {
    errorCount++;
    
    // Alert if too many errors
    if (errorCount >= ERROR_THRESHOLD) {
      console.error(`${ERROR_THRESHOLD} errors in ${TIME_WINDOW}ms - possible service degradation`);
      // Send alert to monitoring service
    }
    
    // Reset counter after time window
    setTimeout(() => {
      errorCount = Math.max(0, errorCount - 1);
    }, TIME_WINDOW);
    
    return Promise.reject(error);
  }
);
```

## Conclusion

Effective error handling is crucial for building robust applications. The JSONPlaceholder Client Library provides comprehensive error types and recovery mechanisms to help you build resilient applications that gracefully handle failures and provide excellent user experiences.

Key takeaways:

- Use specific error types for targeted handling
- Implement retry logic for transient failures  
- Provide user-friendly error messages
- Monitor error patterns and trends
- Test error scenarios thoroughly
- Have fallback strategies for critical functionality

For more information, see:

- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Examples](./examples/)

---

**Build resilient applications with confidence! 🛡️**
