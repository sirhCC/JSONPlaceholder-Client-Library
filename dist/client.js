"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonPlaceholderClient = void 0;
const axios_1 = __importDefault(require("axios"));
const types_1 = require("./types");
const cache_1 = require("./cache");
const logger_1 = require("./logger");
const performance_1 = require("./performance");
const error_recovery_1 = require("./error-recovery");
const developer_tools_1 = require("./developer-tools");
const defaultApiUrl = 'https://jsonplaceholder.typicode.com';
class JsonPlaceholderClient {
    constructor(baseURL = defaultApiUrl, config) {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.responseErrorInterceptors = [];
        this.client = axios_1.default.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.logger = (0, logger_1.createLogger)(config?.loggerConfig);
        this.cacheManager = new cache_1.CacheManager(config?.cacheConfig, this.logger);
        this.performanceMonitor = new performance_1.PerformanceMonitor(config?.performanceConfig);
        this.performanceDashboard = new performance_1.PerformanceDashboard(this.performanceMonitor);
        this.errorRecoveryManager = new error_recovery_1.ErrorRecoveryManager(config?.errorRecoveryConfig);
        this.errorRecoveryDashboard = new error_recovery_1.ErrorRecoveryDashboard(this.errorRecoveryManager);
        this.developerTools = new developer_tools_1.DeveloperTools({ enabled: false, ...config?.devModeConfig }, this.logger);
        this.setupDefaultInterceptors();
        this.setupPerformanceTracking();
        this.setupDeveloperInstrumentation();
    }
    setupDefaultInterceptors() {
        // Request interceptor to apply all custom request interceptors
        this.client.interceptors.request.use(async (config) => {
            let modifiedConfig = { ...config };
            for (const interceptor of this.requestInterceptors) {
                modifiedConfig = await Promise.resolve(interceptor(modifiedConfig));
            }
            return modifiedConfig;
        });
        // Response interceptor to apply all custom response interceptors
        this.client.interceptors.response.use(async (response) => {
            let modifiedResponse = {
                data: response.data,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                config: response.config
            };
            for (const interceptor of this.responseInterceptors) {
                modifiedResponse = await Promise.resolve(interceptor(modifiedResponse));
            }
            return {
                ...response,
                data: modifiedResponse.data
            };
        }, async (error) => {
            // Apply error interceptors first
            let modifiedError = error;
            for (const interceptor of this.responseErrorInterceptors) {
                try {
                    modifiedError = await Promise.resolve(interceptor(modifiedError));
                    // If interceptor returns a successful response, return it
                    if (modifiedError && !modifiedError.isAxiosError && modifiedError.data !== undefined) {
                        return modifiedError;
                    }
                }
                catch (interceptedError) {
                    modifiedError = interceptedError;
                }
            }
            // Re-throw the error for normal error handling
            throw modifiedError;
        });
    }
    setupPerformanceTracking() {
        // Add performance tracking to all requests
        this.addRequestInterceptor((config) => {
            // Add start time to track request duration
            config.startTime = Date.now();
            return config;
        });
        this.addResponseInterceptor((response) => {
            // Track successful requests
            const startTime = response.config?.startTime || Date.now();
            const duration = Date.now() - startTime;
            this.performanceMonitor.recordMetric({
                timestamp: Date.now(),
                duration,
                method: response.config.method?.toUpperCase() || 'GET',
                url: response.config.url || '',
                cacheHit: false, // Will be updated by cache tracking
                status: response.status,
                size: this.calculateResponseSize(response.data)
            });
            return response;
        }, (error) => {
            // Track failed requests
            const axiosError = error;
            const startTime = axiosError.config?.startTime || Date.now();
            const duration = Date.now() - startTime;
            this.performanceMonitor.recordMetric({
                timestamp: Date.now(),
                duration,
                method: axiosError.config?.method?.toUpperCase() || 'GET',
                url: axiosError.config?.url || '',
                cacheHit: false,
                status: axiosError.response?.status || 0,
                error: axiosError.message
            });
            throw error;
        });
        // Track cache performance
        this.addCacheEventListener((event) => {
            if (event.type === 'hit' || event.type === 'miss') {
                // Update the latest metric to reflect cache hit/miss
                const data = this.performanceMonitor.exportData();
                const latestMetric = data.metrics[data.metrics.length - 1];
                if (latestMetric && Date.now() - latestMetric.timestamp < 1000) {
                    latestMetric.cacheHit = event.type === 'hit';
                }
            }
        });
    }
    setupDeveloperInstrumentation() {
        // Add developer tools request inspection
        this.addRequestInterceptor((config) => {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            config.requestId = requestId;
            this.developerTools.inspectRequest({
                id: requestId,
                method: config.method?.toUpperCase() || 'GET',
                url: config.url || '',
                headers: config.headers || {},
                body: config.data,
                timestamp: Date.now(),
                cacheKey: this.cacheManager.generateKey({
                    method: config.method?.toUpperCase() || 'GET',
                    url: config.url || '',
                    params: config.params,
                    data: config.data
                }),
                expectedResponseTime: 500 // Default estimate
            });
            return config;
        });
        // Add developer tools response inspection
        this.addResponseInterceptor((response) => {
            const config = response.config;
            const requestId = config.requestId || 'unknown';
            const startTime = config.startTime || Date.now();
            this.developerTools.inspectResponse({
                requestId,
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
                body: response.data,
                responseTime: Date.now() - startTime,
                cacheHit: false, // Will be updated by cache events
                timestamp: Date.now(),
                size: this.calculateResponseSize(response.data)
            });
            return response;
        });
        // Network simulation for developer mode
        this.addRequestInterceptor(async (config) => {
            await this.developerTools.simulateNetworkDelay();
            return config;
        });
    }
    calculateResponseSize(data) {
        try {
            return JSON.stringify(data).length;
        }
        catch {
            return 0;
        }
    }
    // Interceptor management methods
    addRequestInterceptor(interceptor) {
        this.requestInterceptors.push(interceptor);
        return this.requestInterceptors.length - 1;
    }
    addResponseInterceptor(onFulfilled, onRejected) {
        if (onFulfilled) {
            this.responseInterceptors.push(onFulfilled);
        }
        if (onRejected) {
            this.responseErrorInterceptors.push(onRejected);
        }
        return Math.max(this.responseInterceptors.length, this.responseErrorInterceptors.length) - 1;
    }
    removeRequestInterceptor(index) {
        if (index >= 0 && index < this.requestInterceptors.length) {
            this.requestInterceptors.splice(index, 1);
        }
    }
    removeResponseInterceptor(index) {
        if (index >= 0 && index < this.responseInterceptors.length) {
            this.responseInterceptors.splice(index, 1);
        }
        if (index >= 0 && index < this.responseErrorInterceptors.length) {
            this.responseErrorInterceptors.splice(index, 1);
        }
    }
    clearInterceptors() {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.responseErrorInterceptors = [];
    }
    // Cache Management Methods
    /**
     * Enable or disable caching
     */
    enableCache(enabled = true) {
        this.cacheManager.updateConfig({ enabled });
    }
    /**
     * Configure cache settings
     */
    configureCaching(config) {
        this.cacheManager.updateConfig(config);
    }
    /**
     * Get cache configuration
     */
    getCacheConfig() {
        return this.cacheManager.getConfig();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cacheManager.getStats();
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        return this.cacheManager.clear();
    }
    /**
     * Delete specific cache entry
     */
    deleteCacheEntry(key) {
        return this.cacheManager.delete(key);
    }
    /**
     * Prefetch data and store in cache
     */
    async prefetchPosts(options = {}) {
        const key = this.cacheManager.generateKey({
            method: 'GET',
            url: '/posts',
            params: {}
        });
        await this.cacheManager.prefetch(key, () => this.client.get('/posts').then(response => response.data), options);
    }
    /**
     * Prefetch user data
     */
    async prefetchUser(userId, options = {}) {
        const key = this.cacheManager.generateKey({
            method: 'GET',
            url: `/users/${userId}`,
            params: {}
        });
        await this.cacheManager.prefetch(key, () => this.client.get(`/users/${userId}`).then(response => response.data), options);
    }
    /**
     * Prefetch comments for a post
     */
    async prefetchComments(postId, options = {}) {
        const key = this.cacheManager.generateKey({
            method: 'GET',
            url: `/posts/${postId}/comments`,
            params: {}
        });
        await this.cacheManager.prefetch(key, () => this.client.get(`/posts/${postId}/comments`).then(response => response.data), options);
    }
    /**
     * Add cache event listener
     */
    addCacheEventListener(listener) {
        this.cacheManager.addEventListener(listener);
    }
    /**
     * Remove cache event listener
     */
    removeCacheEventListener(listener) {
        this.cacheManager.removeEventListener(listener);
    }
    // Performance Monitoring Methods
    /**
     * Get performance statistics
     */
    getPerformanceStats() {
        return this.performanceMonitor.getStats();
    }
    /**
     * Get performance dashboard report
     */
    getPerformanceReport() {
        return this.performanceDashboard.getReport();
    }
    /**
     * Print performance report to console
     */
    printPerformanceReport() {
        this.performanceDashboard.printReport();
    }
    /**
     * Get performance insights
     */
    getPerformanceInsights() {
        return this.performanceDashboard.getInsights();
    }
    /**
     * Print performance insights to console
     */
    printPerformanceInsights() {
        this.performanceDashboard.printInsights();
    }
    /**
     * Add performance event listener
     */
    addPerformanceEventListener(listener) {
        this.performanceMonitor.addEventListener(listener);
    }
    /**
     * Remove performance event listener
     */
    removePerformanceEventListener(listener) {
        this.performanceMonitor.removeEventListener(listener);
    }
    /**
     * Configure performance monitoring
     */
    configurePerformanceMonitoring(config) {
        this.performanceMonitor.updateConfig(config);
    }
    /**
     * Enable/disable performance monitoring
     */
    setPerformanceMonitoringEnabled(enabled) {
        this.performanceMonitor.setEnabled(enabled);
    }
    /**
     * Clear performance data
     */
    clearPerformanceData() {
        this.performanceMonitor.clear();
    }
    /**
     * Export performance data
     */
    exportPerformanceData() {
        const data = this.performanceMonitor.exportData();
        return {
            metrics: data.metrics,
            stats: data.stats
        };
    }
    /**
     * Internal method to handle cached requests
     */
    async handleCachedRequest(cacheKey, requestFn, options = {}) {
        const key = this.cacheManager.generateKey(cacheKey);
        if (options.staleWhileRevalidate) {
            return this.cacheManager.getWithSWR(key, requestFn, options);
        }
        // Use getOrFetch to handle concurrent requests properly
        // Don't catch API errors here, let them bubble up naturally
        return await this.cacheManager.getOrFetch(key, requestFn, options);
    }
    // Utility methods for common interceptors
    addAuthInterceptor(token, type = 'Bearer') {
        return this.addRequestInterceptor((config) => {
            config.headers = config.headers || {};
            if (type === 'Bearer') {
                config.headers.Authorization = `Bearer ${token}`;
            }
            else {
                config.headers['X-API-Key'] = token;
            }
            return config;
        });
    }
    addLoggingInterceptor(logRequests = true, logResponses = true) {
        if (logRequests) {
            this.addRequestInterceptor((config) => {
                // Only log in development mode
                this.logger.debug(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`, {
                    headers: config.headers,
                    data: config.data
                });
                return config;
            });
        }
        if (logResponses) {
            return this.addResponseInterceptor((response) => {
                this.logger.debug(`✅ Response: ${response.status} ${response.config.url}`, {
                    data: response.data
                });
                return response;
            });
        }
        return -1;
    }
    addRetryInterceptor(options = { attempts: 3, delay: 1000 }) {
        return this.addResponseInterceptor(undefined, async (error) => {
            const axiosError = error;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const config = axiosError.config;
            // Don't retry if no config or already exceeded max attempts
            if (!config || (config.__retryCount || 0) >= (options.attempts || 3)) {
                throw error;
            }
            config.__retryCount = (config.__retryCount || 0) + 1;
            const delay = options.exponentialBackoff
                ? (options.delay || 1000) * Math.pow(2, config.__retryCount - 1)
                : (options.delay || 1000);
            if (process.env.NODE_ENV !== 'production') {
                this.logger.info(`⚠️ Retrying request (${config.__retryCount}/${options.attempts}) after ${delay}ms...`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.client.request(config);
        });
    }
    buildQueryString(params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, value.toString());
            }
        });
        return queryParams.toString();
    }
    parsePaginationHeaders(headers, data, options) {
        const total = parseInt(String(headers['x-total-count'] || '0'), 10);
        const page = options._page || 1;
        const limit = options._limit || 10;
        return {
            data,
            pagination: {
                page,
                limit,
                total,
                hasNext: (page * limit) < total,
                hasPrev: page > 1
            }
        };
    }
    handleError(error, context) {
        const status = error.response?.status;
        const responseData = error.response?.data;
        switch (status) {
            case 404:
                if (context?.includes('post')) {
                    const postId = this.extractPostIdFromContext(context);
                    throw new types_1.PostNotFoundError(postId, responseData);
                }
                throw new types_1.ApiClientError('Resource not found', 404, responseData);
            case 400: {
                const validationErrors = this.extractValidationErrors(responseData);
                throw new types_1.ValidationError(responseData?.message || 'Validation failed', validationErrors, responseData);
            }
            case 429: {
                const retryAfter = error.response?.headers?.['retry-after'];
                throw new types_1.RateLimitError(retryAfter ? parseInt(retryAfter) : undefined, responseData);
            }
            case 500:
            case 502:
            case 503:
            case 504:
                throw new types_1.ServerError(responseData?.message || 'Server error occurred', responseData);
            default:
                throw new types_1.ApiClientError(error.message || 'An unexpected error occurred', status || 0, responseData);
        }
    }
    extractPostIdFromContext(context) {
        const match = context.match(/post\/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    extractValidationErrors(responseData) {
        if (typeof responseData === 'object' && responseData !== null) {
            const data = responseData;
            if (data.errors && Array.isArray(data.errors)) {
                return data.errors;
            }
            if (data.message && typeof data.message === 'string') {
                return [data.message];
            }
        }
        return undefined;
    }
    /**
     * Wrapper method that adds error recovery to HTTP requests
     */
    async executeWithErrorRecovery(operation, fallbackOperations = []) {
        return this.errorRecoveryManager.execute(operation, fallbackOperations);
    }
    async getPosts(cacheOptions = {}) {
        try {
            return await this.executeWithErrorRecovery(() => this.handleCachedRequest({
                method: 'GET',
                url: '/posts',
                params: {}
            }, async () => {
                const response = await this.client.get('/posts');
                return response.data;
            }, cacheOptions), 
            // Fallback: try to get stale cache data
            [
                async () => {
                    const key = this.cacheManager.generateKey({ method: 'GET', url: '/posts', params: {} });
                    const cachedData = await this.cacheManager.get(key);
                    if (cachedData) {
                        this.logger.warn('Using stale cache data as fallback for getPosts');
                        return cachedData;
                    }
                    throw new Error('No fallback data available');
                }
            ]);
        }
        catch (error) {
            this.handleError(error, 'posts');
        }
    }
    async getPostsWithPagination(options = {}) {
        try {
            const queryString = this.buildQueryString(options);
            const url = queryString ? `/posts?${queryString}` : '/posts';
            const response = await this.client.get(url);
            return this.parsePaginationHeaders(response.headers, response.data, options);
        }
        catch (error) {
            this.handleError(error, 'posts-paginated');
        }
    }
    async searchPosts(options) {
        try {
            const queryString = this.buildQueryString(options);
            const response = await this.client.get(`/posts?${queryString}`);
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'posts-search');
        }
    }
    async getPostsByUser(userId, options = {}) {
        try {
            const searchOptions = { ...options, userId };
            const queryString = this.buildQueryString(searchOptions);
            const response = await this.client.get(`/posts?${queryString}`);
            return response.data;
        }
        catch (error) {
            this.handleError(error, `posts-by-user-${userId}`);
        }
    }
    async getPost(id, cacheOptions = {}) {
        try {
            return await this.handleCachedRequest({
                method: 'GET',
                url: `/posts/${id}`,
                params: {}
            }, async () => {
                const response = await this.client.get(`/posts/${id}`);
                return response.data;
            }, cacheOptions);
        }
        catch (error) {
            this.handleError(error, `post/${id}`);
        }
    }
    async getComments(postId, cacheOptions = {}) {
        try {
            return await this.handleCachedRequest({
                method: 'GET',
                url: `/posts/${postId}/comments`,
                params: {}
            }, async () => {
                const response = await this.client.get(`/posts/${postId}/comments`);
                return response.data;
            }, cacheOptions);
        }
        catch (error) {
            this.handleError(error, `post/${postId}/comments`);
        }
    }
    async getCommentsWithPagination(options = {}) {
        try {
            const queryString = this.buildQueryString(options);
            const url = queryString ? `/comments?${queryString}` : '/comments';
            const response = await this.client.get(url);
            return this.parsePaginationHeaders(response.headers, response.data, options);
        }
        catch (error) {
            this.handleError(error, 'comments-paginated');
        }
    }
    async searchComments(options) {
        try {
            const queryString = this.buildQueryString(options);
            const response = await this.client.get(`/comments?${queryString}`);
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'comments-search');
        }
    }
    async getCommentsByPost(postId, options = {}) {
        try {
            const searchOptions = { ...options, postId };
            const queryString = this.buildQueryString(searchOptions);
            const response = await this.client.get(`/comments?${queryString}`);
            return response.data;
        }
        catch (error) {
            this.handleError(error, `comments-by-post-${postId}`);
        }
    }
    async getUser(id, cacheOptions = {}) {
        try {
            return await this.handleCachedRequest({
                method: 'GET',
                url: `/users/${id}`,
                params: {}
            }, async () => {
                const response = await this.client.get(`/users/${id}`);
                return response.data;
            }, cacheOptions);
        }
        catch (error) {
            this.handleError(error, `user/${id}`);
        }
    }
    async getUsers(cacheOptions = {}) {
        try {
            return await this.handleCachedRequest({
                method: 'GET',
                url: '/users',
                params: {}
            }, async () => {
                const response = await this.client.get('/users');
                return response.data;
            }, cacheOptions);
        }
        catch (error) {
            this.handleError(error, 'users');
        }
    }
    async getUsersWithPagination(options = {}) {
        try {
            const queryString = this.buildQueryString(options);
            const url = queryString ? `/users?${queryString}` : '/users';
            const response = await this.client.get(url);
            return this.parsePaginationHeaders(response.headers, response.data, options);
        }
        catch (error) {
            this.handleError(error, 'users-paginated');
        }
    }
    async searchUsers(options) {
        try {
            const queryString = this.buildQueryString(options);
            const response = await this.client.get(`/users?${queryString}`);
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'users-search');
        }
    }
    async createPost(postData) {
        try {
            const response = await this.client.post('/posts', postData);
            return response.data;
        }
        catch (error) {
            this.handleError(error, 'create-post');
        }
    }
    async updatePost(id, postData) {
        try {
            const response = await this.client.patch(`/posts/${id}`, postData);
            return response.data;
        }
        catch (error) {
            this.handleError(error, `post/${id}`);
        }
    }
    async deletePost(id) {
        try {
            await this.client.delete(`/posts/${id}`);
        }
        catch (error) {
            this.handleError(error, `post/${id}`);
        }
    }
    // Error Recovery Management Methods
    /**
     * Get circuit breaker statistics
     */
    getCircuitBreakerStats() {
        return this.errorRecoveryManager.getCircuitBreakerStats();
    }
    /**
     * Add event listener for error recovery events
     */
    addErrorRecoveryEventListener(listener) {
        this.errorRecoveryManager.addEventListener(listener);
    }
    /**
     * Remove event listener for error recovery events
     */
    removeErrorRecoveryEventListener(listener) {
        this.errorRecoveryManager.removeEventListener(listener);
    }
    /**
     * Manually open the circuit breaker
     */
    forceCircuitOpen() {
        this.errorRecoveryManager.forceCircuitOpen();
    }
    /**
     * Manually close the circuit breaker
     */
    forceCircuitClose() {
        this.errorRecoveryManager.forceCircuitClose();
    }
    /**
     * Reset error recovery state
     */
    resetErrorRecovery() {
        this.errorRecoveryManager.reset();
    }
    /**
     * Get error recovery configuration
     */
    getErrorRecoveryConfig() {
        return this.errorRecoveryManager.getConfig();
    }
    /**
     * Update error recovery configuration
     */
    updateErrorRecoveryConfig(config) {
        this.errorRecoveryManager.updateConfig(config);
    }
    /**
     * Print error recovery dashboard report
     */
    printErrorRecoveryReport() {
        this.errorRecoveryDashboard.printReport();
    }
    /**
     * Print error recovery insights
     */
    printErrorRecoveryInsights() {
        this.errorRecoveryDashboard.printInsights();
    }
    /**
     * Get error recovery dashboard report as string
     */
    getErrorRecoveryReport() {
        return this.errorRecoveryDashboard.getReport();
    }
    /**
     * Get error recovery insights as array
     */
    getErrorRecoveryInsights() {
        return this.errorRecoveryDashboard.getInsights();
    }
    // Developer Experience Methods
    /**
     * Enable or disable developer mode
     */
    setDeveloperMode(enabled) {
        this.developerTools.updateConfig({ enabled });
    }
    /**
     * Get developer tools debug report
     */
    getDeveloperDebugReport() {
        return this.developerTools.generateDebugReport();
    }
    /**
     * Print developer debug report to console
     */
    printDeveloperDebugReport() {
        this.developerTools.printDebugReport();
    }
    /**
     * Get code examples for common operations
     */
    getCodeExamples() {
        return this.developerTools.getCodeExamples();
    }
    /**
     * Generate a code example for a specific operation
     */
    generateCodeExample(operation) {
        return this.developerTools.generateCodeExample(operation);
    }
    /**
     * Get request inspections (dev mode only)
     */
    getRequestInspections() {
        return this.developerTools.getRequestInspections();
    }
    /**
     * Get response inspections (dev mode only)
     */
    getResponseInspections() {
        return this.developerTools.getResponseInspections();
    }
    /**
     * Export all debug data
     */
    exportDebugData() {
        return this.developerTools.exportDebugData();
    }
    /**
     * Clear all debug data
     */
    clearDebugData() {
        this.developerTools.clearDebugData();
    }
    /**
     * Simulate network conditions for testing (dev mode only)
     */
    simulateNetworkConditions(config) {
        this.developerTools.simulateNetworkConditions({
            enabled: true,
            ...config
        });
    }
    /**
     * Get enhanced error with developer tips
     */
    createDeveloperFriendlyError(message, code, tips = [], examples = []) {
        return new developer_tools_1.DeveloperFriendlyError(message, code, tips, examples);
    }
}
exports.JsonPlaceholderClient = JsonPlaceholderClient;
//# sourceMappingURL=client.js.map