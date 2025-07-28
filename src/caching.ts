// Optional caching features
export {
  CacheManager,
  MemoryCacheStorage,
  LocalStorageCacheStorage,
  SessionStorageCacheStorage
} from './cache';

export type {
  ICacheStorage,
  CacheEntry,
  CacheConfig,
  CacheStats,
  CacheOptions
} from './types';

// Re-export core for convenience
export * from './core';
