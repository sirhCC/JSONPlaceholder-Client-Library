"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = exports.SessionStorageCacheStorage = exports.LocalStorageCacheStorage = exports.MemoryCacheStorage = void 0;
/**
 * Memory-based cache storage implementation
 */
class MemoryCacheStorage {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    async get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
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
    async set(key, entry) {
        // Evict oldest entries if cache is full
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            await this.evictOldest();
        }
        this.cache.set(key, entry);
    }
    async delete(key) {
        this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
    async keys() {
        return Array.from(this.cache.keys());
    }
    async size() {
        return this.cache.size;
    }
    async evictOldest() {
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
exports.MemoryCacheStorage = MemoryCacheStorage;
/**
 * Browser localStorage-based cache storage implementation
 */
class LocalStorageCacheStorage {
    constructor(keyPrefix = 'jsonph_cache_', maxSize = 100) {
        this.keyPrefix = keyPrefix;
        this.maxSize = maxSize;
    }
    async get(key) {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }
        try {
            const stored = localStorage.getItem(this.keyPrefix + key);
            if (!stored)
                return null;
            const entry = JSON.parse(stored);
            // Check if entry has expired
            if (Date.now() > entry.timestamp + entry.ttl) {
                await this.delete(key);
                return null;
            }
            // Update access statistics
            entry.accessCount++;
            entry.lastAccess = Date.now();
            localStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
            return entry;
        }
        catch (error) {
            console.warn('Failed to read from localStorage cache:', error);
            return null;
        }
    }
    async set(key, entry) {
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
        }
        catch (error) {
            console.warn('Failed to write to localStorage cache:', error);
        }
    }
    async delete(key) {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        localStorage.removeItem(this.keyPrefix + key);
    }
    async clear() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        const keys = await this.keys();
        keys.forEach(key => localStorage.removeItem(this.keyPrefix + key));
    }
    async keys() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return [];
        }
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.keyPrefix)) {
                keys.push(key.substring(this.keyPrefix.length));
            }
        }
        return keys;
    }
    async size() {
        return (await this.keys()).length;
    }
    async evictOldest() {
        const keys = await this.keys();
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const key of keys) {
            try {
                const stored = localStorage.getItem(this.keyPrefix + key);
                if (stored) {
                    const entry = JSON.parse(stored);
                    if (entry.lastAccess < oldestTime) {
                        oldestTime = entry.lastAccess;
                        oldestKey = key;
                    }
                }
            }
            catch (error) {
                // If we can't parse, remove this entry
                await this.delete(key);
            }
        }
        if (oldestKey) {
            await this.delete(oldestKey);
        }
    }
}
exports.LocalStorageCacheStorage = LocalStorageCacheStorage;
/**
 * Browser sessionStorage-based cache storage implementation
 */
class SessionStorageCacheStorage extends LocalStorageCacheStorage {
    async get(key) {
        if (typeof window === 'undefined' || !window.sessionStorage) {
            return null;
        }
        try {
            const stored = sessionStorage.getItem(this.keyPrefix + key);
            if (!stored)
                return null;
            const entry = JSON.parse(stored);
            // Check if entry has expired
            if (Date.now() > entry.timestamp + entry.ttl) {
                await this.delete(key);
                return null;
            }
            // Update access statistics
            entry.accessCount++;
            entry.lastAccess = Date.now();
            sessionStorage.setItem(this.keyPrefix + key, JSON.stringify(entry));
            return entry;
        }
        catch (error) {
            console.warn('Failed to read from sessionStorage cache:', error);
            return null;
        }
    }
    async set(key, entry) {
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
        }
        catch (error) {
            console.warn('Failed to write to sessionStorage cache:', error);
        }
    }
    async delete(key) {
        if (typeof window === 'undefined' || !window.sessionStorage) {
            return;
        }
        sessionStorage.removeItem(this.keyPrefix + key);
    }
    async clear() {
        if (typeof window === 'undefined' || !window.sessionStorage) {
            return;
        }
        const keys = await this.keys();
        keys.forEach(key => sessionStorage.removeItem(this.keyPrefix + key));
    }
    async keys() {
        if (typeof window === 'undefined' || !window.sessionStorage) {
            return [];
        }
        const keys = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(this.keyPrefix)) {
                keys.push(key.substring(this.keyPrefix.length));
            }
        }
        return keys;
    }
    async size() {
        return (await this.keys()).length;
    }
    async evictOldest() {
        const keys = await this.keys();
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const key of keys) {
            try {
                const stored = sessionStorage.getItem(this.keyPrefix + key);
                if (stored) {
                    const entry = JSON.parse(stored);
                    if (entry.lastAccess < oldestTime) {
                        oldestTime = entry.lastAccess;
                        oldestKey = key;
                    }
                }
            }
            catch (error) {
                // If we can't parse, remove this entry
                await this.delete(key);
            }
        }
        if (oldestKey) {
            await this.delete(oldestKey);
        }
    }
}
exports.SessionStorageCacheStorage = SessionStorageCacheStorage;
/**
 * Main cache manager class
 */
