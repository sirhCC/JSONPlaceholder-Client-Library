import { Post, Comment, User, PaginatedResponse, PostSearchOptions, CommentSearchOptions, UserSearchOptions } from 'jsonplaceholder-client-lib';
import { UseQueryOptions, UseMutationOptions, UseQueryResult, UseMutationResult } from './hooks';
export declare function usePosts(options?: UseQueryOptions<Post[]>): UseQueryResult<Post[]>;
export declare function usePost(id: number, options?: UseQueryOptions<Post>): UseQueryResult<Post>;
export declare function usePostsWithPagination(searchOptions?: PostSearchOptions, options?: UseQueryOptions<PaginatedResponse<Post>>): UseQueryResult<PaginatedResponse<Post>>;
export declare function useSearchPosts(searchOptions: PostSearchOptions, options?: UseQueryOptions<Post[]>): UseQueryResult<Post[]>;
export declare function usePostsByUser(userId: number, searchOptions?: PostSearchOptions, options?: UseQueryOptions<Post[]>): UseQueryResult<Post[]>;
export declare function useComments(options?: UseQueryOptions<Comment[]>): UseQueryResult<Comment[]>;
export declare function useCommentsWithPagination(searchOptions?: CommentSearchOptions, options?: UseQueryOptions<PaginatedResponse<Comment>>): UseQueryResult<PaginatedResponse<Comment>>;
export declare function useCommentsByPost(postId: number, searchOptions?: CommentSearchOptions, options?: UseQueryOptions<Comment[]>): UseQueryResult<Comment[]>;
export declare function useSearchComments(searchOptions: CommentSearchOptions, options?: UseQueryOptions<Comment[]>): UseQueryResult<Comment[]>;
export declare function useUsers(options?: UseQueryOptions<User[]>): UseQueryResult<User[]>;
export declare function useUser(id: number, options?: UseQueryOptions<User>): UseQueryResult<User>;
export declare function useUsersWithPagination(searchOptions?: UserSearchOptions, options?: UseQueryOptions<PaginatedResponse<User>>): UseQueryResult<PaginatedResponse<User>>;
export declare function useSearchUsers(searchOptions: UserSearchOptions, options?: UseQueryOptions<User[]>): UseQueryResult<User[]>;
export declare function useCreatePost(options?: UseMutationOptions<Post, Omit<Post, 'id'>>): UseMutationResult<Post, Omit<Post, 'id'>>;
export declare function useUpdatePost(options?: UseMutationOptions<Post, {
    id: number;
    data: Partial<Post>;
}>): UseMutationResult<Post, {
    id: number;
    data: Partial<Post>;
}>;
export declare function useDeletePost(options?: UseMutationOptions<void, number>): UseMutationResult<void, number>;
export declare function usePrefetchPosts(): () => Promise<void>;
export declare function usePrefetchUser(): (id: number) => Promise<void>;
export declare function usePrefetchComments(): (postId: number) => Promise<void>;
//# sourceMappingURL=api-hooks.d.ts.map