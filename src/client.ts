import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  Post, 
  Comment, 
  User, 
  PostNotFoundError, 
  ValidationError, 
  ServerError, 
  RateLimitError, 
  ApiClientError,
  PostSearchOptions,
  CommentSearchOptions,
  UserSearchOptions,
  PaginatedResponse,
  PaginationOptions,
  RequestInterceptor,
  ResponseInterceptor,
  ResponseErrorInterceptor,
  RequestConfig,
  ResponseData,
  InterceptorOptions,
  CacheConfig,
  CacheOptions,
  CacheStats,
  CacheKey,
  CacheEvent,
  ILogger,
  LoggerConfig
} from './types';
import { CacheManager } from './cache';
import { createLogger } from './logger';
import { 
  PerformanceMonitor, 
  PerformanceDashboard, 
  PerformanceStats, 
  PerformanceConfig, 
  PerformanceEventListener,
  PerformanceMetric
} from './performance';
import {
  ErrorRecoveryManager,
  ErrorRecoveryDashboard,
  ErrorRecoveryConfig,
  ErrorRecoveryEventListener,
  CircuitBreakerStats
} from './error-recovery';

const defaultApiUrl = 'https://jsonplaceholder.typicode.com';

export interface ClientConfig {
  cacheConfig?: Partial<CacheConfig>;
  loggerConfig?: Partial<LoggerConfig> | ILogger;
  performanceConfig?: Partial<PerformanceConfig>;
  errorRecoveryConfig?: Partial<ErrorRecoveryConfig>;
}

export class JsonPlaceholderClient {
  client: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private responseErrorInterceptors: ResponseErrorInterceptor[] = [];
  private cacheManager: CacheManager;
  private logger: ILogger;
  private performanceMonitor: PerformanceMonitor;
  private performanceDashboard: PerformanceDashboard;
  private errorRecoveryManager: ErrorRecoveryManager;
  private errorRecoveryDashboard: ErrorRecoveryDashboard;

  constructor(baseURL: string = defaultApiUrl, config?: ClientConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger = createLogger(config?.loggerConfig);
    this.cacheManager = new CacheManager(config?.cacheConfig, this.logger);
    this.performanceMonitor = new PerformanceMonitor(config?.performanceConfig);
    this.performanceDashboard = new PerformanceDashboard(this.performanceMonitor);
    this.errorRecoveryManager = new ErrorRecoveryManager(config?.errorRecoveryConfig);
    this.errorRecoveryDashboard = new ErrorRecoveryDashboard(this.errorRecoveryManager);
    this.setupDefaultInterceptors();
    this.setupPerformanceTracking();
  }

  private setupDefaultInterceptors(): void {
    // Request interceptor to apply all custom request interceptors
    this.client.interceptors.request.use(async (config) => {
      let modifiedConfig = { ...config } as RequestConfig;
      
      for (const interceptor of this.requestInterceptors) {
        modifiedConfig = await Promise.resolve(interceptor(modifiedConfig));
      }
      
      return modifiedConfig as InternalAxiosRequestConfig;
    });

    // Response interceptor to apply all custom response interceptors
    this.client.interceptors.response.use(
      async (response: AxiosResponse) => {
        let modifiedResponse: ResponseData = {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
          config: response.config as RequestConfig
        };

        for (const interceptor of this.responseInterceptors) {
          modifiedResponse = await Promise.resolve(interceptor(modifiedResponse));
        }

        return {
          ...response,
          data: modifiedResponse.data
        };
      },
      async (error) => {
        // Apply error interceptors first
        let modifiedError = error;
        for (const interceptor of this.responseErrorInterceptors) {
          try {
            modifiedError = await Promise.resolve(interceptor(modifiedError));
            // If interceptor returns a successful response, return it
            if (modifiedError && !modifiedError.isAxiosError && modifiedError.data !== undefined) {
              return modifiedError;
            }
          } catch (interceptedError) {
            modifiedError = interceptedError;
          }
        }

        // Re-throw the error for normal error handling
        throw modifiedError;
      }
    );
  }

