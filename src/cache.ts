import { 
  CacheConfig, 
  CacheEntry, 
  CacheStats, 
  CacheOptions, 
  CacheKey, 
  ICacheStorage, 
  CacheEvent, 
  CacheEventType, 
  CacheEventListener,
  ILogger
} from './types';
import { createLogger } from './logger';
import { canonicalizeKeyParts } from './utils/serialization';

/**
 * Memory-based cache storage implementation
 */
export class MemoryCacheStorage implements ICacheStorage {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccess = Date.now();
    
    return entry;
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      await this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys());
  }

  async size(): Promise<number> {
    return this.cache.size;
  }

  private async evictOldest(): Promise<void> {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

/**
 * Browser localStorage-based cache storage implementation
 */
export class LocalStorageCacheStorage implements ICacheStorage {
  protected keyPrefix: string;
  protected maxSize: number;
  protected logger: ILogger;
  // Track next-allowed write time per key to avoid writing on every read
  protected nextWriteAllowed: Map<string, number> = new Map();
  // Default to 30s unless overridden by CacheManager via config injection
  protected metadataWriteIntervalMs: number = 30000;

  constructor(keyPrefix: string = 'jsonph_cache_', maxSize: number = 100, logger?: ILogger) {
    this.keyPrefix = keyPrefix;
    this.maxSize = maxSize;
    this.logger = logger || createLogger({ level: 'silent' });
  }

  /**
   * Configure minimum interval between metadata write-backs
   */
  public setMetadataWriteIntervalMs(ms: number): void {
    if (Number.isFinite(ms) && ms >= 0) {
      this.metadataWriteIntervalMs = ms;
    }
  }

  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.keyPrefix + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Check if entry has expired
      if (Date.now() > entry.timestamp + entry.ttl) {
        await this.delete(key);
        return null;
      }

      // Update access statistics and rate-limit persistence to storage
      entry.accessCount++;
      entry.lastAccess = Date.now();
      const now = Date.now();
      const nextAllowed = this.nextWriteAllowed.get(key) ?? 0;
      if (now >= nextAllowed) {
        this.nextWriteAllowed.set(key, now + this.metadataWriteIntervalMs);
        try {
          localStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
        } catch (e) {
          // Swallow to avoid breaking reads
          this.logger.warn('Failed metadata write-back to localStorage:', e);
        }
      }
      
      return entry;
    } catch (error) {
      this.logger.warn('Failed to read from localStorage cache:', error);
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      // Check if we need to evict entries
      const currentKeys = await this.keys();
      if (currentKeys.length >= this.maxSize && !currentKeys.includes(key)) {
        await this.evictOldest();
      }

      localStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
    } catch (error) {
      this.logger.warn('Failed to write to localStorage cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    localStorage.removeItem(this.keyPrefix + key);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    const keys = await this.keys();
    keys.forEach(key => localStorage.removeItem(this.keyPrefix + key));
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        keys.push(key.substring(this.keyPrefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  protected async evictOldest(): Promise<void> {
    const keys = await this.keys();
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const key of keys) {
      try {
        const stored = localStorage.getItem(this.keyPrefix + key);
        if (stored) {
          const entry: CacheEntry = JSON.parse(stored);
          if (entry.lastAccess < oldestTime) {
            oldestTime = entry.lastAccess;
            oldestKey = key;
          }
        }
      } catch (error) {
        // If we can't parse, remove this entry
        await this.delete(key);
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
    }
  }
}

/**
 * Browser sessionStorage-based cache storage implementation
 */
export class SessionStorageCacheStorage extends LocalStorageCacheStorage {
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }

    try {
      const stored = sessionStorage.getItem(this.keyPrefix + key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Check if entry has expired
      if (Date.now() > entry.timestamp + entry.ttl) {
        await this.delete(key);
        return null;
      }

      // Update access statistics and rate-limit persistence to storage
      entry.accessCount++;
      entry.lastAccess = Date.now();
      const now = Date.now();
      const nextAllowed = this.nextWriteAllowed.get(key) ?? 0;
      if (now >= nextAllowed) {
        this.nextWriteAllowed.set(key, now + this.metadataWriteIntervalMs);
        try {
          sessionStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
        } catch (e) {
          this.logger.warn('Failed metadata write-back to sessionStorage:', e);
        }
      }
      
      return entry;
    } catch (error) {
      this.logger.warn('Failed to read from sessionStorage cache:', error);
      return null;
    }
  }

  async set<T>(key: string, entry: CacheEntry<T>): Promise<void> {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    try {
      // Check if we need to evict entries
      const currentKeys = await this.keys();
      if (currentKeys.length >= this.maxSize && !currentKeys.includes(key)) {
        await this.evictOldest();
      }

      sessionStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
    } catch (error) {
      this.logger.warn('Failed to write to sessionStorage cache:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    sessionStorage.removeItem(this.keyPrefix + key);
  }

  async clear(): Promise<void> {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }

    const keys = await this.keys();
    keys.forEach(key => sessionStorage.removeItem(this.keyPrefix + key));
  }

  async keys(): Promise<string[]> {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return [];
    }

    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.keyPrefix)) {
        keys.push(key.substring(this.keyPrefix.length));
      }
    }
    return keys;
  }

  async size(): Promise<number> {
    return (await this.keys()).length;
  }

  protected async evictOldest(): Promise<void> {
    const keys = await this.keys();
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const key of keys) {
      try {
        const stored = sessionStorage.getItem(this.keyPrefix + key);
        if (stored) {
          const entry: CacheEntry = JSON.parse(stored);
          if (entry.lastAccess < oldestTime) {
            oldestTime = entry.lastAccess;
            oldestKey = key;
          }
        }
      } catch (error) {
        // If we can't parse, remove this entry
        await this.delete(key);
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
    }
  }
}

