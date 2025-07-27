# @jsonplaceholder-client-lib/react

React hooks for `jsonplaceholder-client-lib` with advanced caching, suspense support, and optimistic updates.

## ⚡ Features

- 🪝 **React Hooks** - Intuitive React hooks for all API operations
- 🚀 **Advanced Caching** - Leverages the powerful caching system from `jsonplaceholder-client-lib`
- ⚛️ **Suspense Support** - Built-in React Suspense compatibility
- 🔄 **Optimistic Updates** - Instant UI updates with automatic rollback on errors
- 📊 **Smart Pagination** - Easy-to-use pagination hooks with cache management
- 🔍 **Search & Filtering** - Intelligent search hooks with debouncing
- 🎯 **TypeScript First** - Full TypeScript support with comprehensive type definitions
- 🔁 **Automatic Retries** - Built-in retry logic with exponential backoff
- 🎨 **Flexible Options** - Comprehensive configuration for every use case

## 📦 Installation

```bash
npm install @jsonplaceholder-client-lib/react jsonplaceholder-client-lib
```

## 🚀 Quick Start

### 1. Setup the Provider

```tsx
import React from 'react';
import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib';
import { JsonPlaceholderProvider } from '@jsonplaceholder-client-lib/react';

const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  storage: 'localStorage'
});

function App() {
  return (
    <JsonPlaceholderProvider client={client}>
      <PostsList />
    </JsonPlaceholderProvider>
  );
}
```

### 2. Use the Hooks

```tsx
import React from 'react';
import { usePosts, usePost, useCreatePost } from '@jsonplaceholder-client-lib/react';

function PostsList() {
  const { data: posts, isLoading, error, refetch } = usePosts();
  const createPost = useCreatePost({
    onSuccess: () => {
      refetch(); // Refresh the posts list
    }
  });

  if (isLoading) return <div>Loading posts...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Posts ({posts?.length})</h1>
      {posts?.map(post => (
        <PostCard key={post.id} postId={post.id} />
      ))}
      
      <button
        onClick={() => createPost.mutate({
          title: 'New Post',
          body: 'Post content',
          userId: 1
        })}
        disabled={createPost.isLoading}
      >
        {createPost.isLoading ? 'Creating...' : 'Create Post'}
      </button>
    </div>
  );
}

function PostCard({ postId }: { postId: number }) {
  const { data: post, isLoading } = usePost(postId);
  
  if (isLoading) return <div>Loading post...</div>;
  
  return (
    <div>
      <h3>{post?.title}</h3>
      <p>{post?.body}</p>
    </div>
  );
}
```

## 📚 API Reference

### Provider

#### `JsonPlaceholderProvider`

Provides the JsonPlaceholder client to all child components.

```tsx
<JsonPlaceholderProvider client={client}>
  <App />
</JsonPlaceholderProvider>
```

### Query Hooks

#### `usePosts(options?)`

Fetch all posts with intelligent caching.

```tsx
const { data, isLoading, error, refetch } = usePosts({
  refetchOnWindowFocus: true,
  staleTime: 5 * 60 * 1000, // 5 minutes
  onSuccess: (posts) => console.log('Posts loaded:', posts.length)
});
```

#### `usePost(id, options?)`

Fetch a specific post by ID.

```tsx
const { data: post, isLoading, error } = usePost(1, {
  enabled: id > 0, // Only fetch if ID is valid
  retry: 3
});
```

#### `usePostsWithPagination(searchOptions?, options?)`

Fetch posts with pagination support.

```tsx
const { data, isLoading } = usePostsWithPagination({
  _page: 1,
  _limit: 10,
  userId: 1
});

console.log(data?.pagination.hasNext); // true/false
console.log(data?.data); // Post[]
```

#### `useSearchPosts(searchOptions, options?)`

Search posts with real-time filtering.

```tsx
const { data: posts, isLoading } = useSearchPosts({
  q: 'search term',
  userId: 1,
  _sort: 'title',
  _order: 'asc'
});
```

#### `usePostsByUser(userId, searchOptions?, options?)`

Get posts by a specific user.

```tsx
const { data: userPosts, isLoading } = usePostsByUser(1, {
  _limit: 5,
  _sort: 'id',
  _order: 'desc'
});
```

### Comment Hooks

#### `useComments(options?)`

Fetch all comments.

