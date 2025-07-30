export { JsonPlaceholderClient } from './client';
export type { ClientConfig } from './client';
export type { Post, Comment, User, ApiResponse, ApiError, PaginatedResponse, PaginationOptions, PostSearchOptions, CommentSearchOptions, UserSearchOptions } from './types';
export { ApiClientError, PostNotFoundError, ValidationError, ServerError, RateLimitError } from './types';
export type { CacheConfig, CacheOptions, CacheStats, CacheEvent, CacheEventType, ICacheStorage } from './types';
export { CacheManager, MemoryCacheStorage, LocalStorageCacheStorage, SessionStorageCacheStorage } from './cache';
export type { LogLevel, LoggerConfig, ILogger } from './types';
export { Logger, SilentLogger, createLogger, defaultLogger } from './logger';
export type { RequestInterceptor, ResponseInterceptor, ResponseErrorInterceptor, InterceptorOptions, RequestConfig, ResponseData } from './types';
export type { PerformanceMetric, PerformanceStats, PerformanceTrend, PerformanceAlert, PerformanceConfig, PerformanceEvent, PerformanceEventType, PerformanceEventListener } from './performance';
export { PerformanceMonitor, PerformanceDashboard } from './performance';
export type { ErrorRecoveryConfig, CircuitBreakerConfig, RetryConfig, FallbackConfig, HealthCheckConfig, CircuitBreakerStats, ErrorRecoveryEvent, ErrorRecoveryEventListener, CircuitState, RetryAttempt } from './error-recovery';
export { ErrorRecoveryManager, ErrorRecoveryDashboard, CircuitBreaker, RetryManager, FallbackManager } from './error-recovery';
export type { DevModeConfig, NetworkSimulationConfig, RequestInspection, ResponseInspection, PerformanceWarning, CodeExample } from './developer-tools';
export { DeveloperTools, DeveloperFriendlyError } from './developer-tools';
//# sourceMappingURL=index.d.ts.map