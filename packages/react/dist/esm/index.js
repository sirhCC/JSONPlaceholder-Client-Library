// Context and Provider
export { JsonPlaceholderProvider, useJsonPlaceholderClient, useJsonPlaceholderClientOptional } from './context';
// Base hooks
export { useQuery, useMutation } from './hooks';
// API-specific hooks
export { 
// Posts
usePosts, usePost, usePostsWithPagination, useSearchPosts, usePostsByUser, 
// Comments
useComments, useCommentsWithPagination, useCommentsByPost, useSearchComments, 
// Users
useUsers, useUser, useUsersWithPagination, useSearchUsers, 
// Mutations
useCreatePost, useUpdatePost, useDeletePost, 
// Prefetching
usePrefetchPosts, usePrefetchUser, usePrefetchComments } from './api-hooks';
//# sourceMappingURL=index.js.map