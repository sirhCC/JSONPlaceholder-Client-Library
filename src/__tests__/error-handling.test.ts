import MockAdapter from 'axios-mock-adapter';
import { JsonPlaceholderClient } from '../client';
import { PostNotFoundError, ValidationError, ServerError, RateLimitError, ApiClientError } from '../types';

describe('JsonPlaceholderClient Error Handling', () => {
  let client: JsonPlaceholderClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new JsonPlaceholderClient();
    mock = new MockAdapter(client.client);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('PostNotFoundError', () => {
    it('should throw PostNotFoundError when post is not found', async () => {
      mock.onGet('/posts/999').reply(404, { message: 'Post not found' });

      await expect(client.getPost(999)).rejects.toThrow(PostNotFoundError);
      await expect(client.getPost(999)).rejects.toThrow('Post with ID 999 not found');
    });

    it('should throw PostNotFoundError when updating non-existent post', async () => {
      mock.onPatch('/posts/999').reply(404, { message: 'Post not found' });

      await expect(client.updatePost(999, { title: 'New Title' })).rejects.toThrow(PostNotFoundError);
    });

    it('should throw PostNotFoundError when deleting non-existent post', async () => {
      mock.onDelete('/posts/999').reply(404, { message: 'Post not found' });

      await expect(client.deletePost(999)).rejects.toThrow(PostNotFoundError);
    });
  });

  describe('ValidationError', () => {
    it('should throw ValidationError for invalid post data', async () => {
      const validationResponse = {
        message: 'Validation failed',
        errors: ['Title is required', 'Body must be at least 10 characters']
      };
      mock.onPost('/posts').reply(400, validationResponse);

      const invalidPost = { userId: 1, title: '', body: '' };

      await expect(client.createPost(invalidPost)).rejects.toThrow(ValidationError);
      
      try {
        await client.createPost(invalidPost);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).validationErrors).toEqual([
          'Title is required',
          'Body must be at least 10 characters'
        ]);
      }
    });

    it('should handle single validation message', async () => {
      mock.onPost('/posts').reply(400, { message: 'Invalid data format' });

      const invalidPost = { userId: 1, title: '', body: '' };

      try {
        await client.createPost(invalidPost);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).validationErrors).toEqual(['Invalid data format']);
      }
    });
  });

  describe('ServerError', () => {
    it('should throw ServerError for 500 status', async () => {
      mock.onGet('/posts').reply(500, { message: 'Database connection failed' });

      await expect(client.getPosts()).rejects.toThrow(ServerError);
      await expect(client.getPosts()).rejects.toThrow('Database connection failed');
    }, 15000); // Increase timeout to 15 seconds

    it('should throw ServerError for 502 status', async () => {
      mock.onGet('/posts').reply(502, { message: 'Bad Gateway' });

      await expect(client.getPosts()).rejects.toThrow(ServerError);
    });

    it('should throw ServerError for 503 status', async () => {
      mock.onGet('/posts').reply(503, { message: 'Service Unavailable' });

      await expect(client.getPosts()).rejects.toThrow(ServerError);
    });

    it('should use default message when none provided', async () => {
      mock.onGet('/posts').reply(500);

      await expect(client.getPosts()).rejects.toThrow('Server error occurred');
    });
  });

  describe('RateLimitError', () => {
    it('should throw RateLimitError for 429 status', async () => {
      mock.onGet('/posts').reply(429, { message: 'Too many requests' }, { 'retry-after': '60' });

      try {
        await client.getPosts();
      } catch (error: any) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBe(60);
        expect(error.message).toBe('Rate limit exceeded. Please try again later.');
      }
    });

    it('should handle RateLimitError without retry-after header', async () => {
      mock.onGet('/posts').reply(429, { message: 'Too many requests' });

      try {
        await client.getPosts();
      } catch (error: any) {
        expect(error).toBeInstanceOf(RateLimitError);
        expect((error as RateLimitError).retryAfter).toBeUndefined();
      }
    });
  });

  describe('Generic ApiClientError', () => {
    it('should throw ApiClientError for unexpected status codes', async () => {
      mock.onGet('/posts').reply(418, { message: "I'm a teapot" });

      try {
        await client.getPosts();
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiClientError);
        expect((error as ApiClientError).status).toBe(418);
      }
    });

    it('should handle network errors', async () => {
      mock.onGet('/posts').networkError();

      await expect(client.getPosts()).rejects.toThrow(ApiClientError);
    });

    it('should handle timeout errors', async () => {
      mock.onGet('/posts').timeout();

      await expect(client.getPosts()).rejects.toThrow(ApiClientError);
    });
  });

  describe('Error properties', () => {
    it('should preserve response data in error', async () => {
      const responseData = { message: 'Post not found', code: 'POST_NOT_FOUND' };
      mock.onGet('/posts/999').reply(404, responseData);

      try {
        await client.getPost(999);
      } catch (error: any) {
        expect(error).toBeInstanceOf(PostNotFoundError);
        expect((error as PostNotFoundError).response).toEqual(responseData);
      }
    });

    it('should have correct error name', async () => {
      mock.onGet('/posts/999').reply(404);

      try {
        await client.getPost(999);
      } catch (error: any) {
        expect(error.name).toBe('PostNotFoundError');
      }
    });
  });
});
