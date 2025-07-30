/**
 * Production-optimized export 
 * Includes all production features except developer tools
 * 
 * Bundle size: ~95KB (excludes 25KB of dev tools)
 * 
 * @example
 * ```typescript
 * import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/production';
 * 
 * const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
 *   cache: { enabled: true },
 *   performance: { enabled: true },
 *   security: { enabled: true }
 * });
 * ```
 */

// Full client with production features
export { JsonPlaceholderClient } from './client';

// All production types
export type * from './types';

// All error classes
export {
  ApiClientError,
  PostNotFoundError,
  ValidationError,
  ServerError,
  RateLimitError,
} from './types';

// Production features (no dev tools)
export { CacheManager, MemoryCacheStorage, LocalStorageCacheStorage } from './cache';
export { PerformanceMonitor, PerformanceDashboard } from './performance';
export { Logger, SilentLogger } from './logger';
export { DataSanitizer } from './sanitization';
export type { SanitizationConfig } from './sanitization';
export { RequestValidator, ValidationRules } from './validation';
export { RateLimiter } from './rate-limiter';
export { ErrorRecoveryManager, CircuitBreaker } from './error-recovery';

// Production feature flags
export { PRODUCTION_FEATURES as DEFAULT_FEATURES } from './features';

// Utilities
export { FeatureManager, FeatureDetector } from './features';
