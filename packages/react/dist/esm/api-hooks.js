import { useCallback } from 'react';
import { useQuery, useMutation } from './hooks';
import { useJsonPlaceholderClient } from './context';
// Posts Hooks
export function usePosts(options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getPosts(), [client]);
    return useQuery('posts', queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        ...options
    });
}
export function usePost(id, options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getPost(id), [client, id]);
    return useQuery(`post-${id}`, queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        enabled: id > 0,
        ...options
    });
}
export function usePostsWithPagination(searchOptions = {}, options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getPostsWithPagination(searchOptions), [client, searchOptions]);
    const queryKey = `posts-paginated-${JSON.stringify(searchOptions)}`;
    return useQuery(queryKey, queryFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes for paginated data
        cacheTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
}
export function useSearchPosts(searchOptions, options) {
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
export function usePostsByUser(userId, searchOptions = {}, options) {
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
export function useComments(options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.searchComments({}), [client]);
    return useQuery('comments', queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        ...options
    });
}
export function useCommentsWithPagination(searchOptions = {}, options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getCommentsWithPagination(searchOptions), [client, searchOptions]);
    const queryKey = `comments-paginated-${JSON.stringify(searchOptions)}`;
    return useQuery(queryKey, queryFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
}
export function useCommentsByPost(postId, searchOptions = {}, options) {
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
export function useSearchComments(searchOptions, options) {
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
export function useUsers(options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getUsers(), [client]);
    return useQuery('users', queryFn, {
        staleTime: 10 * 60 * 1000, // 10 minutes (users change less frequently)
        cacheTime: 30 * 60 * 1000, // 30 minutes
        ...options
    });
}
export function useUser(id, options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getUser(id), [client, id]);
    return useQuery(`user-${id}`, queryFn, {
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        enabled: id > 0,
        ...options
    });
}
export function useUsersWithPagination(searchOptions = {}, options) {
    const client = useJsonPlaceholderClient();
    const queryFn = useCallback(() => client.getUsersWithPagination(searchOptions), [client, searchOptions]);
    const queryKey = `users-paginated-${JSON.stringify(searchOptions)}`;
    return useQuery(queryKey, queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
        ...options
    });
}
export function useSearchUsers(searchOptions, options) {
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
export function useCreatePost(options) {
    const client = useJsonPlaceholderClient();
    const mutationFn = useCallback((postData) => client.createPost(postData), [client]);
    return useMutation(mutationFn, options);
}
export function useUpdatePost(options) {
    const client = useJsonPlaceholderClient();
    const mutationFn = useCallback(({ id, data }) => client.updatePost(id, data), [client]);
    return useMutation(mutationFn, options);
}
export function useDeletePost(options) {
    const client = useJsonPlaceholderClient();
    const mutationFn = useCallback((id) => client.deletePost(id), [client]);
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
    return useCallback((id) => {
        return client.prefetchUser(id);
    }, [client]);
}
export function usePrefetchComments() {
    const client = useJsonPlaceholderClient();
    return useCallback((postId) => {
        return client.prefetchComments(postId);
    }, [client]);
}
//# sourceMappingURL=api-hooks.js.map