import axios, { AxiosInstance, AxiosError } from 'axios';
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
  PaginatedResponse
} from './types';

const defaultApiUrl = 'https://jsonplaceholder.typicode.com';

export class JsonPlaceholderClient {
  client: AxiosInstance;

  constructor(baseURL: string = defaultApiUrl) {
    this.client = axios.create({
      baseURL,
    });
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

  private parsePaginationHeaders(headers: any, data: any[], options: any): PaginatedResponse<any> {
    const totalCount = parseInt(headers['x-total-count'] || data.length.toString());
    const page = options._page || 1;
    const limit = options._limit || data.length;
    
    return {
      data,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasNext: page * limit < totalCount,
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