  private setupPerformanceTracking(): void {
    // Add performance tracking to all requests
    this.addRequestInterceptor((config) => {
      // Add start time to track request duration
      (config as RequestConfig & { startTime?: number }).startTime = Date.now();
      return config;
    });

    this.addResponseInterceptor(
      (response) => {
        // Track successful requests
        const startTime = (response.config as RequestConfig & { startTime?: number })?.startTime || Date.now();
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
      },
      (error) => {
        // Track failed requests
        const axiosError = error as AxiosError;
        const startTime = (axiosError.config as RequestConfig & { startTime?: number })?.startTime || Date.now();
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
      }
    );

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

  private calculateResponseSize(data: unknown): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
    }
  }

  // Interceptor management methods
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.requestInterceptors.push(interceptor);
    return this.requestInterceptors.length - 1;
  }

  addResponseInterceptor(
    onFulfilled?: ResponseInterceptor,
    onRejected?: ResponseErrorInterceptor
  ): number {
    if (onFulfilled) {
      this.responseInterceptors.push(onFulfilled);
    }
    if (onRejected) {
      this.responseErrorInterceptors.push(onRejected);
    }
    return Math.max(this.responseInterceptors.length, this.responseErrorInterceptors.length) - 1;
  }

  removeRequestInterceptor(index: number): void {
    if (index >= 0 && index < this.requestInterceptors.length) {
      this.requestInterceptors.splice(index, 1);
    }
  }

  removeResponseInterceptor(index: number): void {
    if (index >= 0 && index < this.responseInterceptors.length) {
      this.responseInterceptors.splice(index, 1);
    }
    if (index >= 0 && index < this.responseErrorInterceptors.length) {
      this.responseErrorInterceptors.splice(index, 1);
    }
  }

  clearInterceptors(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.responseErrorInterceptors = [];
  }

  // Cache Management Methods
  
  /**
   * Enable or disable caching
   */
  enableCache(enabled: boolean = true): void {
    this.cacheManager.updateConfig({ enabled });
  }

  /**
   * Configure cache settings
   */
  configureCaching(config: Partial<CacheConfig>): void {
    this.cacheManager.updateConfig(config);
  }

  /**
   * Get cache configuration
   */
  getCacheConfig(): CacheConfig {
    return this.cacheManager.getConfig();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return this.cacheManager.getStats();
  }

  /**
   * Clear all cached data
   */
  clearCache(): Promise<void> {
    return this.cacheManager.clear();
  }

  /**
   * Delete specific cache entry
   */
  deleteCacheEntry(key: string): Promise<void> {
    return this.cacheManager.delete(key);
  }

  /**
   * Prefetch data and store in cache
   */
  async prefetchPosts(options: CacheOptions = {}): Promise<void> {
    const key = this.cacheManager.generateKey({
      method: 'GET',
      url: '/posts',
      params: {}
    });

    await this.cacheManager.prefetch(
      key,
      () => this.client.get('/posts').then(response => response.data),
      options
    );
  }

  /**
   * Prefetch user data
   */
  async prefetchUser(userId: number, options: CacheOptions = {}): Promise<void> {
    const key = this.cacheManager.generateKey({
      method: 'GET',
      url: `/users/${userId}`,
      params: {}
    });

    await this.cacheManager.prefetch(
      key,
      () => this.client.get(`/users/${userId}`).then(response => response.data),
      options
    );
  }

  /**
   * Prefetch comments for a post
   */
  async prefetchComments(postId: number, options: CacheOptions = {}): Promise<void> {
    const key = this.cacheManager.generateKey({
      method: 'GET',
      url: `/posts/${postId}/comments`,
      params: {}
    });

    await this.cacheManager.prefetch(
      key,
      () => this.client.get(`/posts/${postId}/comments`).then(response => response.data),
      options
    );
  }

  /**
   * Add cache event listener
   */
  addCacheEventListener(listener: (event: CacheEvent) => void): void {
    this.cacheManager.addEventListener(listener);
  }

  /**
   * Remove cache event listener
   */
  removeCacheEventListener(listener: (event: CacheEvent) => void): void {
    this.cacheManager.removeEventListener(listener);
  }

  // Performance Monitoring Methods

  /**
   * Get performance statistics
   */
  getPerformanceStats(): PerformanceStats {
    return this.performanceMonitor.getStats();
  }

  /**
   * Get performance dashboard report
   */
  getPerformanceReport(): string {
    return this.performanceDashboard.getReport();
  }

  /**
   * Print performance report to console
   */
  printPerformanceReport(): void {
    this.performanceDashboard.printReport();
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): string[] {
    return this.performanceDashboard.getInsights();
  }

  /**
   * Print performance insights to console
   */
  printPerformanceInsights(): void {
    this.performanceDashboard.printInsights();
  }

  /**
   * Add performance event listener
   */
  addPerformanceEventListener(listener: PerformanceEventListener): void {
    this.performanceMonitor.addEventListener(listener);
  }

  /**
   * Remove performance event listener
   */
  removePerformanceEventListener(listener: PerformanceEventListener): void {
    this.performanceMonitor.removeEventListener(listener);
  }

  /**
   * Configure performance monitoring
   */
  configurePerformanceMonitoring(config: Partial<PerformanceConfig>): void {
    this.performanceMonitor.updateConfig(config);
  }

  /**
   * Enable/disable performance monitoring
   */
  setPerformanceMonitoringEnabled(enabled: boolean): void {
    this.performanceMonitor.setEnabled(enabled);
  }

  /**
   * Clear performance data
   */
  clearPerformanceData(): void {
    this.performanceMonitor.clear();
  }

  /**
   * Export performance data
   */
  exportPerformanceData(): {
    metrics: PerformanceMetric[];
    stats: PerformanceStats;
  } {
    const data = this.performanceMonitor.exportData();
    return {
      metrics: data.metrics,
      stats: data.stats
    };
  }

  /**
   * Internal method to handle cached requests
   */
  private async handleCachedRequest<T>(
    cacheKey: CacheKey,
    requestFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const key = this.cacheManager.generateKey(cacheKey);

    if (options.staleWhileRevalidate) {
      return this.cacheManager.getWithSWR(key, requestFn, options);
    }

    // Use getOrFetch to handle concurrent requests properly
    // Don't catch API errors here, let them bubble up naturally
    return await this.cacheManager.getOrFetch(key, requestFn, options);
  }

  // Utility methods for common interceptors
  addAuthInterceptor(token: string, type: 'Bearer' | 'API-Key' = 'Bearer'): number {
    return this.addRequestInterceptor((config) => {
      config.headers = config.headers || {};
      if (type === 'Bearer') {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        config.headers['X-API-Key'] = token;
      }
      return config;
    });
  }

  addLoggingInterceptor(logRequests = true, logResponses = true): number {
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

  addRetryInterceptor(options: InterceptorOptions['retry'] = { attempts: 3, delay: 1000 }): number {
    return this.addResponseInterceptor(
      undefined,
      async (error) => {
        const axiosError = error as AxiosError;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const config = axiosError.config as any;
        
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
      }
    );
  }

  private buildQueryString(params: PostSearchOptions | CommentSearchOptions | UserSearchOptions): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  }

  private parsePaginationHeaders<T>(headers: Record<string, unknown>, data: T[], options: PaginationOptions): PaginatedResponse<T> {
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

  private handleError(error: AxiosError, context?: string): never {
    const status = error.response?.status;
    const responseData = error.response?.data;
    
    switch (status) {
      case 404:
        if (context?.includes('post')) {
          const postId = this.extractPostIdFromContext(context);
          throw new PostNotFoundError(postId, responseData);
        }
        throw new ApiClientError('Resource not found', 404, responseData);
      
      case 400: {
        const validationErrors = this.extractValidationErrors(responseData);
        throw new ValidationError(
          (responseData as { message?: string })?.message || 'Validation failed',
          validationErrors,
          responseData
        );
      }
      
      case 429: {
        const retryAfter = error.response?.headers?.['retry-after'];
        throw new RateLimitError(retryAfter ? parseInt(retryAfter) : undefined, responseData);
      }
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(
          (responseData as { message?: string })?.message || 'Server error occurred',
          responseData
        );
      
      default:
        throw new ApiClientError(
          error.message || 'An unexpected error occurred',
          status || 0,
          responseData
        );
    }
  }

  private extractPostIdFromContext(context: string): number {
    const match = context.match(/post\/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private extractValidationErrors(responseData: unknown): string[] | undefined {
    if (typeof responseData === 'object' && responseData !== null) {
      const data = responseData as Record<string, unknown>;
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
  private async executeWithErrorRecovery<T>(
    operation: () => Promise<T>,
    fallbackOperations: (() => Promise<T>)[] = []
  ): Promise<T> {
    return this.errorRecoveryManager.execute(operation, fallbackOperations);
  }

  async getPosts(cacheOptions: CacheOptions = {}): Promise<Post[]> {
    try {
      return await this.executeWithErrorRecovery<Post[]>(
        () => this.handleCachedRequest(
          {
            method: 'GET',
            url: '/posts',
            params: {}
          },
          async () => {
            const response = await this.client.get<Post[]>('/posts');
            return response.data;
          },
          cacheOptions
        ),
        // Fallback: try to get stale cache data
        [
          async () => {
            const key = this.cacheManager.generateKey({ method: 'GET', url: '/posts', params: {} });
            const cachedData = await this.cacheManager.get(key) as Post[];
            if (cachedData) {
              this.logger.warn('Using stale cache data as fallback for getPosts');
              return cachedData;
            }
            throw new Error('No fallback data available');
          }
        ]
      );
    } catch (error) {
      this.handleError(error as AxiosError, 'posts');
    }
  }

  async getPostsWithPagination(options: PostSearchOptions = {}): Promise<PaginatedResponse<Post>> {
    try {
      const queryString = this.buildQueryString(options);
      const url = queryString ? `/posts?${queryString}` : '/posts';
      const response = await this.client.get<Post[]>(url);
      
      return this.parsePaginationHeaders(response.headers, response.data, options);
    } catch (error) {
      this.handleError(error as AxiosError, 'posts-paginated');
    }
  }

  async searchPosts(options: PostSearchOptions): Promise<Post[]> {
    try {
      const queryString = this.buildQueryString(options);
      const response = await this.client.get<Post[]>(`/posts?${queryString}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'posts-search');
    }
  }

  async getPostsByUser(userId: number, options: PostSearchOptions = {}): Promise<Post[]> {
    try {
      const searchOptions = { ...options, userId };
      const queryString = this.buildQueryString(searchOptions);
      const response = await this.client.get<Post[]>(`/posts?${queryString}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, `posts-by-user-${userId}`);
    }
  }

  async getPost(id: number, cacheOptions: CacheOptions = {}): Promise<Post> {
    try {
      return await this.handleCachedRequest(
        {
          method: 'GET',
          url: `/posts/${id}`,
          params: {}
        },
        async () => {
          const response = await this.client.get<Post>(`/posts/${id}`);
          return response.data;
        },
        cacheOptions
      );
    } catch (error) {
      this.handleError(error as AxiosError, `post/${id}`);
    }
  }

  async getComments(postId: number, cacheOptions: CacheOptions = {}): Promise<Comment[]> {
    try {
      return await this.handleCachedRequest(
        {
          method: 'GET',
          url: `/posts/${postId}/comments`,
          params: {}
        },
        async () => {
          const response = await this.client.get<Comment[]>(`/posts/${postId}/comments`);
          return response.data;
        },
        cacheOptions
      );
    } catch (error) {
      this.handleError(error as AxiosError, `post/${postId}/comments`);
    }
  }

  async getCommentsWithPagination(options: CommentSearchOptions = {}): Promise<PaginatedResponse<Comment>> {
    try {
      const queryString = this.buildQueryString(options);
      const url = queryString ? `/comments?${queryString}` : '/comments';
      const response = await this.client.get<Comment[]>(url);
      
      return this.parsePaginationHeaders(response.headers, response.data, options);
    } catch (error) {
      this.handleError(error as AxiosError, 'comments-paginated');
    }
  }

  async searchComments(options: CommentSearchOptions): Promise<Comment[]> {
    try {
      const queryString = this.buildQueryString(options);
      const response = await this.client.get<Comment[]>(`/comments?${queryString}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'comments-search');
    }
  }

  async getCommentsByPost(postId: number, options: CommentSearchOptions = {}): Promise<Comment[]> {
    try {
      const searchOptions = { ...options, postId };
      const queryString = this.buildQueryString(searchOptions);
      const response = await this.client.get<Comment[]>(`/comments?${queryString}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, `comments-by-post-${postId}`);
    }
  }

  async getUser(id: number, cacheOptions: CacheOptions = {}): Promise<User> {
    try {
      return await this.handleCachedRequest(
        {
          method: 'GET',
          url: `/users/${id}`,
          params: {}
        },
        async () => {
          const response = await this.client.get<User>(`/users/${id}`);
          return response.data;
        },
        cacheOptions
      );
    } catch (error) {
      this.handleError(error as AxiosError, `user/${id}`);
    }
  }

  async getUsers(cacheOptions: CacheOptions = {}): Promise<User[]> {
    try {
      return await this.handleCachedRequest(
        {
          method: 'GET',
          url: '/users',
          params: {}
        },
        async () => {
          const response = await this.client.get<User[]>('/users');
          return response.data;
        },
        cacheOptions
      );
    } catch (error) {
      this.handleError(error as AxiosError, 'users');
    }
  }

  async getUsersWithPagination(options: UserSearchOptions = {}): Promise<PaginatedResponse<User>> {
    try {
      const queryString = this.buildQueryString(options);
      const url = queryString ? `/users?${queryString}` : '/users';
      const response = await this.client.get<User[]>(url);
      
      return this.parsePaginationHeaders(response.headers, response.data, options);
    } catch (error) {
      this.handleError(error as AxiosError, 'users-paginated');
    }
  }

  async searchUsers(options: UserSearchOptions): Promise<User[]> {
    try {
      const queryString = this.buildQueryString(options);
      const response = await this.client.get<User[]>(`/users?${queryString}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'users-search');
    }
  }

  async createPost(postData: Omit<Post, 'id'>): Promise<Post> {
    try {
      const response = await this.client.post<Post>('/posts', postData);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'create-post');
    }
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post> {
    try {
      const response = await this.client.patch<Post>(`/posts/${id}`, postData);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, `post/${id}`);
    }
  }

  async deletePost(id: number): Promise<void> {
    try {
      await this.client.delete(`/posts/${id}`);
    } catch (error) {
      this.handleError(error as AxiosError, `post/${id}`);
    }
  }

  // Error Recovery Management Methods
  
  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats(): CircuitBreakerStats {
    return this.errorRecoveryManager.getCircuitBreakerStats();
  }

  /**
   * Add event listener for error recovery events
   */
  addErrorRecoveryEventListener(listener: ErrorRecoveryEventListener): void {
    this.errorRecoveryManager.addEventListener(listener);
  }

  /**
   * Remove event listener for error recovery events
   */
  removeErrorRecoveryEventListener(listener: ErrorRecoveryEventListener): void {
    this.errorRecoveryManager.removeEventListener(listener);
  }

  /**
   * Manually open the circuit breaker
   */
  forceCircuitOpen(): void {
    this.errorRecoveryManager.forceCircuitOpen();
  }

  /**
   * Manually close the circuit breaker
   */
  forceCircuitClose(): void {
    this.errorRecoveryManager.forceCircuitClose();
  }

  /**
   * Reset error recovery state
   */
  resetErrorRecovery(): void {
    this.errorRecoveryManager.reset();
  }

  /**
   * Get error recovery configuration
   */
  getErrorRecoveryConfig(): ErrorRecoveryConfig {
    return this.errorRecoveryManager.getConfig();
  }

  /**
   * Update error recovery configuration
   */
  updateErrorRecoveryConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.errorRecoveryManager.updateConfig(config);
  }

  /**
   * Print error recovery dashboard report
   */
  printErrorRecoveryReport(): void {
    this.errorRecoveryDashboard.printReport();
  }

  /**
   * Print error recovery insights
   */
  printErrorRecoveryInsights(): void {
    this.errorRecoveryDashboard.printInsights();
  }

  /**
   * Get error recovery dashboard report as string
   */
  getErrorRecoveryReport(): string {
    return this.errorRecoveryDashboard.getReport();
  }

  /**
   * Get error recovery insights as array
   */
  getErrorRecoveryInsights(): string[] {
    return this.errorRecoveryDashboard.getInsights();
  }
}
