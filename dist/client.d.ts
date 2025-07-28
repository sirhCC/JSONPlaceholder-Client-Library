import { AxiosInstance } from 'axios';
import { Post, Comment, User, PostSearchOptions, CommentSearchOptions, UserSearchOptions, PaginatedResponse, RequestInterceptor, ResponseInterceptor, ResponseErrorInterceptor, InterceptorOptions, CacheConfig, CacheOptions, CacheStats, CacheEvent } from './types';
export declare class JsonPlaceholderClient {
    client: AxiosInstance;
    private requestInterceptors;
    private responseInterceptors;
    private responseErrorInterceptors;
    private cacheManager;
    constructor(baseURL?: string, cacheConfig?: Partial<CacheConfig>);
    private setupDefaultInterceptors;
    addRequestInterceptor(interceptor: RequestInterceptor): number;
    addResponseInterceptor(onFulfilled?: ResponseInterceptor, onRejected?: ResponseErrorInterceptor): number;
    removeRequestInterceptor(index: number): void;
    removeResponseInterceptor(index: number): void;
    clearInterceptors(): void;
    /**
     * Enable or disable caching
     */
    enableCache(enabled?: boolean): void;
    /**
     * Configure cache settings
     */
    configureCaching(config: Partial<CacheConfig>): void;
    /**
     * Get cache configuration
     */
    getCacheConfig(): CacheConfig;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Clear all cached data
     */
    clearCache(): Promise<void>;
    /**
     * Delete specific cache entry
     */
    deleteCacheEntry(key: string): Promise<void>;
    /**
     * Prefetch data and store in cache
     */
    prefetchPosts(options?: CacheOptions): Promise<void>;
    /**
     * Prefetch user data
     */
    prefetchUser(userId: number, options?: CacheOptions): Promise<void>;
    /**
     * Prefetch comments for a post
     */
    prefetchComments(postId: number, options?: CacheOptions): Promise<void>;
    /**
     * Add cache event listener
     */
    addCacheEventListener(listener: (event: CacheEvent) => void): void;
    /**
     * Remove cache event listener
     */
    removeCacheEventListener(listener: (event: CacheEvent) => void): void;
    /**
     * Internal method to handle cached requests
     */
    private handleCachedRequest;
    addAuthInterceptor(token: string, type?: 'Bearer' | 'API-Key'): number;
    addLoggingInterceptor(logRequests?: boolean, logResponses?: boolean): number;
    addRetryInterceptor(options?: InterceptorOptions['retry']): number;
    private buildQueryString;
    private parsePaginationHeaders;
    private handleError;
    private extractPostIdFromContext;
    private extractValidationErrors;
    getPosts(cacheOptions?: CacheOptions): Promise<Post[]>;
    getPostsWithPagination(options?: PostSearchOptions): Promise<PaginatedResponse<Post>>;
    searchPosts(options: PostSearchOptions): Promise<Post[]>;
    getPostsByUser(userId: number, options?: PostSearchOptions): Promise<Post[]>;
    getPost(id: number, cacheOptions?: CacheOptions): Promise<Post>;
    getComments(postId: number, cacheOptions?: CacheOptions): Promise<Comment[]>;
    getCommentsWithPagination(options?: CommentSearchOptions): Promise<PaginatedResponse<Comment>>;
    searchComments(options: CommentSearchOptions): Promise<Comment[]>;
    getCommentsByPost(postId: number, options?: CommentSearchOptions): Promise<Comment[]>;
    getUser(id: number, cacheOptions?: CacheOptions): Promise<User>;
    getUsers(cacheOptions?: CacheOptions): Promise<User[]>;
    getUsersWithPagination(options?: UserSearchOptions): Promise<PaginatedResponse<User>>;
    searchUsers(options: UserSearchOptions): Promise<User[]>;
    createPost(postData: Omit<Post, 'id'>): Promise<Post>;
    updatePost(id: number, postData: Partial<Post>): Promise<Post>;
    deletePost(id: number): Promise<void>;
}
//# sourceMappingURL=client.d.ts.map