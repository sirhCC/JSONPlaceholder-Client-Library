import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
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
  CacheKey
} from './types';
import { CacheManager } from './cache';

const defaultApiUrl = 'https://jsonplaceholder.typicode.com';

export class JsonPlaceholderClient {
  client: AxiosInstance;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private responseErrorInterceptors: ResponseErrorInterceptor[] = [];
  private cacheManager: CacheManager;

  constructor(baseURL: string = defaultApiUrl, cacheConfig?: Partial<CacheConfig>) {
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

  private setupDefaultInterceptors(): void {
    // Request interceptor to apply all custom request interceptors
    this.client.interceptors.request.use(async (config) => {
      let modifiedConfig = { ...config } as RequestConfig;
      
      for (const interceptor of this.requestInterceptors) {
        modifiedConfig = await Promise.resolve(interceptor(modifiedConfig));
      }
      
      return modifiedConfig as AxiosRequestConfig;
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
        console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });
        return config;
      });
    }

    if (logResponses) {
      return this.addResponseInterceptor((response) => {
        console.log(`✅ Response: ${response.status} ${response.config.url}`, {
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
        const config = error.config;
        
        // Don't retry if no config or already exceeded max attempts
        if (!config || (config.__retryCount || 0) >= (options.attempts || 3)) {
          throw error;
        }

        config.__retryCount = (config.__retryCount || 0) + 1;

        const delay = options.exponentialBackoff 
          ? (options.delay || 1000) * Math.pow(2, config.__retryCount - 1)
          : (options.delay || 1000);

        console.log(`⚠️ Retrying request (${config.__retryCount}/${options.attempts}) after ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.client.request(config);
      }
    );
  }

  private buildQueryString(params: Record<string, any>): string {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    
    return queryParams.toString();
  }

  private parsePaginationHeaders<T>(headers: any, data: T[], options: PaginationOptions): PaginatedResponse<T> {
    const total = parseInt(headers['x-total-count'] || '0', 10);
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
      
      case 400:
        const validationErrors = this.extractValidationErrors(responseData);
        throw new ValidationError(
          responseData?.message || 'Validation failed',
          validationErrors,
          responseData
        );
      
      case 429:
        const retryAfter = error.response?.headers?.['retry-after'];
        throw new RateLimitError(retryAfter ? parseInt(retryAfter) : undefined, responseData);
      
      case 500:
      case 502:
      case 503:
      case 504:
        throw new ServerError(
          responseData?.message || 'Server error occurred',
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

  private extractValidationErrors(responseData: any): string[] | undefined {
    if (responseData?.errors && Array.isArray(responseData.errors)) {
      return responseData.errors;
    }
    if (responseData?.message && typeof responseData.message === 'string') {
      return [responseData.message];
    }
    return undefined;
  }

  async getPosts(): Promise<Post[]> {
    try {
      const response = await this.client.get<Post[]>('/posts');
      return response.data;
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

  async getPost(id: number): Promise<Post> {
    try {
      const response = await this.client.get<Post>(`/posts/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, `post/${id}`);
    }
  }

  async getComments(postId: number): Promise<Comment[]> {
    try {
      const response = await this.client.get<Comment[]>(`/posts/${postId}/comments`);
      return response.data;
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

  async getUser(id: number): Promise<User> {
    try {
      const response = await this.client.get<User>(`/users/${id}`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, `user/${id}`);
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await this.client.get<User[]>('/users');
      return response.data;
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
}