```tsx
const { data: comments, isLoading, error } = useComments();
```

#### `useCommentsWithPagination(searchOptions?, options?)`

Fetch comments with pagination.

```tsx
const { data, isLoading } = useCommentsWithPagination({
  _page: 1,
  _limit: 10
});
```

#### `useCommentsByPost(postId, searchOptions?, options?)`

Get comments for a specific post.

```tsx
const { data: comments, isLoading } = useCommentsByPost(1);
```

#### `useSearchComments(searchOptions, options?)`

Search comments.

```tsx
const { data: comments, isLoading } = useSearchComments({
  postId: 1,
  email: 'example@email.com'
});
```

### User Hooks

#### `useUsers(options?)`

Fetch all users.

```tsx
const { data: users, isLoading, error } = useUsers({
  staleTime: 10 * 60 * 1000 // 10 minutes (users change less frequently)
});
```

#### `useUser(id, options?)`

Fetch a specific user by ID.

```tsx
const { data: user, isLoading } = useUser(1);
```

#### `useUsersWithPagination(searchOptions?, options?)`

Fetch users with pagination.

```tsx
const { data, isLoading } = useUsersWithPagination({
  _page: 1,
  _limit: 5
});
```

#### `useSearchUsers(searchOptions, options?)`

Search users.

```tsx
const { data: users, isLoading } = useSearchUsers({
  name: 'John',
  email: '@example.com'
});
```

### Mutation Hooks

#### `useCreatePost(options?)`

Create a new post with optimistic updates.

```tsx
const createPost = useCreatePost({
  onSuccess: (newPost) => {
    console.log('Post created:', newPost.id);
    // Automatically invalidates and refetches related queries
  },
  onError: (error) => {
    console.error('Failed to create post:', error);
  }
});

// Use it
createPost.mutate({
  title: 'My New Post',
  body: 'Post content here',
  userId: 1
});
```

#### `useUpdatePost(options?)`

Update an existing post.

```tsx
const updatePost = useUpdatePost({
  onSuccess: (updatedPost) => {
    console.log('Post updated:', updatedPost.id);
  }
});

updatePost.mutate({
  id: 1,
  data: { title: 'Updated Title' }
});
```

#### `useDeletePost(options?)`

Delete a post.

```tsx
const deletePost = useDeletePost({
  onSuccess: () => {
    console.log('Post deleted successfully');
  }
});

deletePost.mutate(1); // Delete post with ID 1
```

### Prefetching Hooks

#### `usePrefetchPosts()`

Prefetch posts for better performance.

```tsx
const prefetchPosts = usePrefetchPosts();

// Prefetch on hover or user interaction
<button onMouseEnter={() => prefetchPosts()}>
  Show Posts
</button>
```

#### `usePrefetchUser()`

Prefetch user data.

```tsx
const prefetchUser = usePrefetchUser();

// Prefetch user data
prefetchUser(1);
```

#### `usePrefetchComments()`

Prefetch comments for a post.

```tsx
const prefetchComments = usePrefetchComments();

// Prefetch comments when hovering over a post
<div onMouseEnter={() => prefetchComments(postId)}>
  {post.title}
</div>
```

## 🔧 Hook Options

All query hooks accept these options:

```tsx
interface UseQueryOptions<T> {
  enabled?: boolean;              // Enable/disable the query
  suspense?: boolean;             // Use React Suspense
  refetchOnWindowFocus?: boolean; // Refetch when window regains focus
  refetchOnMount?: boolean;       // Refetch on component mount
  staleTime?: number;             // Time before data becomes stale
  cacheTime?: number;             // Time to keep data in cache
  retry?: number | boolean;       // Retry configuration
  retryDelay?: number;            // Delay between retries
  onSuccess?: (data: T) => void;  // Success callback
  onError?: (error: Error) => void; // Error callback
  initialData?: T;                // Initial data
}
```

## 🎯 Advanced Examples

### Smart Search with Debouncing