/**
 * Main cache manager class
 */
export class CacheManager {
  private storage: ICacheStorage;
  private config: CacheConfig;
  private stats: CacheStats;
  private eventListeners: CacheEventListener[] = [];
  private backgroundRefreshPromises = new Map<string, Promise<unknown>>();
  private pendingRequests = new Map<string, Promise<unknown>>();
  private logger: ILogger;
  // Track per-key sizes to avoid scanning storage on every stats update
  private sizeIndex: Map<string, number> = new Map();

  constructor(config: Partial<CacheConfig> = {}, logger?: ILogger) {
    this.logger = logger || createLogger({ level: 'silent' });
    this.config = {
      enabled: true,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      storage: 'memory',
      keyPrefix: 'jsonph_cache_',
      backgroundRefresh: true,
      refreshThreshold: 0.8, // Refresh when 80% of TTL has passed
      ...config
    };

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      backgroundRefreshes: 0,
      totalRequests: 0,
      hitRate: 0,
      currentSize: 0,
      maxSize: this.config.maxSize,
      entryCount: 0,
      averageResponseTime: 0
    };

    this.storage = this.createStorage();
  }

  private createStorage(): ICacheStorage {
    switch (this.config.storage) {
      case 'localStorage':
        {
          const storage = new LocalStorageCacheStorage(this.config.keyPrefix, this.config.maxSize, this.logger);
          storage.setMetadataWriteIntervalMs(this.config.metadataWriteIntervalMs ?? 30000);
          return storage;
        }
      case 'sessionStorage':
        {
          const storage = new SessionStorageCacheStorage(this.config.keyPrefix, this.config.maxSize, this.logger);
          storage.setMetadataWriteIntervalMs(this.config.metadataWriteIntervalMs ?? 30000);
          return storage;
        }
      default:
        return new MemoryCacheStorage(this.config.maxSize);
    }
  }

  /**
   * Generate a cache key from request parameters
   */
  generateKey(cacheKey: CacheKey): string {
    const { method, url, params, data } = cacheKey;
    return canonicalizeKeyParts({
      method: method.toUpperCase(),
      url,
      params: params || {},
      data
    });
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled) return null;

    this.stats.totalRequests++;

    const entry = await this.storage.get<T>(key);
    
    if (entry) {
      this.stats.hits++;
      this.emitEvent('hit', key);
      
      // Check if background refresh should be triggered
      if (this.config.backgroundRefresh && this.shouldBackgroundRefresh(entry)) {
        this.emitEvent('refresh', key, { type: 'background' });
      }
      
      return entry.data;
    } else {
      this.stats.misses++;
      this.emitEvent('miss', key);
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const ttl = options.ttl || this.config.defaultTTL;
      const size = this.calculateSize(data);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        accessCount: 1,
        lastAccess: Date.now(),
        key,
        size
      };

      await this.storage.set(key, entry);
      this.emitEvent('set', key, { size, ttl });

      // Incremental stats update
      const prevSize = this.sizeIndex.get(key) || 0;
      this.sizeIndex.set(key, size);
      this.stats.currentSize += size - prevSize;
      // Update entryCount optimistically
      if (prevSize === 0) {
        this.stats.entryCount += 1;
      }
      // Guard: if storage evicted an entry, resync sizes and counts
      const storageCount = await this.storage.size();
      if (storageCount !== this.sizeIndex.size) {
        await this.resyncStatsFromStorage();
      } else {
        // Maintain maxSize snapshot
        this.stats.maxSize = this.config.maxSize;
      }
    } catch (error) {
      // Silently handle storage errors - cache failure shouldn't break the application
      this.logger.warn('Cache storage error:', error);
      // Emit a set event with error metadata to indicate cache set failure
      this.emitEvent('set', key, { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      });
    }
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
    this.emitEvent('delete', key);
    // Incremental stats update
    const prevSize = this.sizeIndex.get(key) || 0;
    if (prevSize > 0) {
      this.stats.currentSize -= prevSize;
      this.stats.entryCount = Math.max(0, this.stats.entryCount - 1);
      this.sizeIndex.delete(key);
    }
    const storageCount = await this.storage.size();
    if (storageCount !== this.sizeIndex.size) {
      await this.resyncStatsFromStorage();
    }
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    await this.storage.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
    this.stats.backgroundRefreshes = 0;
    this.stats.totalRequests = 0;
    this.stats.entryCount = 0;
    this.stats.currentSize = 0;
  this.sizeIndex.clear();
    this.emitEvent('clear', 'all');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
    return { ...this.stats };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    const oldStorage = this.config.storage;
    this.config = { ...this.config, ...newConfig };
    
    // If storage type changed, recreate storage and clear cache
    if (oldStorage !== this.config.storage) {
      this.storage = this.createStorage();
      this.clear();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Add event listener
   */
  addEventListener(listener: CacheEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: CacheEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Check if entry should trigger background refresh
   */
  private shouldBackgroundRefresh(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    const threshold = entry.ttl * this.config.refreshThreshold;
    return age >= threshold;
  }

  /**
   * Calculate approximate size of data in bytes
   */
  private calculateSize(data: unknown): number {
    const seen = new Set<unknown>();
    const MAX_DEPTH = 2; // guard against deep structures
    const MAX_ENTRIES = 200; // guard against huge collections

    const sizeOf = (value: unknown, depth: number, budget: { entries: number }): number => {
      if (value == null) return 0;
      const t = typeof value;
      if (t === 'string') return (value as string).length * 2; // UTF-16 estimate
      if (t === 'number') return 8;
      if (t === 'boolean') return 4;
      if (t === 'bigint') return 8;
      if (t === 'symbol' || t === 'function') return 0;

      // Typed buffers
      if (value instanceof ArrayBuffer) return value.byteLength;
      if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(value as unknown as ArrayBufferView)) {
        return (value as ArrayBufferView).byteLength;
      }
      // Blob (browser)
      if (typeof Blob !== 'undefined' && value instanceof Blob) return value.size;
      // Date
      if (value instanceof Date) return 8;

      if (seen.has(value)) return 0; // cycle protection
      if (depth >= MAX_DEPTH) return 0;

      seen.add(value);
      let total = 0;
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length && budget.entries > 0; i++) {
          budget.entries--;
          total += sizeOf(value[i], depth + 1, budget);
        }
        return total;
      }

      // Plain object-like
      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length && budget.entries > 0; i++) {
          const k = keys[i];
          budget.entries--;
          // key cost
          total += k.length * 2;
          // value cost
          total += sizeOf(obj[k], depth + 1, budget);
        }
        return total;
      }

      return 0;
    };

    return sizeOf(data, 0, { entries: MAX_ENTRIES });
  }

  /**
   * Update cache statistics
   */
  private async updateStats(): Promise<void> {
    // Fast path: use sizeIndex if counts match storage
    const storageCount = await this.storage.size();
    if (storageCount === this.sizeIndex.size) {
      let total = 0;
      for (const v of this.sizeIndex.values()) total += v;
      this.stats.entryCount = storageCount;
      this.stats.currentSize = total;
      this.stats.maxSize = this.config.maxSize;
      return;
    }
    await this.resyncStatsFromStorage();
  }

  private async resyncStatsFromStorage(): Promise<void> {
    const keys = await this.storage.keys();
    this.sizeIndex.clear();
    let total = 0;
    for (const key of keys) {
      const entry = await this.storage.get(key);
      if (entry) {
        this.sizeIndex.set(key, entry.size);
        total += entry.size;
      }
    }
    this.stats.entryCount = this.sizeIndex.size;
    this.stats.currentSize = total;
    this.stats.maxSize = this.config.maxSize;
  }

  /**
   * Emit cache event
   */
  private emitEvent(type: CacheEventType, key: string, metadata?: Record<string, unknown>): void {
    const event: CacheEvent = {
      type,
      key,
      timestamp: Date.now(),
      metadata
    };

    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        this.logger.warn('Cache event listener error:', error);
      }
    });
  }

  /**
   * Handle background refresh
   */
  async handleBackgroundRefresh<T>(key: string, refreshFn: () => Promise<T>): Promise<void> {
    // Prevent multiple background refreshes for the same key
    if (this.backgroundRefreshPromises.has(key)) {
      return;
    }

    const refreshPromise = (async () => {
      try {
        this.stats.backgroundRefreshes++;
        const freshData = await refreshFn();
        await this.set(key, freshData);
      } catch (error) {
        this.logger.warn('Background refresh failed for key:', key, error);
      } finally {
        this.backgroundRefreshPromises.delete(key);
      }
    })();

    this.backgroundRefreshPromises.set(key, refreshPromise);
  }

  /**
   * Prefetch data and store in cache
   */
  async prefetch<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions = {}): Promise<void> {
    const cachedData = await this.get<T>(key);
    if (!cachedData || options.forceRefresh) {
      const data = await fetchFn();
      await this.set(key, data, options);
    }
  }

  /**
   * Get data with stale-while-revalidate strategy
   */
  async getWithSWR<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    if (options.forceRefresh) {
      // Force refresh - bypass cache completely and fetch fresh data
      const freshData = await fetchFn();
      await this.set(key, freshData, options);
      return freshData;
    }

    const cachedData = await this.get<T>(key);
    
    if (cachedData) {
      // Return cached data and refresh in background if needed
      const entry = await this.storage.get<T>(key);
      if (entry && this.shouldBackgroundRefresh(entry)) {
        this.handleBackgroundRefresh(key, fetchFn);
      }
      return cachedData;
    }
    
    // No cached data, fetch fresh data
    const freshData = await this.getOrFetch(key, fetchFn, options);
    return freshData;
  }

  /**
   * Get data from cache or fetch it, handling concurrent requests
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // First check - if there's already a pending request, return it
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const cachedData = await this.get<T>(key);
    if (cachedData && !options.forceRefresh) {
      return cachedData;
    }

    // Second check after async cache lookup - important for race conditions
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create the request promise and immediately add it to the map
    // This is the critical section that must be atomic
    const requestPromise = fetchFn().then(async (freshData) => {
      try {
        await this.set(key, freshData, options);
      } catch (error) {
        // Cache set failure should not prevent returning the fresh data
        this.logger.warn('Cache set failed:', error);
      }
      return freshData;
    }).finally(() => {
      this.pendingRequests.delete(key);
    });

    // Only set if not already set (this prevents race conditions)
    if (!this.pendingRequests.has(key)) {
      this.pendingRequests.set(key, requestPromise);
      return requestPromise;
    } else {
      return this.pendingRequests.get(key) as Promise<T>;
    }
  }
}
