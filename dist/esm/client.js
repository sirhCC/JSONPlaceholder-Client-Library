import axios from 'axios';
import { PostNotFoundError, ValidationError, ServerError, RateLimitError, ApiClientError } from './types';
import { CacheManager } from './cache';
const defaultApiUrl = 'https://jsonplaceholder.typicode.com';
export class JsonPlaceholderClient {
    constructor(baseURL = defaultApiUrl, cacheConfig) {
        this.requestInterceptors = [];
        this.responseInterceptors = [];
        this.responseErrorInterceptors = [];
        this.client = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.cacheManager = new CacheManager(cacheConfig);
        this.setupDefaultInterceptors();
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
                var _a;
                // Only log in development mode
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.log(`🚀 Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`, {
                        headers: config.headers,
                        data: config.data
                    });
                }
                return config;
            });
        }
        if (logResponses) {
            return this.addResponseInterceptor((response) => {
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.log(`✅ Response: ${response.status} ${response.config.url}`, {
                        data: response.data
                    });
                }
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
                // eslint-disable-next-line no-console
                console.log(`⚠️ Retrying request (${config.__retryCount}/${options.attempts}) after ${delay}ms...`);
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
        var _a, _b, _c, _d;
        const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
        const responseData = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data;
        switch (status) {
            case 404:
                if (context === null || context === void 0 ? void 0 : context.includes('post')) {
                    const postId = this.extractPostIdFromContext(context);
                    throw new PostNotFoundError(postId, responseData);
                }
                throw new ApiClientError('Resource not found', 404, responseData);
            case 400: {
                const validationErrors = this.extractValidationErrors(responseData);
                throw new ValidationError((responseData === null || responseData === void 0 ? void 0 : responseData.message) || 'Validation failed', validationErrors, responseData);
            }
            case 429: {
                const retryAfter = (_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.headers) === null || _d === void 0 ? void 0 : _d['retry-after'];
                throw new RateLimitError(retryAfter ? parseInt(retryAfter) : undefined, responseData);
            }
            case 500:
            case 502:
            case 503:
            case 504:
                throw new ServerError((responseData === null || responseData === void 0 ? void 0 : responseData.message) || 'Server error occurred', responseData);
            default:
                throw new ApiClientError(error.message || 'An unexpected error occurred', status || 0, responseData);
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
    async getPosts(cacheOptions = {}) {
        try {
            return await this.handleCachedRequest({
                method: 'GET',
                url: '/posts',
                params: {}
            }, async () => {
                const response = await this.client.get('/posts');
                return response.data;
            }, cacheOptions);
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
}
//# sourceMappingURL=client.js.map