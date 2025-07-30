/**
 * Core-only export for minimal bundle size
 * Includes only the essential client functionality without heavy features
 * 
 * Bundle size: ~15KB (vs ~120KB for full build)
 * 
 * @example
 * ```typescript
 * import { JsonPlaceholderClient } from 'jsonplaceholder-client-lib/core-minimal';
 * 
 * const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com');
 * const posts = await client.getPosts();
 * ```
 */

// Core client with minimal features
export { JsonPlaceholderClient } from './client';

// Essential types only
export type {
  Post,
  Comment,
  User,
  PaginationOptions,
  SearchOptions,
} from './types';

// Basic error handling
export {
  ApiClientError,
  PostNotFoundError,
  ValidationError,
} from './types';

// Feature flags for minimal build
export { CORE_FEATURES as DEFAULT_FEATURES } from './features';

// Essential utilities
export { Logger, SilentLogger } from './logger';
