import MockAdapter from 'axios-mock-adapter';
import { JsonPlaceholderClient } from '../client';
import { CacheConfig, CacheOptions } from '../types';

describe('JsonPlaceholderClient with Caching', () => {
  let client: JsonPlaceholderClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Initialize client with caching enabled
    const cacheConfig: Partial<CacheConfig> = {
      enabled: true,
      defaultTTL: 5000, // 5 seconds
      maxSize: 100,
      storage: 'memory',
      backgroundRefresh: true,
      refreshThreshold: 0.8
    };
    
    client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', cacheConfig);
    mockAxios = new MockAdapter(client.client);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('Basic Caching Operations', () => {
    test('should cache GET requests', async () => {
      const mockPosts = [
        { id: 1, userId: 1, title: 'Test Post 1', body: 'Body 1' },
        { id: 2, userId: 1, title: 'Test Post 2', body: 'Body 2' }
      ];

      mockAxios.onGet('/posts').reply(200, mockPosts);

      // First request should hit the API
      const posts1 = await client.getPosts();
      expect(posts1).toEqual(mockPosts);

      // Second request should come from cache (mock should only be called once)
      const posts2 = await client.getPosts();
      expect(posts2).toEqual(mockPosts);

      // Verify the API was only called once
      expect(mockAxios.history.get.length).toBe(1);
    });

    test('should cache individual post requests', async () => {
      const mockPost = { id: 1, userId: 1, title: 'Test Post', body: 'Test Body' };

      mockAxios.onGet('/posts/1').reply(200, mockPost);

      // First request
      const post1 = await client.getPost(1);
      expect(post1).toEqual(mockPost);

      // Second request should be cached
      const post2 = await client.getPost(1);
      expect(post2).toEqual(mockPost);

      expect(mockAxios.history.get.length).toBe(1);
    });

    test('should cache user requests', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', username: 'johndoe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', username: 'janesmith', email: 'jane@example.com' }
      ];

      mockAxios.onGet('/users').reply(200, mockUsers);

      const users1 = await client.getUsers();
      const users2 = await client.getUsers();
      
      expect(users1).toEqual(mockUsers);
      expect(users2).toEqual(mockUsers);
      expect(mockAxios.history.get.length).toBe(1);
    });

    test('should cache comment requests', async () => {
      const mockComments = [
        { id: 1, postId: 1, name: 'Test Comment', email: 'test@example.com', body: 'Comment body' }
      ];

      mockAxios.onGet('/posts/1/comments').reply(200, mockComments);

      const comments1 = await client.getComments(1);
      const comments2 = await client.getComments(1);
      
      expect(comments1).toEqual(mockComments);
      expect(comments2).toEqual(mockComments);
      expect(mockAxios.history.get.length).toBe(1);
    });
  });

  describe('Cache Configuration', () => {
    test('should respect cache disabled setting', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // Disable cache
      client.enableCache(false);

      await client.getPosts();
      await client.getPosts();

      // Should make two requests since cache is disabled
      expect(mockAxios.history.get.length).toBe(2);
    });

    test('should handle cache configuration updates', () => {
      const newConfig = {
        defaultTTL: 10000,
        maxSize: 50,
        backgroundRefresh: false
      };

      client.configureCaching(newConfig);
      const config = client.getCacheConfig();

      expect(config.defaultTTL).toBe(10000);
      expect(config.maxSize).toBe(50);
      expect(config.backgroundRefresh).toBe(false);
    });

    test('should return cache statistics', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // Make some requests to generate stats
      await client.getPosts();
      await client.getPosts(); // Cache hit
      await client.getPost(999); // This will cause an error, but still counts as a request

      mockAxios.onGet('/posts/999').reply(404);

      try {
        await client.getPost(999);
      } catch (error) {
        // Expected error
      }

      const stats = client.getCacheStats();
      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(0);
    });
  });

  describe('Cache Options', () => {
    test('should handle forceRefresh option', async () => {
      const mockPosts1 = [{ id: 1, userId: 1, title: 'First', body: 'Body 1' }];
      const mockPosts2 = [{ id: 1, userId: 1, title: 'Second', body: 'Body 2' }];

      mockAxios.onGet('/posts').replyOnce(200, mockPosts1);
      mockAxios.onGet('/posts').replyOnce(200, mockPosts2);

      // First request
      const posts1 = await client.getPosts();
      expect(posts1).toEqual(mockPosts1);

      // Second request with forceRefresh should bypass cache
      const cacheOptions: CacheOptions = { forceRefresh: true };
      const posts2 = await client.getPosts(cacheOptions);
      expect(posts2).toEqual(mockPosts2);

      expect(mockAxios.history.get.length).toBe(2);
    });

    test('should handle custom TTL', async () => {
      const mockPost = { id: 1, userId: 1, title: 'Test', body: 'Body' };
      mockAxios.onGet('/posts/1').reply(200, mockPost);

      // Set very short TTL
      const cacheOptions: CacheOptions = { ttl: 100 }; // 100ms
      await client.getPost(1, cacheOptions);

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should make new request since cache expired
      await client.getPost(1);

      expect(mockAxios.history.get.length).toBe(2);
    });

    test('should handle staleWhileRevalidate option', async () => {
      const mockPost1 = { id: 1, userId: 1, title: 'First', body: 'Body 1' };
      const mockPost2 = { id: 1, userId: 1, title: 'Second', body: 'Body 2' };

      mockAxios.onGet('/posts/1').replyOnce(200, mockPost1);
      mockAxios.onGet('/posts/1').replyOnce(200, mockPost2);

      // First request to populate cache
      await client.getPost(1);

      // Second request with staleWhileRevalidate should return cached data quickly
      const cacheOptions: CacheOptions = { staleWhileRevalidate: true };
      const startTime = Date.now();
      const post = await client.getPost(1, cacheOptions);
      const endTime = Date.now();

      expect(post).toEqual(mockPost1); // Should return cached data
      expect(endTime - startTime).toBeLessThan(50); // Should be fast
    });
  });

  describe('Prefetching', () => {
    test('should prefetch posts', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Prefetched', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // Prefetch posts
      await client.prefetchPosts();

      // Regular request should come from cache
      const posts = await client.getPosts();
      expect(posts).toEqual(mockPosts);

      // Only one API call should have been made (during prefetch)
      expect(mockAxios.history.get.length).toBe(1);
    });

    test('should prefetch user data', async () => {
      const mockUser = { 
        id: 1, 
        name: 'John Doe', 
        username: 'johndoe', 
        email: 'john@example.com',
        address: {
          street: '123 Main St',
          suite: 'Apt 1',
          city: 'Anytown',
          zipcode: '12345',
          geo: { lat: '0.0', lng: '0.0' }
        },
        phone: '123-456-7890',
        website: 'johndoe.com',
        company: {
          name: 'Doe Corp',
          catchPhrase: 'We do things',
          bs: 'business solutions'
        }
      };

      mockAxios.onGet('/users/1').reply(200, mockUser);

      await client.prefetchUser(1);

      // This request should come from cache
      const user = await client.getUser(1);
      expect(user).toEqual(mockUser);

      expect(mockAxios.history.get.length).toBe(1);
    });

    test('should prefetch comments', async () => {
      const mockComments = [
        { id: 1, postId: 1, name: 'Comment', email: 'test@example.com', body: 'Body' }
      ];

      mockAxios.onGet('/posts/1/comments').reply(200, mockComments);

      await client.prefetchComments(1);

      const comments = await client.getComments(1);
      expect(comments).toEqual(mockComments);

      expect(mockAxios.history.get.length).toBe(1);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // Make request and cache it
      await client.getPosts();

      // Clear cache
      await client.clearCache();

      // Next request should hit API again
      await client.getPosts();

      expect(mockAxios.history.get.length).toBe(2);
    });

    test('should handle cache events', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      const eventHandler = jest.fn();
      client.addCacheEventListener(eventHandler);

      await client.getPosts();
      await client.getPosts(); // Cache hit

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'set' })
      );
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'hit' })
      );
    });

    test('should remove cache event listeners', async () => {
      const eventHandler = jest.fn();
      
      client.addCacheEventListener(eventHandler);
      client.removeCacheEventListener(eventHandler);

      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      await client.getPosts();

      expect(eventHandler).not.toHaveBeenCalled();
    });

    test('should delete specific cache entries', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      const mockPost = { id: 1, userId: 1, title: 'Single Post', body: 'Body' };

      mockAxios.onGet('/posts').reply(200, mockPosts);
      mockAxios.onGet('/posts/1').reply(200, mockPost);

      // Cache both requests
      await client.getPosts();
      await client.getPost(1);

      // Delete posts cache entry
      const postsKey = client['cacheManager'].generateKey({
        method: 'GET',
        url: '/posts',
        params: {}
      });
      await client.deleteCacheEntry(postsKey);

      // Posts request should hit API again, but post request should still be cached
      await client.getPosts();
      await client.getPost(1);

      // Should have 3 total requests: initial posts, initial post, and new posts request
      expect(mockAxios.history.get.length).toBe(3);
    });
  });

  describe('Error Handling with Cache', () => {
    test('should not cache error responses', async () => {
      mockAxios.onGet('/posts/999').reply(404, { error: 'Not found' });

      try {
        await client.getPost(999);
      } catch (error) {
        // Expected error
      }

      try {
        await client.getPost(999);
      } catch (error) {
        // Expected error
      }

      // Should make two requests since errors are not cached
      expect(mockAxios.history.get.length).toBe(2);
    });

    test('should handle cache storage errors gracefully', async () => {
      // Simulate storage error by mocking the cache manager
      const originalSet = client['cacheManager'].set;
      client['cacheManager'].set = jest.fn().mockRejectedValue(new Error('Storage error'));

      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // Should still work even if caching fails
      const posts = await client.getPosts();
      expect(posts).toEqual(mockPosts);

      // Restore original method
      client['cacheManager'].set = originalSet;
    });
  });

  describe('Performance Features', () => {
    test('should show cache performance benefits', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // First request (from API)
      const start1 = Date.now();
      await client.getPosts();
      const time1 = Date.now() - start1;

      // Second request (from cache)
      const start2 = Date.now();
      await client.getPosts();
      const time2 = Date.now() - start2;

      // Cache should be significantly faster
      expect(time2).toBeLessThan(time1 / 2);
    });

    test('should handle concurrent requests efficiently', async () => {
      const mockPosts = [{ id: 1, userId: 1, title: 'Test', body: 'Body' }];
      mockAxios.onGet('/posts').reply(200, mockPosts);

      // Make multiple concurrent requests
      const promises = Array(5).fill(null).map(() => client.getPosts());
      const results = await Promise.all(promises);

      // All should return the same data
      results.forEach(posts => expect(posts).toEqual(mockPosts));

      // Should only make one API call despite multiple concurrent requests
      expect(mockAxios.history.get.length).toBe(1);
    });
  });
});
