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

// Performance monitoring - optional feature
export type {
  PerformanceMetric,
  PerformanceStats,
  PerformanceTrend,
  PerformanceAlert,
  PerformanceConfig,
  PerformanceEvent,
  PerformanceEventType,
  PerformanceEventListener
} from './performance';
export { PerformanceMonitor, PerformanceDashboard } from './performance';

// Error recovery - optional feature
export type {
  ErrorRecoveryConfig,
  CircuitBreakerConfig,
  RetryConfig,
  FallbackConfig,
  HealthCheckConfig,
  CircuitBreakerStats,
  ErrorRecoveryEvent,
  ErrorRecoveryEventListener,
  CircuitState,
  RetryAttempt
} from './error-recovery';

export {
  ErrorRecoveryManager,
  ErrorRecoveryDashboard,
  CircuitBreaker,
  RetryManager,
  FallbackManager
} from './error-recovery';

// Developer tools - optional feature
export type {
  DevModeConfig,
  NetworkSimulationConfig,
  RequestInspection,
  ResponseInspection,
  PerformanceWarning,
  CodeExample
} from './developer-tools';

export {
  DeveloperTools,
  DeveloperFriendlyError
} from './developer-tools';