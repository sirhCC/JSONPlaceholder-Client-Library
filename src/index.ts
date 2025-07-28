// Main client export
export { JsonPlaceholderClient } from './client';
export type { ClientConfig } from './client';

// Core types - always needed
export type {
  Post,
  Comment,
  User,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationOptions,
  PostSearchOptions,
  CommentSearchOptions,
  UserSearchOptions
} from './types';

// Error types - lightweight
export {
  ApiClientError,
  PostNotFoundError,
  ValidationError,
  ServerError,
  RateLimitError
} from './types';

// Caching - optional feature
export type {
  CacheConfig,
  CacheOptions,
  CacheStats,
  CacheEvent,
  CacheEventType,
  ICacheStorage
} from './types';
export { CacheManager, MemoryCacheStorage, LocalStorageCacheStorage, SessionStorageCacheStorage } from './cache';

// Logging - optional feature  
export type {
  LogLevel,
  LoggerConfig,
  ILogger
} from './types';
export { Logger, SilentLogger, createLogger, defaultLogger } from './logger';

// Interceptor types - optional feature
export type {
  RequestInterceptor,
  ResponseInterceptor,
  ResponseErrorInterceptor,
  InterceptorOptions,
  RequestConfig,
  ResponseData
} from './types';