class CacheManager {
    constructor(config = {}) {
        this.eventListeners = [];
        this.backgroundRefreshPromises = new Map();
        this.pendingRequests = new Map();
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
    createStorage() {
        switch (this.config.storage) {
            case 'localStorage':
                return new LocalStorageCacheStorage(this.config.keyPrefix, this.config.maxSize);
            case 'sessionStorage':
                return new SessionStorageCacheStorage(this.config.keyPrefix, this.config.maxSize);
            default:
                return new MemoryCacheStorage(this.config.maxSize);
        }
    }
    /**
     * Generate a cache key from request parameters
     */
    generateKey(cacheKey) {
        const { method, url, params, data } = cacheKey;
        const keyParts = [method.toUpperCase(), url];
        if (params && Object.keys(params).length > 0) {
            const sortedParams = Object.keys(params)
                .sort()
                .map(key => `${key}=${JSON.stringify(params[key])}`)
                .join('&');
            keyParts.push(sortedParams);
        }
        if (data) {
            keyParts.push(JSON.stringify(data));
        }
        return keyParts.join('|');
    }
    /**
     * Get data from cache
     */
    async get(key) {
        if (!this.config.enabled)
            return null;
        this.stats.totalRequests++;
        const entry = await this.storage.get(key);
        if (entry) {
            this.stats.hits++;
            this.emitEvent('hit', key);
            // Check if background refresh should be triggered
            if (this.config.backgroundRefresh && this.shouldBackgroundRefresh(entry)) {
                this.emitEvent('refresh', key, { type: 'background' });
            }
            return entry.data;
        }
        else {
            this.stats.misses++;
            this.emitEvent('miss', key);
            return null;
        }
    }
    /**
     * Set data in cache
     */
    async set(key, data, options = {}) {
        if (!this.config.enabled)
            return;
        try {
            const ttl = options.ttl || this.config.defaultTTL;
            const size = this.calculateSize(data);
            const entry = {
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
            // Update stats
            await this.updateStats();
        }
        catch (error) {
            // Silently handle storage errors - cache failure shouldn't break the application
            console.warn('Cache storage error:', error);
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
    async delete(key) {
        await this.storage.delete(key);
        this.emitEvent('delete', key);
        await this.updateStats();
    }
    /**
     * Clear entire cache
     */
    async clear() {
        await this.storage.clear();
        this.stats.hits = 0;
        this.stats.misses = 0;
        this.stats.evictions = 0;
        this.stats.backgroundRefreshes = 0;
        this.stats.totalRequests = 0;
        this.stats.entryCount = 0;
        this.stats.currentSize = 0;
        this.emitEvent('clear', 'all');
    }
    /**
     * Get cache statistics
     */
    getStats() {
        this.stats.hitRate = this.stats.totalRequests > 0
            ? this.stats.hits / this.stats.totalRequests
            : 0;
        return { ...this.stats };
    }
    /**
     * Update cache configuration
     */
    updateConfig(newConfig) {
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
    getConfig() {
        return { ...this.config };
    }
    /**
     * Add event listener
     */
    addEventListener(listener) {
        this.eventListeners.push(listener);
    }
    /**
     * Remove event listener
     */
    removeEventListener(listener) {
        const index = this.eventListeners.indexOf(listener);
        if (index > -1) {
            this.eventListeners.splice(index, 1);
        }
    }
    /**
     * Check if entry should trigger background refresh
     */
    shouldBackgroundRefresh(entry) {
        const age = Date.now() - entry.timestamp;
        const threshold = entry.ttl * this.config.refreshThreshold;
        return age >= threshold;
    }
    /**
     * Calculate approximate size of data in bytes
     */
    calculateSize(data) {
        try {
            return JSON.stringify(data).length * 2; // Rough estimate for UTF-16
        }
        catch (_a) {
            return 0;
        }
    }
    /**
     * Update cache statistics
     */
    async updateStats() {
        this.stats.entryCount = await this.storage.size();
        // Calculate current size (approximate)
        const keys = await this.storage.keys();
        let totalSize = 0;
        for (const key of keys) {
            const entry = await this.storage.get(key);
            if (entry) {
                totalSize += entry.size;
            }
        }
        this.stats.currentSize = totalSize;
        this.stats.maxSize = this.config.maxSize;
    }
    /**
     * Emit cache event
     */
    emitEvent(type, key, metadata) {
        const event = {
            type,
            key,
            timestamp: Date.now(),
            metadata
        };
        this.eventListeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                console.warn('Cache event listener error:', error);
            }
        });
    }
    /**
     * Handle background refresh
     */
    async handleBackgroundRefresh(key, refreshFn) {
        // Prevent multiple background refreshes for the same key
        if (this.backgroundRefreshPromises.has(key)) {
            return;
        }
        const refreshPromise = (async () => {
            try {
                this.stats.backgroundRefreshes++;
                const freshData = await refreshFn();
                await this.set(key, freshData);
            }
            catch (error) {
                console.warn('Background refresh failed for key:', key, error);
            }
            finally {
                this.backgroundRefreshPromises.delete(key);
            }
        })();
        this.backgroundRefreshPromises.set(key, refreshPromise);
    }
    /**
     * Prefetch data and store in cache
     */
    async prefetch(key, fetchFn, options = {}) {
        const cachedData = await this.get(key);
        if (!cachedData || options.forceRefresh) {
            const data = await fetchFn();
            await this.set(key, data, options);
        }
    }
    /**
     * Get data with stale-while-revalidate strategy
     */
    async getWithSWR(key, fetchFn, options = {}) {
        if (options.forceRefresh) {
            // Force refresh - bypass cache completely and fetch fresh data
            const freshData = await fetchFn();
            await this.set(key, freshData, options);
            return freshData;
        }
        const cachedData = await this.get(key);
        if (cachedData) {
            // Return cached data and refresh in background if needed
            const entry = await this.storage.get(key);
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
    async getOrFetch(key, fetchFn, options = {}) {
        // First check - if there's already a pending request, return it
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }
        const cachedData = await this.get(key);
        if (cachedData && !options.forceRefresh) {
            return cachedData;
        }
        // Second check after async cache lookup - important for race conditions
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key);
        }
        // Create the request promise and immediately add it to the map
        // This is the critical section that must be atomic
        const requestPromise = fetchFn().then(async (freshData) => {
            try {
                await this.set(key, freshData, options);
            }
            catch (error) {
                // Cache set failure should not prevent returning the fresh data
                console.warn('Cache set failed:', error);
            }
            return freshData;
        }).finally(() => {
            this.pendingRequests.delete(key);
        });
        // Only set if not already set (this prevents race conditions)
        if (!this.pendingRequests.has(key)) {
            this.pendingRequests.set(key, requestPromise);
            return requestPromise;
        }
        else {
            return this.pendingRequests.get(key);
        }
    }
}
exports.CacheManager = CacheManager;
//# sourceMappingURL=cache.js.map