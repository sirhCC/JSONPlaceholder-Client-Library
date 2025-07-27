import { CacheConfig, CacheEntry, CacheStats, CacheOptions, CacheKey, ICacheStorage, CacheEventListener } from './types';
/**
 * Memory-based cache storage implementation
 */
export declare class MemoryCacheStorage implements ICacheStorage {
    private cache;
    private maxSize;
    constructor(maxSize?: number);
    get<T>(key: string): Promise<CacheEntry<T> | null>;
    set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    private evictOldest;
}
/**
 * Browser localStorage-based cache storage implementation
 */
export declare class LocalStorageCacheStorage implements ICacheStorage {
    protected keyPrefix: string;
    protected maxSize: number;
    constructor(keyPrefix?: string, maxSize?: number);
    get<T>(key: string): Promise<CacheEntry<T> | null>;
    set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    protected evictOldest(): Promise<void>;
}
/**
 * Browser sessionStorage-based cache storage implementation
 */
export declare class SessionStorageCacheStorage extends LocalStorageCacheStorage {
    get<T>(key: string): Promise<CacheEntry<T> | null>;
    set<T>(key: string, entry: CacheEntry<T>): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    size(): Promise<number>;
    protected evictOldest(): Promise<void>;
}
/**
 * Main cache manager class
 */
export declare class CacheManager {
    private storage;
    private config;
    private stats;
    private eventListeners;
    private backgroundRefreshPromises;
    private pendingRequests;
    constructor(config?: Partial<CacheConfig>);
    private createStorage;
    /**
     * Generate a cache key from request parameters
     */
    generateKey(cacheKey: CacheKey): string;
    /**
     * Get data from cache
     */
    get<T>(key: string): Promise<T | null>;
    /**
     * Set data in cache
     */
    set<T>(key: string, data: T, options?: CacheOptions): Promise<void>;
    /**
     * Delete entry from cache
     */
    delete(key: string): Promise<void>;
    /**
     * Clear entire cache
     */
    clear(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Update cache configuration
     */
    updateConfig(newConfig: Partial<CacheConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): CacheConfig;
    /**
     * Add event listener
     */
    addEventListener(listener: CacheEventListener): void;
    /**
     * Remove event listener
     */
    removeEventListener(listener: CacheEventListener): void;
    /**
     * Check if entry should trigger background refresh
     */
    private shouldBackgroundRefresh;
    /**
     * Calculate approximate size of data in bytes
     */
    private calculateSize;
    /**
     * Update cache statistics
     */
    private updateStats;
    /**
     * Emit cache event
     */
    private emitEvent;
    /**
     * Handle background refresh
     */
    handleBackgroundRefresh<T>(key: string, refreshFn: () => Promise<T>): Promise<void>;
    /**
     * Prefetch data and store in cache
     */
    prefetch<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<void>;
    /**
     * Get data with stale-while-revalidate strategy
     */
    getWithSWR<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
    /**
     * Get data from cache or fetch it, handling concurrent requests
     */
    getOrFetch<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
}
//# sourceMappingURL=cache.d.ts.map