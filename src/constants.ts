/**
 * Application-wide constants
 * Centralized configuration values to avoid magic numbers throughout the codebase
 */

// Cache Configuration
export const CACHE_CONSTANTS = {
  /** Default maximum number of entries in memory cache */
  DEFAULT_MAX_SIZE: 1000,
  /** Default maximum number of entries in localStorage cache */
  LOCALSTORAGE_MAX_SIZE: 100,
  /** Default time-to-live for cache entries (5 minutes in milliseconds) */
  DEFAULT_TTL: 5 * 60 * 1000,
  /** Default interval for throttling metadata writes to storage (30 seconds) */
  DEFAULT_METADATA_WRITE_INTERVAL: 30000,
  /** Default refresh threshold for stale-while-revalidate (80%) */
  DEFAULT_REFRESH_THRESHOLD: 0.8,
} as const;

// Request Deduplication Configuration
export const DEDUPLICATION_CONSTANTS = {
  /** Maximum lifetime for in-flight requests (30 seconds) */
  MAX_REQUEST_LIFETIME: 30000,
  /** Cleanup interval for expired requests (10 seconds) */
  CLEANUP_INTERVAL: 10000,
} as const;

// WebSocket Configuration
export const WEBSOCKET_CONSTANTS = {
  /** Default reconnection interval (1 second) */
  DEFAULT_RECONNECT_INTERVAL: 1000,
  /** Maximum number of reconnection attempts */
  MAX_RECONNECT_ATTEMPTS: 5,
  /** Heartbeat interval (30 seconds) */
  HEARTBEAT_INTERVAL: 30000,
  /** Maximum message queue size */
  MAX_MESSAGE_QUEUE_SIZE: 100,
  /** Default polling interval when fallback is active (5 seconds) */
  DEFAULT_POLLING_INTERVAL: 5000,
  /** Maximum reconnection delay (30 seconds) */
  MAX_RECONNECT_DELAY: 30000,
} as const;

// Performance Monitoring Configuration
export const PERFORMANCE_CONSTANTS = {
  /** Default maximum number of metrics to store */
  DEFAULT_MAX_METRICS: 1000,
  /** Time window for cache hit tracking (1 second) */
  CACHE_HIT_WINDOW: 1000,
  /** Default expected response time (500ms) */
  DEFAULT_EXPECTED_RESPONSE_TIME: 500,
} as const;

// Security Configuration
export const SECURITY_CONSTANTS = {
  /** Default request timeout (10 seconds) */
  DEFAULT_TIMEOUT: 10000,
  /** Maximum number of redirects to follow */
  MAX_REDIRECTS: 5,
  /** Threshold for hashing large values (2KB) */
  LARGE_VALUE_HASH_THRESHOLD: 2048,
} as const;

// Time Conversions (for clarity)
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// HTTP Status Codes (commonly used)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
