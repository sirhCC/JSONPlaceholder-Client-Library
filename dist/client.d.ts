import { AxiosInstance } from 'axios';
import { Post, Comment, User, PostSearchOptions, CommentSearchOptions, UserSearchOptions, PaginatedResponse, RequestInterceptor, ResponseInterceptor, ResponseErrorInterceptor, InterceptorOptions, CacheConfig, CacheOptions, CacheStats, CacheEvent, ILogger, LoggerConfig } from './types';
import { PerformanceStats, PerformanceConfig, PerformanceEventListener, PerformanceMetric } from './performance';
import { ErrorRecoveryConfig, ErrorRecoveryEventListener, CircuitBreakerStats } from './error-recovery';
import { DevModeConfig, DeveloperFriendlyError, RequestInspection, ResponseInspection, CodeExample } from './developer-tools';
export interface ClientConfig {
    cacheConfig?: Partial<CacheConfig>;
    loggerConfig?: Partial<LoggerConfig> | ILogger;
    performanceConfig?: Partial<PerformanceConfig>;
    errorRecoveryConfig?: Partial<ErrorRecoveryConfig>;
    devModeConfig?: Partial<DevModeConfig>;
}
export declare class JsonPlaceholderClient {
    client: AxiosInstance;
    private requestInterceptors;
    private responseInterceptors;
    private responseErrorInterceptors;
    private cacheManager;
    private logger;
    private performanceMonitor;
    private performanceDashboard;
    private errorRecoveryManager;
    private errorRecoveryDashboard;
    private developerTools;
    constructor(baseURL?: string, config?: ClientConfig);
    private setupDefaultInterceptors;
    private setupPerformanceTracking;
    private setupDeveloperInstrumentation;
    private calculateResponseSize;
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
     * Get performance statistics
     */
    getPerformanceStats(): PerformanceStats;
    /**
     * Get performance dashboard report
     */
    getPerformanceReport(): string;
    /**
     * Print performance report to console
     */
    printPerformanceReport(): void;
    /**
     * Get performance insights
     */
    getPerformanceInsights(): string[];
    /**
     * Print performance insights to console
     */
    printPerformanceInsights(): void;
    /**
     * Add performance event listener
     */
    addPerformanceEventListener(listener: PerformanceEventListener): void;
    /**
     * Remove performance event listener
     */
    removePerformanceEventListener(listener: PerformanceEventListener): void;
    /**
     * Configure performance monitoring
     */
    configurePerformanceMonitoring(config: Partial<PerformanceConfig>): void;
    /**
     * Enable/disable performance monitoring
     */
    setPerformanceMonitoringEnabled(enabled: boolean): void;
    /**
     * Clear performance data
     */
    clearPerformanceData(): void;
    /**
     * Export performance data
     */
    exportPerformanceData(): {
        metrics: PerformanceMetric[];
        stats: PerformanceStats;
    };
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
    /**
     * Wrapper method that adds error recovery to HTTP requests
     */
    private executeWithErrorRecovery;
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
    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats(): CircuitBreakerStats;
    /**
     * Add event listener for error recovery events
     */
    addErrorRecoveryEventListener(listener: ErrorRecoveryEventListener): void;
    /**
     * Remove event listener for error recovery events
     */
    removeErrorRecoveryEventListener(listener: ErrorRecoveryEventListener): void;
    /**
     * Manually open the circuit breaker
     */
    forceCircuitOpen(): void;
    /**
     * Manually close the circuit breaker
     */
    forceCircuitClose(): void;
    /**
     * Reset error recovery state
     */
    resetErrorRecovery(): void;
    /**
     * Get error recovery configuration
     */
    getErrorRecoveryConfig(): ErrorRecoveryConfig;
    /**
     * Update error recovery configuration
     */
    updateErrorRecoveryConfig(config: Partial<ErrorRecoveryConfig>): void;
    /**
     * Print error recovery dashboard report
     */
    printErrorRecoveryReport(): void;
    /**
     * Print error recovery insights
     */
    printErrorRecoveryInsights(): void;
    /**
     * Get error recovery dashboard report as string
     */
    getErrorRecoveryReport(): string;
    /**
     * Get error recovery insights as array
     */
    getErrorRecoveryInsights(): string[];
    /**
     * Enable or disable developer mode
     */
    setDeveloperMode(enabled: boolean): void;
    /**
     * Get developer tools debug report
     */
    getDeveloperDebugReport(): string;
    /**
     * Print developer debug report to console
     */
    printDeveloperDebugReport(): void;
    /**
     * Get code examples for common operations
     */
    getCodeExamples(): CodeExample[];
    /**
     * Generate a code example for a specific operation
     */
    generateCodeExample(operation: string): CodeExample | null;
    /**
     * Get request inspections (dev mode only)
     */
    getRequestInspections(): RequestInspection[];
    /**
     * Get response inspections (dev mode only)
     */
    getResponseInspections(): ResponseInspection[];
    /**
     * Export all debug data
     */
    exportDebugData(): Record<string, unknown>;
    /**
     * Clear all debug data
     */
    clearDebugData(): void;
    /**
     * Simulate network conditions for testing (dev mode only)
     */
    simulateNetworkConditions(config: {
        latency?: number;
        packetLoss?: number;
        bandwidth?: number;
    }): void;
    /**
     * Get enhanced error with developer tips
     */
    createDeveloperFriendlyError(message: string, code: string, tips?: string[], examples?: string[]): DeveloperFriendlyError;
}
//# sourceMappingURL=client.d.ts.map