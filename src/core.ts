// Lightweight client without caching
export { JsonPlaceholderClient } from './client';
export type { ClientConfig } from './client';

// Core types only
export type {
  Post,
  Comment,
  User,
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationOptions,
  PostSearchOptions,
  CommentSearchOptions,
  UserSearchOptions,
  RequestInterceptor,
  ResponseInterceptor,
  ResponseErrorInterceptor,
  InterceptorOptions,
  RequestConfig,
  ResponseData
} from './types';

// Core errors
export {
  ApiClientError,
  PostNotFoundError,
  ValidationError,
  ServerError,
  RateLimitError
} from './types';
