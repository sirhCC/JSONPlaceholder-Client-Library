# JSONPlaceholder API Client Library

A TypeScript library that p  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

main();
```

### Advanced Filtering & Pagination

The library now supports advanced filtering, searching, and pagination:

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
```s a simple, type-safe interface for interacting with the JSONPlaceholder API. Features comprehensive CRUD operations, advanced filtering & pagination, robust error handling, and full TypeScript support.

## Features

- ✅ **Full CRUD Operations**: Create, read, update, and delete posts
- ✅ **Advanced Filtering & Pagination**: Search and paginate through resources
- ✅ **Type Safety**: Written in TypeScript with comprehensive type definitions
- ✅ **Error Handling**: Custom error classes for different API scenarios
- ✅ **Easy to Use**: Simple, intuitive API
- ✅ **Well Tested**: Comprehensive test suite with 39+ test cases
- ✅ **Zero Dependencies**: Only requires axios for HTTP requests

## Installation

```bash
npm install jsonplaceholder-client-lib
```

## Usage

### Basic Usage

```typescript
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';

const client = new JsonPlaceholderClient();

async function main() {
  try {
    // Get all posts
    const posts = await client.getPosts();
    console.log('All Posts:', posts.slice(0, 3));

    // Get a single post
    const post = await client.getPost(1);
    console.log('Single Post:', post);

    // Create a new post
    const newPost = await client.createPost({
      userId: 1,
      title: 'My New Post',
      body: 'This is the content of my new post.'
    });
    console.log('Created Post:', newPost);

    // Update a post
    const updatedPost = await client.updatePost(1, {
      title: 'Updated Title'
    });
    console.log('Updated Post:', updatedPost);

    // Delete a post
    await client.deletePost(1);
    console.log('Post deleted successfully');

    // Get comments for a post
    const comments = await client.getComments(1);
    console.log('Comments:', comments.slice(0, 2));

    // Get a user
    const user = await client.getUser(1);
    console.log('User:', user);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

### Error Handling

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

async function handleErrors() {
  try {
    await client.getPost(999); // Non-existent post
  } catch (error) {
    if (error instanceof PostNotFoundError) {
      console.error(`Post not found: ${error.message}`);
      console.error(`Status: ${error.status}`);
    }
  }

  try {
    await client.createPost({ userId: 1, title: '', body: '' }); // Invalid data
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`Validation failed: ${error.message}`);
      console.error(`Errors: ${error.validationErrors}`);
    }
  }

  try {
    await client.getPosts(); // If server error occurs
  } catch (error) {
    if (error instanceof ServerError) {
      console.error(`Server error: ${error.message}`);
      console.error(`Status: ${error.status}`);
    } else if (error instanceof RateLimitError) {
      console.error(`Rate limited. Retry after: ${error.retryAfter} seconds`);
    }
  }
}
```

## API Reference

### JsonPlaceholderClient

#### Methods

- `getPosts(): Promise<Post[]>` - Fetches all posts
- `getPost(id: number): Promise<Post>` - Fetches a single post by ID
- `createPost(postData: Omit<Post, 'id'>): Promise<Post>` - Creates a new post
- `updatePost(id: number, postData: Partial<Post>): Promise<Post>` - Updates a post (partial update)
- `deletePost(id: number): Promise<void>` - Deletes a post
- `getComments(postId: number): Promise<Comment[]>` - Fetches comments for a post
- `getUser(id: number): Promise<User>` - Fetches a user by ID

#### Error Types

- `PostNotFoundError` (404) - Thrown when a post is not found
- `ValidationError` (400) - Thrown for validation failures
- `ServerError` (500, 502, 503, 504) - Thrown for server errors
- `RateLimitError` (429) - Thrown when rate limited
- `ApiClientError` - Base error class for other HTTP errors

### Type Definitions

```typescript
interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

interface Comment {
  postId: number;
  id: number;
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
```

## Features

- ✅ **Full CRUD Operations** - Create, Read, Update, Delete posts
- ✅ **Type Safety** - Complete TypeScript support
- ✅ **Error Handling** - Custom error classes for different scenarios
- ✅ **Promise-based** - Modern async/await API
- ✅ **Lightweight** - Minimal dependencies
- ✅ **Well Tested** - Comprehensive test suite
- ✅ **Production Ready** - Robust error handling and validation

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License.