```tsx
import { useState, useEffect } from 'react';
import { useSearchPosts } from '@jsonplaceholder-client-lib/react';

function SearchPosts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: posts, isLoading } = useSearchPosts({
    q: debouncedTerm
  }, {
    enabled: debouncedTerm.length > 2, // Only search if 3+ characters
    staleTime: 30 * 1000 // 30 seconds
  });

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search posts..."
      />
      
      {isLoading && <div>Searching...</div>}
      {posts?.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

### Optimistic Updates

```tsx
function PostEditor({ postId }: { postId: number }) {
  const { data: post } = usePost(postId);
  const updatePost = useUpdatePost({
    onMutate: async (variables) => {
      // Optimistically update the UI
      // The hook will automatically handle rollback on error
    },
    onSuccess: () => {
      // Show success message
    }
  });

  const handleSave = (newData: Partial<Post>) => {
    updatePost.mutate({
      id: postId,
      data: newData
    });
  };

  return (
    <div>
      <input
        defaultValue={post?.title}
        onBlur={(e) => handleSave({ title: e.target.value })}
      />
      {updatePost.isLoading && <span>Saving...</span>}
    </div>
  );
}
```

### Infinite Pagination

```tsx
function InfinitePosts() {
  const [page, setPage] = useState(1);
  const [allPosts, setAllPosts] = useState<Post[]>([]);

  const { data, isLoading } = usePostsWithPagination({
    _page: page,
    _limit: 10
  });

  useEffect(() => {
    if (data?.data) {
      setAllPosts(prev => page === 1 ? data.data : [...prev, ...data.data]);
    }
  }, [data, page]);

  return (
    <div>
      {allPosts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
      
      {data?.pagination.hasNext && (
        <button 
          onClick={() => setPage(p => p + 1)}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Load More'}
        </button>
      )}
    </div>
  );
}
```

### Suspense Mode

```tsx
import { Suspense } from 'react';

function PostWithSuspense({ postId }: { postId: number }) {
  const { data: post } = usePost(postId, { suspense: true });
  
  // No need to handle loading state - Suspense handles it
  return <div>{post.title}</div>;
}

function App() {
  return (
    <Suspense fallback={<div>Loading post...</div>}>
      <PostWithSuspense postId={1} />
    </Suspense>
  );
}
```

## 🎨 Best Practices

### 1. **Use Appropriate Stale Times**

```tsx
// Users change less frequently
const { data: users } = useUsers({
  staleTime: 10 * 60 * 1000 // 10 minutes
});

// Posts might change more often
const { data: posts } = usePosts({
  staleTime: 2 * 60 * 1000 // 2 minutes
});
```

### 2. **Prefetch for Better UX**

```tsx
function PostsList() {
  const { data: posts } = usePosts();
  const prefetchPost = usePrefetchPost();

  return (
    <div>
      {posts?.map(post => (
        <div
          key={post.id}
          onMouseEnter={() => prefetchPost(post.id)} // Prefetch on hover
        >
          <Link to={`/post/${post.id}`}>{post.title}</Link>
        </div>
      ))}
    </div>
  );
}
```

### 3. **Handle Errors Gracefully**

```tsx
function PostsList() {
  const { data: posts, error, refetch } = usePosts();

  if (error) {
    return (
      <div>
        <p>Failed to load posts: {error.message}</p>
        <button onClick={() => refetch()}>Try Again</button>
      </div>
    );
  }

  return <div>{/* Render posts */}</div>;
}
```

## 🔗 Integration with Caching System

The React hooks automatically leverage the advanced caching system from `jsonplaceholder-client-lib`:

- **Automatic Cache Management** - No manual cache invalidation needed
- **Smart Background Updates** - Data refreshes intelligently in the background
- **Cross-Component Sharing** - Multiple components using the same data share cache
- **Storage Persistence** - Cached data persists across browser sessions (when configured)

## 📊 Performance Benefits

- **Reduced API Calls** - Intelligent caching prevents duplicate requests
- **Instant Navigation** - Prefetched data loads instantly
- **Background Updates** - Fresh data without loading states
- **Memory Efficient** - Automatic cleanup of unused cache entries

## 🛠️ TypeScript Support

Full TypeScript support with complete type inference:

```tsx
// All types are automatically inferred
const { data: posts } = usePosts(); // posts: Post[] | undefined
const { data: user } = useUser(1);  // user: User | undefined

// Mutation types are also inferred
const createPost = useCreatePost(); 
createPost.mutate({
  title: 'string', // ✅ Correct
  body: 'string',  // ✅ Correct
  userId: 1,       // ✅ Correct
  // id: 1         // ❌ Error - id is omitted in create
});
```

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details.
