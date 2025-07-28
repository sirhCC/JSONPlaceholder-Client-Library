export interface ApiResponse<T> {
    data: T;
    status: number;
    message: string;
}
export interface ApiError {
    status: number;
    error: string;
    message: string;
}
export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';
export interface LoggerConfig {
    level: LogLevel;
    prefix?: string;
    timestamp?: boolean;
    colors?: boolean;
}
export interface ILogger {
    error(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    debug(message: string, ...args: unknown[]): void;
    setLevel(level: LogLevel): void;
    getLevel(): LogLevel;
}
export interface PaginationOptions {
    _page?: number;
    _limit?: number;
    _start?: number;
    _end?: number;
}
export interface PostFilters {
    userId?: number;
    title?: string;
    body?: string;
    id?: number;
}
export interface CommentFilters {
    postId?: number;
    name?: string;
    email?: string;
    body?: string;
    id?: number;
}
export interface UserFilters {
    name?: string;
    username?: string;
    email?: string;
    website?: string;
    id?: number;
}
export interface SortOptions {
    _sort?: string;
    _order?: 'asc' | 'desc';
}
export interface SearchOptions extends PaginationOptions, SortOptions {
    q?: string;
}
export interface PostSearchOptions extends PostFilters, SearchOptions {
}
export interface CommentSearchOptions extends CommentFilters, SearchOptions {
}
export interface UserSearchOptions extends UserFilters, SearchOptions {
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export interface RequestConfig {
    method: string;
    url: string;
    headers: Record<string, string>;
    data?: unknown;
    params?: Record<string, unknown>;
}
export interface ResponseData<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: RequestConfig;
}
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (response: ResponseData) => ResponseData | Promise<ResponseData>;
export type ResponseErrorInterceptor = (error: Error) => Error | Promise<Error>;
export interface InterceptorOptions {
    retry?: {
        attempts: number;
        delay: number;
        exponentialBackoff?: boolean;
    };
    timeout?: number;
}
export interface CacheConfig {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
    storage: 'memory' | 'localStorage' | 'sessionStorage';
    keyPrefix: string;
    backgroundRefresh: boolean;
    refreshThreshold: number;
}
export interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;
    ttl: number;
    accessCount: number;
    lastAccess: number;
    key: string;
    size: number;
}
export interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    backgroundRefreshes: number;
    totalRequests: number;
    hitRate: number;
    currentSize: number;
    maxSize: number;
    entryCount: number;
    averageResponseTime: number;
}
export interface CacheOptions {
    ttl?: number;
    forceRefresh?: boolean;
    backgroundRefresh?: boolean;
    staleWhileRevalidate?: boolean;
}
export interface CacheKey {
    method: string;
    url: string;
    params?: Record<string, unknown>;
    data?: unknown;
}
export interface ICacheStorage {
    get<T>(key: string): Promise<CacheEntry<T> | null>;
    set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
}
export type CacheEventType = 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'refresh' | 'clear';
export interface CacheEvent {
    type: CacheEventType;
    key: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
}
export type CacheEventListener = (event: CacheEvent) => void;
export declare class ApiClientError extends Error {
    readonly status: number;
    readonly response?: unknown;
    constructor(message: string, status: number, response?: unknown);
}
export declare class PostNotFoundError extends ApiClientError {
    constructor(postId: number, response?: unknown);
}
export declare class ValidationError extends ApiClientError {
    readonly validationErrors?: string[];
    constructor(message: string, validationErrors?: string[], response?: unknown);
}
export declare class ServerError extends ApiClientError {
    constructor(message?: string, response?: unknown);
}
export declare class RateLimitError extends ApiClientError {
    readonly retryAfter?: number;
    constructor(retryAfter?: number, response?: unknown);
}
export interface Post {
    userId: number;
    id: number;
    title: string;
    body: string;
}
export interface Comment {
    postId: number;
    id: number;
    name: string;
    email: string;
    body: string;
}
export interface User {
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
//# sourceMappingURL=types.d.ts.map