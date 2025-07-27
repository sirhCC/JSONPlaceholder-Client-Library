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

// Filtering and Pagination Types
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
    q?: string; // Full-text search
}

export interface PostSearchOptions extends PostFilters, SearchOptions {}
export interface CommentSearchOptions extends CommentFilters, SearchOptions {}
export interface UserSearchOptions extends UserFilters, SearchOptions {}

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

// Interceptor types
export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
}

export interface ResponseData<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;
export type ResponseInterceptor = (response: ResponseData) => ResponseData | Promise<ResponseData>;
export type ResponseErrorInterceptor = (error: any) => any | Promise<any>;

export interface InterceptorOptions {
  retry?: {
    attempts: number;
    delay: number;
    exponentialBackoff?: boolean;
  };
  timeout?: number;
}

// Cache Configuration Types
export interface CacheConfig {
  enabled: boolean;
  defaultTTL: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  storage: 'memory' | 'localStorage' | 'sessionStorage';
  keyPrefix: string;
  backgroundRefresh: boolean;
  refreshThreshold: number; // Percentage of TTL when background refresh triggers (0-1)
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  key: string;
  size: number; // Approximate size in bytes
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
  ttl?: number; // Override default TTL for this request
  forceRefresh?: boolean; // Skip cache and force fresh data
  backgroundRefresh?: boolean; // Enable background refresh for this request
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

export interface CacheKey {
  method: string;
  url: string;
  params?: Record<string, any>;
  data?: any;
}

// Cache Storage Interface
export interface ICacheStorage {
  get<T>(key: string): Promise<CacheEntry<T> | null>;
  set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  size(): Promise<number>;
}

// Cache Event Types
export type CacheEventType = 'hit' | 'miss' | 'set' | 'delete' | 'evict' | 'refresh' | 'clear';

export interface CacheEvent {
  type: CacheEventType;
  key: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export type CacheEventListener = (event: CacheEvent) => void;

// Custom Error Classes
export class ApiClientError extends Error {
    public readonly status: number;
    public readonly response?: any;

    constructor(message: string, status: number, response?: any) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.response = response;
        
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export class PostNotFoundError extends ApiClientError {
    constructor(postId: number, response?: any) {
        super(`Post with ID ${postId} not found`, 404, response);
    }
}

export class ValidationError extends ApiClientError {
    public readonly validationErrors?: string[];

    constructor(message: string, validationErrors?: string[], response?: any) {
        super(message, 400, response);
        this.validationErrors = validationErrors;
    }
}

export class ServerError extends ApiClientError {
    constructor(message: string = 'Internal server error', response?: any) {
        super(message, 500, response);
    }
}

export class RateLimitError extends ApiClientError {
    public readonly retryAfter?: number;

    constructor(retryAfter?: number, response?: any) {
        super('Rate limit exceeded. Please try again later.', 429, response);
        this.retryAfter = retryAfter;
    }
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