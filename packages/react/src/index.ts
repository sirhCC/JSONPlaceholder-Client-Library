// Context and Provider
export {
  JsonPlaceholderProvider,
  useJsonPlaceholderClient,
  useJsonPlaceholderClientOptional,
  type JsonPlaceholderProviderProps
} from './context';

// Base hooks
export {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseQueryResult,
  type UseMutationOptions,
  type UseMutationResult
} from './hooks';

// API-specific hooks
export {
  // Posts
  usePosts,
  usePost,
  usePostsWithPagination,
  useSearchPosts,
  usePostsByUser,
  
  // Comments
  useComments,
  useCommentsWithPagination,
  useCommentsByPost,
  useSearchComments,
  
  // Users
  useUsers,
  useUser,
  useUsersWithPagination,
  useSearchUsers,
  
  // Mutations
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  
  // Prefetching
  usePrefetchPosts,
  usePrefetchUser,
  usePrefetchComments
} from './api-hooks';

// Re-export types from the main library for convenience
export type {
  Post,
  Comment,
  User,
  PaginatedResponse,
  PostSearchOptions,
  CommentSearchOptions,
  UserSearchOptions,
  JsonPlaceholderClient
} from 'jsonplaceholder-client-lib';
