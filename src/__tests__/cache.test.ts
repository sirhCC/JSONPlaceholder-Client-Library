import { 
  CacheManager, 
  MemoryCacheStorage, 
  LocalStorageCacheStorage, 
  SessionStorageCacheStorage 
} from '../cache';
import { 
  CacheConfig, 
  CacheEntry, 
  CacheOptions, 
  CacheEvent, 
  CacheEventType 
} from '../types';

describe('Cache System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('MemoryCacheStorage', () => {
    let storage: MemoryCacheStorage;

    beforeEach(() => {
      storage = new MemoryCacheStorage(3); // Small size for testing eviction
    });

    test('should store and retrieve cache entries', async () => {
      const entry: CacheEntry<string> = {
        data: 'test data',
        timestamp: Date.now(),
        ttl: 5000,
        accessCount: 1,
        lastAccess: Date.now(),
        key: 'test-key',
        size: 9
      };

      await storage.set('test-key', entry);
      const retrieved = await storage.get<string>('test-key');
      
      expect(retrieved).toBeTruthy();
      expect(retrieved!.data).toBe('test data');
      expect(retrieved!.accessCount).toBe(2); // Incremented on access
    });

    test('should return null for expired entries', async () => {
      const expiredEntry: CacheEntry<string> = {
        data: 'expired data',
        timestamp: Date.now() - 10000,
        ttl: 5000, // 5 seconds TTL, but created 10 seconds ago
        accessCount: 1,
        lastAccess: Date.now() - 10000,
        key: 'expired-key',
        size: 12
      };

      await storage.set('expired-key', expiredEntry);
      const retrieved = await storage.get<string>('expired-key');
      
      expect(retrieved).toBeNull();
    });

    test('should evict oldest entries when cache is full', async () => {
      const entry1: CacheEntry<string> = {
        data: 'data1',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now() - 1000,
        key: 'key1',
        size: 5
      };

      const entry2: CacheEntry<string> = {
        data: 'data2',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now() - 500,
        key: 'key2',
        size: 5
      };

      const entry3: CacheEntry<string> = {
        data: 'data3',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now(),
        key: 'key3',
        size: 5
      };

      const entry4: CacheEntry<string> = {
        data: 'data4',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now(),
        key: 'key4',
        size: 5
      };

      await storage.set('key1', entry1);
      await storage.set('key2', entry2);
      await storage.set('key3', entry3);
      
      expect(await storage.size()).toBe(3);
      
      // Adding a 4th entry should evict the oldest (key1)
      await storage.set('key4', entry4);
      
      expect(await storage.size()).toBe(3);
      expect(await storage.get('key1')).toBeNull();
      expect(await storage.get('key4')).toBeTruthy();
    });

    test('should clear all entries', async () => {
      const entry: CacheEntry<string> = {
        data: 'test',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now(),
        key: 'test',
        size: 4
      };

      await storage.set('test', entry);
      expect(await storage.size()).toBe(1);
      
      await storage.clear();
      expect(await storage.size()).toBe(0);
    });
  });

  describe('CacheManager', () => {
    let cacheManager: CacheManager;
    let eventHandler: jest.Mock;

    beforeEach(() => {
      const config: Partial<CacheConfig> = {
        enabled: true,
        defaultTTL: 5000,
        maxSize: 10,
        storage: 'memory',
        backgroundRefresh: true,
        refreshThreshold: 0.8
      };
      
      cacheManager = new CacheManager(config);
      eventHandler = jest.fn();
      cacheManager.addEventListener(eventHandler);
    });

    test('should generate consistent cache keys', () => {
      const key1 = cacheManager.generateKey({
        method: 'GET',
        url: '/api/posts',
        params: { userId: 1, page: 2 }
      });

      const key2 = cacheManager.generateKey({
        method: 'GET',
        url: '/api/posts',
        params: { page: 2, userId: 1 } // Different order
      });

      expect(key1).toBe(key2); // Should be the same due to sorted params
    });

    test('should handle cache set and get operations', async () => {
      const data = { id: 1, title: 'Test Post' };
      
      await cacheManager.set('test-key', data);
      const retrieved = await cacheManager.get('test-key');
      
      expect(retrieved).toEqual(data);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'set',
          key: 'test-key'
        })
      );
    });

    test('should emit hit and miss events', async () => {
      const data = { id: 1, title: 'Test Post' };
      
      // First access should be a miss
      const miss = await cacheManager.get('nonexistent-key');
      expect(miss).toBeNull();
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'miss',
          key: 'nonexistent-key'
        })
      );

      // Set data
      await cacheManager.set('test-key', data);
      
      // Second access should be a hit
      const hit = await cacheManager.get('test-key');
      expect(hit).toEqual(data);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'hit',
          key: 'test-key'
        })
      );
    });

    test('should handle stale-while-revalidate strategy', async () => {
      const initialData = { id: 1, title: 'Initial' };
      const updatedData = { id: 1, title: 'Updated' };
      
      let callCount = 0;
      const fetchFn = jest.fn(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? initialData : updatedData);
      });

      // First call should fetch and cache data
      const result1 = await cacheManager.getWithSWR('test-key', fetchFn);
      expect(result1).toEqual(initialData);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second call should return cached data without fetching
      const result2 = await cacheManager.getWithSWR('test-key', fetchFn);
      expect(result2).toEqual(initialData);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('should handle prefetch operations', async () => {
      const data = { id: 1, title: 'Prefetched' };
      const fetchFn = jest.fn(() => Promise.resolve(data));

      await cacheManager.prefetch('prefetch-key', fetchFn);
      
      const cached = await cacheManager.get('prefetch-key');
      expect(cached).toEqual(data);
      expect(fetchFn).toHaveBeenCalledTimes(1);

      // Second prefetch should not fetch again
      await cacheManager.prefetch('prefetch-key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    test('should handle force refresh', async () => {
      const initialData = { id: 1, title: 'Initial' };
      const updatedData = { id: 1, title: 'Updated' };
      
      let callCount = 0;
      const fetchFn = jest.fn(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? initialData : updatedData);
      });

      // First call to cache initial data
      await cacheManager.getWithSWR('test-key', fetchFn);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      
      // Force refresh should fetch new data (second call returns updated data)
      const result = await cacheManager.getWithSWR('test-key', fetchFn, { forceRefresh: true });
      expect(result).toEqual(updatedData);
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    test('should track cache statistics', async () => {
      const data = { id: 1, title: 'Test' };
      
      // Initially all stats should be 0
      let stats = cacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalRequests).toBe(0);

      // Miss should increment counters
      await cacheManager.get('nonexistent');
      stats = cacheManager.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.totalRequests).toBe(1);
      expect(stats.hitRate).toBe(0);

      // Set and hit should increment hit counter
      await cacheManager.set('test-key', data);
      await cacheManager.get('test-key');
      stats = cacheManager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.totalRequests).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    test('should clear cache and reset stats', async () => {
      const data = { id: 1, title: 'Test' };
      
      await cacheManager.set('test-key', data);
      await cacheManager.get('test-key');
      
      let stats = cacheManager.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      
      await cacheManager.clear();
      
      stats = cacheManager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.totalRequests).toBe(0);
      
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'clear',
          key: 'all'
        })
      );
    });

    test('should handle cache configuration updates', () => {
      const newConfig = {
        defaultTTL: 10000,
        maxSize: 20,
        backgroundRefresh: false
      };

      cacheManager.updateConfig(newConfig);
      const config = cacheManager.getConfig();
      
      expect(config.defaultTTL).toBe(10000);
      expect(config.maxSize).toBe(20);
      expect(config.backgroundRefresh).toBe(false);
    });

    test('should handle disabled cache', async () => {
      cacheManager.updateConfig({ enabled: false });
      
      const data = { id: 1, title: 'Test' };
      await cacheManager.set('test-key', data);
      const retrieved = await cacheManager.get('test-key');
      
      expect(retrieved).toBeNull();
    });
  });

  describe('LocalStorageCacheStorage', () => {
    let storage: LocalStorageCacheStorage;

    beforeEach(() => {
      storage = new LocalStorageCacheStorage('test_cache_', 3);
    });

    test('should store and retrieve from localStorage', async () => {
      const entry: CacheEntry<string> = {
        data: 'test data',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now(),
        key: 'test-key',
        size: 9
      };

      await storage.set('test-key', entry);
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'test_cache_test-key',
        JSON.stringify(entry)
      );

      const retrieved = await storage.get<string>('test-key');
      expect(window.localStorage.getItem).toHaveBeenCalledWith('test_cache_test-key');
    });
  });

  describe('SessionStorageCacheStorage', () => {
    let storage: SessionStorageCacheStorage;

    beforeEach(() => {
      storage = new SessionStorageCacheStorage('test_session_', 3);
    });

    test('should store and retrieve from sessionStorage', async () => {
      const entry: CacheEntry<string> = {
        data: 'test data',
        timestamp: Date.now(),
        ttl: 60000,
        accessCount: 1,
        lastAccess: Date.now(),
        key: 'test-key',
        size: 9
      };

      await storage.set('test-key', entry);
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'test_session_test-key',
        JSON.stringify(entry)
      );

      const retrieved = await storage.get<string>('test-key');
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith('test_session_test-key');
    });
  });

  describe('Background Refresh', () => {
    let cacheManager: CacheManager;

    beforeEach(() => {
      cacheManager = new CacheManager({
        enabled: true,
        defaultTTL: 1000, // 1 second for fast testing
        backgroundRefresh: true,
        refreshThreshold: 0.5 // Refresh after 50% of TTL
      });
    });

    test('should trigger background refresh when threshold is reached', async () => {
      const initialData = { id: 1, title: 'Initial' };
      const refreshedData = { id: 1, title: 'Refreshed' };
      
      let callCount = 0;
      const fetchFn = jest.fn(() => {
        callCount++;
        return Promise.resolve(callCount === 1 ? initialData : refreshedData);
      });

      // Initial fetch and cache
      const result1 = await cacheManager.getWithSWR('test-key', fetchFn);
      expect(result1).toEqual(initialData);

      // Wait for threshold to be reached (500ms for 50% of 1000ms TTL)
      await new Promise(resolve => setTimeout(resolve, 600));

      // This should return cached data but trigger background refresh
      const result2 = await cacheManager.getWithSWR('test-key', fetchFn);
      expect(result2).toEqual(initialData); // Still returns cached data

      // Wait for background refresh to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now should have refreshed data
      const result3 = await cacheManager.get('test-key');
      expect(result3).toEqual(refreshedData);
    });
  });
});
