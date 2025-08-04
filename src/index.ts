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
  ResponseData,
  SecurityConfig,
  SanitizationConfig,
  SanitizationResult
} from './types';

// Data Sanitization - optional security feature
export { DataSanitizer, defaultSanitizationConfig } from './sanitization';

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

// Advanced Error Recovery System (Priority 4) - optional feature
export type {
  ErrorRecoveryConfig,
  ErrorRecoveryStats,
  ErrorRecoveryEvent,
  ErrorRecoveryEventListener,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  RetryConfig,
  RetryAttempt,
  RetryStats,
  QueueConfig,
  QueuedRequest,
  QueueStats,
  RequestPriority
} from './advanced-error-recovery';

export {
  AdvancedErrorRecovery,
  ErrorRecoveryFactory,
  CircuitBreaker,
  CircuitBreakerManager,
  RetryManager,
  RequestQueue,
  QueueFactory,
  SpecializedRetryStrategies
} from './advanced-error-recovery';

export { CircuitState } from './circuit-breaker';

// Rate Limiting - optional security feature
export type {
  RateLimitConfig
} from './types';

export type {
  RateLimitResult,
  RateLimitAnalytics
} from './rate-limiter';

export {
  RateLimiter,
  RateLimitingError
} from './rate-limiter';

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

// Validation - security feature
export type {
  ValidationRule,
  ValidationSchema,
  ValidationResult,
  ValidationConfig
} from './types';

export {
  ValidationRules,
  RequestValidator,
  CommonSchemas,
  ValidationHelpers
} from './validation';

// Bundle optimization and feature management
export { 
  FeatureManager, 
  FeatureDetector, 
  DEFAULT_FEATURES, 
  CORE_FEATURES, 
  PRODUCTION_FEATURES,
  PRESETS 
} from './features';

// Lazy loading utilities
export { 
  LazyFeatureLoader,
  lazyLoadPerformance,
  lazyLoadValidation,
  lazyLoadDeveloperTools,
  lazyLoadRateLimiting,
  lazyLoadErrorRecovery,
  lazyLoadSecurity,
  getOptimizedFeatureLoader
} from './lazy-loading';

// Cache compression
export {
  CacheCompressionManager,
  CompressionFactory,
  JSONCompressionStrategy,
  DictionaryCompressionStrategy,
  AdaptiveCompressionStrategy
} from './cache-compression';

// Request deduplication
export {
  RequestDeduplicationManager,
  DeduplicatedJsonPlaceholderClient,
  DeduplicationFactory
} from './request-deduplication';

// Intelligent prefetching
export {
  IntelligentPrefetchManager,
  PrefetchingJsonPlaceholderClient
} from './intelligent-prefetching';

// Batch Operations - Major Performance Improvement #1
export type {
  BatchConfig,
  BatchRequest,
  BatchStats
} from './batch-operations';
export {
  BatchOperationsManager,
  BatchOptimizedJsonPlaceholderClient
} from './batch-operations';

// Streaming Optimization - Major Performance Improvement #2
export type {
  StreamConfig,
  VirtualScrollConfig,
  StreamStats
} from './streaming-optimization';
export {
  StreamingDataManager,
  StreamingJsonPlaceholderClient
} from './streaming-optimization';

// Network Optimization - Major Performance Improvement #3
export type {
  ConnectionPoolConfig,
  NetworkOptimizationConfig,
  ConnectionStats,
  RequestMetrics
} from './network-optimization';
export {
  ConnectionPoolManager,
  NetworkOptimizedJsonPlaceholderClient
} from './network-optimization';