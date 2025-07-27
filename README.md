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

## License

This project is licensed under the MIT License.
