"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePosts = usePosts;
exports.usePost = usePost;
exports.usePostsWithPagination = usePostsWithPagination;
exports.useSearchPosts = useSearchPosts;
exports.usePostsByUser = usePostsByUser;
exports.useComments = useComments;
exports.useCommentsWithPagination = useCommentsWithPagination;
exports.useCommentsByPost = useCommentsByPost;
exports.useSearchComments = useSearchComments;
exports.useUsers = useUsers;
exports.useUser = useUser;
exports.useUsersWithPagination = useUsersWithPagination;
exports.useSearchUsers = useSearchUsers;
exports.useCreatePost = useCreatePost;
exports.useUpdatePost = useUpdatePost;
exports.useDeletePost = useDeletePost;
exports.usePrefetchPosts = usePrefetchPosts;
exports.usePrefetchUser = usePrefetchUser;
exports.usePrefetchComments = usePrefetchComments;
const react_1 = require("react");
const hooks_1 = require("./hooks");
const context_1 = require("./context");
// Posts Hooks
function usePosts(options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getPosts(), [client]);
    return (0, hooks_1.useQuery)('posts', queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        ...options
    });
}
function usePost(id, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getPost(id), [client, id]);
    return (0, hooks_1.useQuery)(`post-${id}`, queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        enabled: id > 0,
        ...options
    });
}
function usePostsWithPagination(searchOptions = {}, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getPostsWithPagination(searchOptions), [client, searchOptions]);
    const queryKey = `posts-paginated-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes for paginated data
        cacheTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
}
function useSearchPosts(searchOptions, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.searchPosts(searchOptions), [client, searchOptions]);
    const queryKey = `posts-search-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes for search results
        cacheTime: 5 * 60 * 1000, // 5 minutes
        enabled: Object.keys(searchOptions).length > 0,
        ...options
    });
}
function usePostsByUser(userId, searchOptions = {}, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getPostsByUser(userId, searchOptions), [client, userId, searchOptions]);
    const queryKey = `posts-user-${userId}-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 3 * 60 * 1000, // 3 minutes
        cacheTime: 8 * 60 * 1000, // 8 minutes
        enabled: userId > 0,
        ...options
    });
}
// Comments Hooks
function useComments(options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.searchComments({}), [client]);
    return (0, hooks_1.useQuery)('comments', queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        ...options
    });
}
function useCommentsWithPagination(searchOptions = {}, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getCommentsWithPagination(searchOptions), [client, searchOptions]);
    const queryKey = `comments-paginated-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        ...options
    });
}
function useCommentsByPost(postId, searchOptions = {}, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getCommentsByPost(postId, searchOptions), [client, postId, searchOptions]);
    const queryKey = `comments-post-${postId}-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 3 * 60 * 1000, // 3 minutes
        cacheTime: 8 * 60 * 1000, // 8 minutes
        enabled: postId > 0,
        ...options
    });
}
function useSearchComments(searchOptions, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.searchComments(searchOptions), [client, searchOptions]);
    const queryKey = `comments-search-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 2 * 60 * 1000, // 2 minutes
        cacheTime: 5 * 60 * 1000, // 5 minutes
        enabled: Object.keys(searchOptions).length > 0,
        ...options
    });
}
// Users Hooks
function useUsers(options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getUsers(), [client]);
    return (0, hooks_1.useQuery)('users', queryFn, {
        staleTime: 10 * 60 * 1000, // 10 minutes (users change less frequently)
        cacheTime: 30 * 60 * 1000, // 30 minutes
        ...options
    });
}
function useUser(id, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getUser(id), [client, id]);
    return (0, hooks_1.useQuery)(`user-${id}`, queryFn, {
        staleTime: 10 * 60 * 1000, // 10 minutes
        cacheTime: 30 * 60 * 1000, // 30 minutes
        enabled: id > 0,
        ...options
    });
}
function useUsersWithPagination(searchOptions = {}, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.getUsersWithPagination(searchOptions), [client, searchOptions]);
    const queryKey = `users-paginated-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
        ...options
    });
}
function useSearchUsers(searchOptions, options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const queryFn = (0, react_1.useCallback)(() => client.searchUsers(searchOptions), [client, searchOptions]);
    const queryKey = `users-search-${JSON.stringify(searchOptions)}`;
    return (0, hooks_1.useQuery)(queryKey, queryFn, {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 15 * 60 * 1000, // 15 minutes
        enabled: Object.keys(searchOptions).length > 0,
        ...options
    });
}
// Mutation Hooks
function useCreatePost(options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const mutationFn = (0, react_1.useCallback)((postData) => client.createPost(postData), [client]);
    return (0, hooks_1.useMutation)(mutationFn, options);
}
function useUpdatePost(options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const mutationFn = (0, react_1.useCallback)(({ id, data }) => client.updatePost(id, data), [client]);
    return (0, hooks_1.useMutation)(mutationFn, options);
}
function useDeletePost(options) {
    const client = (0, context_1.useJsonPlaceholderClient)();
    const mutationFn = (0, react_1.useCallback)((id) => client.deletePost(id), [client]);
    return (0, hooks_1.useMutation)(mutationFn, options);
}
// Prefetching hooks
function usePrefetchPosts() {
    const client = (0, context_1.useJsonPlaceholderClient)();
    return (0, react_1.useCallback)(() => {
        return client.prefetchPosts();
    }, [client]);
}
function usePrefetchUser() {
    const client = (0, context_1.useJsonPlaceholderClient)();
    return (0, react_1.useCallback)((id) => {
        return client.prefetchUser(id);
    }, [client]);
}
function usePrefetchComments() {
    const client = (0, context_1.useJsonPlaceholderClient)();
    return (0, react_1.useCallback)((postId) => {
        return client.prefetchComments(postId);
    }, [client]);
}
//# sourceMappingURL=api-hooks.js.map