import { useCallback } from 'react';
import { Post, Comment, User, PaginatedResponse, PostSearchOptions, CommentSearchOptions, UserSearchOptions } from 'jsonplaceholder-client-lib';
import { useQuery, useMutation, UseQueryOptions, UseMutationOptions, UseQueryResult, UseMutationResult } from './hooks';
import { useJsonPlaceholderClient } from './context';

// Posts Hooks
export function usePosts(options?: UseQueryOptions<Post[]>): UseQueryResult<Post[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getPosts(), [client]);
  
  return useQuery('posts', queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

export function usePost(id: number, options?: UseQueryOptions<Post>): UseQueryResult<Post> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getPost(id), [client, id]);
  
  return useQuery(`post-${id}`, queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: id > 0,
    ...options
  });
}

export function usePostsWithPagination(
  searchOptions: PostSearchOptions = {},
  options?: UseQueryOptions<PaginatedResponse<Post>>
): UseQueryResult<PaginatedResponse<Post>> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getPostsWithPagination(searchOptions), [client, searchOptions]);
  
  const queryKey = `posts-paginated-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 2 * 60 * 1000, // 2 minutes for paginated data
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

export function useSearchPosts(
  searchOptions: PostSearchOptions,
  options?: UseQueryOptions<Post[]>
): UseQueryResult<Post[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.searchPosts(searchOptions), [client, searchOptions]);
  
  const queryKey = `posts-search-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: Object.keys(searchOptions).length > 0,
    ...options
  });
}

export function usePostsByUser(
  userId: number,
  searchOptions: PostSearchOptions = {},
  options?: UseQueryOptions<Post[]>
): UseQueryResult<Post[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getPostsByUser(userId, searchOptions), [client, userId, searchOptions]);
  
  const queryKey = `posts-user-${userId}-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 8 * 60 * 1000, // 8 minutes
    enabled: userId > 0,
    ...options
  });
}

// Comments Hooks
export function useComments(options?: UseQueryOptions<Comment[]>): UseQueryResult<Comment[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getComments(), [client]);
  
  return useQuery('comments', queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

export function useCommentsWithPagination(
  searchOptions: CommentSearchOptions = {},
  options?: UseQueryOptions<PaginatedResponse<Comment>>
): UseQueryResult<PaginatedResponse<Comment>> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getCommentsWithPagination(searchOptions), [client, searchOptions]);
  
  const queryKey = `comments-paginated-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

export function useCommentsByPost(
  postId: number,
  searchOptions: CommentSearchOptions = {},
  options?: UseQueryOptions<Comment[]>
): UseQueryResult<Comment[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getCommentsByPost(postId, searchOptions), [client, postId, searchOptions]);
  
  const queryKey = `comments-post-${postId}-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 8 * 60 * 1000, // 8 minutes
    enabled: postId > 0,
    ...options
  });
}

export function useSearchComments(
  searchOptions: CommentSearchOptions,
  options?: UseQueryOptions<Comment[]>
): UseQueryResult<Comment[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.searchComments(searchOptions), [client, searchOptions]);
  
  const queryKey = `comments-search-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    enabled: Object.keys(searchOptions).length > 0,
    ...options
  });
}

// Users Hooks
export function useUsers(options?: UseQueryOptions<User[]>): UseQueryResult<User[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getUsers(), [client]);
  
  return useQuery('users', queryFn, {
    staleTime: 10 * 60 * 1000, // 10 minutes (users change less frequently)
    cacheTime: 30 * 60 * 1000, // 30 minutes
    ...options
  });
}

export function useUser(id: number, options?: UseQueryOptions<User>): UseQueryResult<User> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getUser(id), [client, id]);
  
  return useQuery(`user-${id}`, queryFn, {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: id > 0,
    ...options
  });
}

export function useUsersWithPagination(
  searchOptions: UserSearchOptions = {},
  options?: UseQueryOptions<PaginatedResponse<User>>
): UseQueryResult<PaginatedResponse<User>> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.getUsersWithPagination(searchOptions), [client, searchOptions]);
  
  const queryKey = `users-paginated-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    ...options
  });
}

export function useSearchUsers(
  searchOptions: UserSearchOptions,
  options?: UseQueryOptions<User[]>
): UseQueryResult<User[]> {
  const client = useJsonPlaceholderClient();
  
  const queryFn = useCallback(() => client.searchUsers(searchOptions), [client, searchOptions]);
  
  const queryKey = `users-search-${JSON.stringify(searchOptions)}`;
  
  return useQuery(queryKey, queryFn, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    enabled: Object.keys(searchOptions).length > 0,
    ...options
  });
}

// Mutation Hooks
export function useCreatePost(
  options?: UseMutationOptions<Post, Omit<Post, 'id'>>
): UseMutationResult<Post, Omit<Post, 'id'>> {
  const client = useJsonPlaceholderClient();
  
  const mutationFn = useCallback((postData: Omit<Post, 'id'>) => client.createPost(postData), [client]);
  
  return useMutation(mutationFn, options);
}

export function useUpdatePost(
  options?: UseMutationOptions<Post, { id: number; data: Partial<Post> }>
): UseMutationResult<Post, { id: number; data: Partial<Post> }> {
  const client = useJsonPlaceholderClient();
  
  const mutationFn = useCallback(({ id, data }: { id: number; data: Partial<Post> }) => 
    client.updatePost(id, data), [client]
  );
  
  return useMutation(mutationFn, options);
}

export function useDeletePost(
  options?: UseMutationOptions<void, number>
): UseMutationResult<void, number> {
  const client = useJsonPlaceholderClient();
  
  const mutationFn = useCallback((id: number) => client.deletePost(id), [client]);
  
  return useMutation(mutationFn, options);
}

// Prefetching hooks
export function usePrefetchPosts() {
  const client = useJsonPlaceholderClient();
  
  return useCallback(() => {
    return client.prefetchPosts();
  }, [client]);
}

export function usePrefetchUser() {
  const client = useJsonPlaceholderClient();
  
  return useCallback((id: number) => {
    return client.prefetchUser(id);
  }, [client]);
}

export function usePrefetchComments() {
  const client = useJsonPlaceholderClient();
  
  return useCallback((postId: number) => {
    return client.prefetchComments(postId);
  }, [client]);
}
