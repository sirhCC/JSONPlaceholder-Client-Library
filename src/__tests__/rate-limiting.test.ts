import { JsonPlaceholderClient } from '../client';
import { RateLimiter, RateLimitingError } from '../rate-limiter';
import { RateLimitConfig } from '../types';

describe('Rate Limiting', () => {
  describe('RateLimiter Class', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter({
        enabled: true,
        strategy: 'token-bucket',
        maxRequests: 5,
        windowMs: 1000, // 1 second
        maxQueueSize: 3,
        skipEndpoints: ['/health'],
        endpointLimits: {
          '/posts': {
            maxRequests: 3,
            windowMs: 2000
          }
        },
        retryConfig: {
          maxRetries: 2,
          baseDelay: 100,
          maxDelay: 1000,
          exponentialBackoff: true
        },
        enableAnalytics: true,
        includeHeaders: true
      });
    });

    describe('Token Bucket Strategy', () => {
      test('should allow requests within limit', async () => {
        const result1 = await rateLimiter.checkLimit('/test');
        const result2 = await rateLimiter.checkLimit('/test');
        const result3 = await rateLimiter.checkLimit('/test');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
        expect(result3.allowed).toBe(true);
        expect(result3.remaining).toBe(2); // Started with 5, used 3
      });

      test('should reject requests exceeding limit when queueing is disabled', async () => {
        // Create a rate limiter with no queueing to test pure rate limiting
        const noQueueLimiter = new RateLimiter({
          enabled: true,
          strategy: 'token-bucket',
          maxRequests: 5,
          windowMs: 1000,
          maxQueueSize: 0, // Disable queueing
          enableAnalytics: true
        });

        // Use up all tokens
        for (let i = 0; i < 5; i++) {
          await noQueueLimiter.checkLimit('/test');
        }

        const result = await noQueueLimiter.checkLimit('/test');
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.retryAfter).toBeGreaterThan(0);
      });

      test('should refill tokens over time', async () => {
        // Create a rate limiter with faster refill for testing
        const fastLimiter = new RateLimiter({
          enabled: true,
          strategy: 'token-bucket',
          maxRequests: 2,
          windowMs: 200, // Very short window for quick testing
          maxQueueSize: 0,
          enableAnalytics: true
        });

        // Use up all tokens
        await fastLimiter.checkLimit('/test');
        await fastLimiter.checkLimit('/test');

        // Should be blocked
        const blockedResult = await fastLimiter.checkLimit('/test');
        expect(blockedResult.allowed).toBe(false);

        // Wait for refill
        await new Promise(resolve => setTimeout(resolve, 250));

        const result = await fastLimiter.checkLimit('/test');
        expect(result.allowed).toBe(true);
      });
    });

    describe('Sliding Window Strategy', () => {
      beforeEach(() => {
        rateLimiter = new RateLimiter({
          enabled: true,
          strategy: 'sliding-window',
          maxRequests: 3,
          windowMs: 1000,
          maxQueueSize: 0, // Disable queueing for pure rate limiting test
          enableAnalytics: true
        });
      });

      test('should track requests in sliding window', async () => {
        const result1 = await rateLimiter.checkLimit('/test');
        const result2 = await rateLimiter.checkLimit('/test');
        const result3 = await rateLimiter.checkLimit('/test');
        const result4 = await rateLimiter.checkLimit('/test');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
        expect(result3.allowed).toBe(true);
        expect(result4.allowed).toBe(false);
      });
    });

    describe('Fixed Window Strategy', () => {
      beforeEach(() => {
        rateLimiter = new RateLimiter({
          enabled: true,
          strategy: 'fixed-window',
          maxRequests: 3,
          windowMs: 1000,
          maxQueueSize: 0, // Disable queueing for pure rate limiting test
          enableAnalytics: true
        });
      });

      test('should reset counter at window boundary', async () => {
        const result1 = await rateLimiter.checkLimit('/test');
        const result2 = await rateLimiter.checkLimit('/test');
        const result3 = await rateLimiter.checkLimit('/test');
        const result4 = await rateLimiter.checkLimit('/test');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
        expect(result3.allowed).toBe(true);
        expect(result4.allowed).toBe(false);

        // Wait for window to reset
        await new Promise(resolve => setTimeout(resolve, 1100));

        const result5 = await rateLimiter.checkLimit('/test');
        expect(result5.allowed).toBe(true);
      });
    });

    describe('Endpoint-Specific Limits', () => {
      test('should apply specific limits to configured endpoints', async () => {
        // Create new limiter with endpoint-specific config and no queueing
        const endpointLimiter = new RateLimiter({
          enabled: true,
          strategy: 'token-bucket',
          maxRequests: 5,
          windowMs: 1000,
          maxQueueSize: 0,
          endpointLimits: {
            '/posts': {
              maxRequests: 3,
              windowMs: 2000
            }
          },
          enableAnalytics: true
        });

        // /posts has limit of 3 requests per 2 seconds
        const result1 = await endpointLimiter.checkLimit('/posts');
        const result2 = await endpointLimiter.checkLimit('/posts');
        const result3 = await endpointLimiter.checkLimit('/posts');
        const result4 = await endpointLimiter.checkLimit('/posts');

        expect(result1.allowed).toBe(true);
        expect(result2.allowed).toBe(true);
        expect(result3.allowed).toBe(true);
        expect(result4.allowed).toBe(false);
      });

      test('should skip rate limiting for configured endpoints', async () => {
        // /health is in skipEndpoints
        for (let i = 0; i < 10; i++) {
          const result = await rateLimiter.checkLimit('/health');
          expect(result.allowed).toBe(true);
        }
      });
    });

    describe('Analytics', () => {
      test('should track request analytics', async () => {
        await rateLimiter.checkLimit('/test');
        await rateLimiter.checkLimit('/test');
        
        // Try to exceed limit
        for (let i = 0; i < 5; i++) {
          await rateLimiter.checkLimit('/test');
        }

        const analytics = rateLimiter.getAnalytics();
        expect(analytics.totalRequests).toBeGreaterThan(0);
        expect(analytics.blockedRequests).toBeGreaterThan(0);
        expect(analytics.endpointStats['/test']).toBeDefined();
        expect(analytics.endpointStats['/test'].requests).toBeGreaterThan(0);
      });

      test('should reset analytics when reset is called', async () => {
        await rateLimiter.checkLimit('/test');
        
        rateLimiter.reset();
        
        const analytics = rateLimiter.getAnalytics();
        expect(analytics.totalRequests).toBe(0);
        expect(analytics.blockedRequests).toBe(0);
      });
    });

    describe('Configuration Updates', () => {
      test('should update configuration dynamically', async () => {
        rateLimiter.updateConfig({
          maxRequests: 10,
          windowMs: 2000
        });

        // Should allow more requests now
        for (let i = 0; i < 8; i++) {
          const result = await rateLimiter.checkLimit('/test');
          expect(result.allowed).toBe(true);
        }
      });
    });

    describe('Headers', () => {
      test('should generate rate limit headers', async () => {
        const result = await rateLimiter.checkLimit('/test');
        const headers = rateLimiter.getHeaders(result);

        expect(headers['X-RateLimit-Limit']).toBe('5');
        expect(headers['X-RateLimit-Remaining']).toBe('4');
        expect(headers['X-RateLimit-Reset']).toBeDefined();
      });

      test('should include retry-after header when rate limited', async () => {
        // Create rate limiter with no queueing
        const noQueueLimiter = new RateLimiter({
          enabled: true,
          strategy: 'token-bucket',
          maxRequests: 2,
          windowMs: 1000,
          maxQueueSize: 0,
          includeHeaders: true
        });

        // Use up all tokens
        await noQueueLimiter.checkLimit('/test');
        await noQueueLimiter.checkLimit('/test');

        const result = await noQueueLimiter.checkLimit('/test');
        const headers = noQueueLimiter.getHeaders(result);

        expect(headers['Retry-After']).toBeDefined();
        expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
      });
    });
  });

  describe('Client Integration', () => {
    let client: JsonPlaceholderClient;

    beforeEach(() => {
      const rateLimitConfig: Partial<RateLimitConfig> = {
        enabled: true,
        strategy: 'token-bucket',
        maxRequests: 3,
        windowMs: 1000,
        maxQueueSize: 2,
        enableAnalytics: true
      };

      client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        rateLimitConfig
      });
    });

    test('should apply rate limiting to client requests', async () => {
      // Create client with no queueing for deterministic testing
      const rateLimitConfig: Partial<RateLimitConfig> = {
        enabled: true,
        strategy: 'token-bucket',
        maxRequests: 2,
        windowMs: 1000,
        maxQueueSize: 0, // Disable queueing
        enableAnalytics: true
      };

      const testClient = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        rateLimitConfig
      });

      // Test the rate limiting directly before worrying about integration
      const rateLimitResult1 = await testClient.checkRateLimit('/posts/1');
      const rateLimitResult2 = await testClient.checkRateLimit('/posts/2');
      const rateLimitResult3 = await testClient.checkRateLimit('/posts/3');

      console.log('Rate limit results:', [rateLimitResult1, rateLimitResult2, rateLimitResult3]);
      console.log('Analytics after direct rate limit checks:', testClient.getRateLimitAnalytics());

      expect(rateLimitResult1.allowed).toBe(true);
      expect(rateLimitResult2.allowed).toBe(true);
      expect(rateLimitResult3.allowed).toBe(false);
    });

    test('should provide rate limit analytics through client', async () => {
      const analytics = client.getRateLimitAnalytics();
      expect(analytics).toBeDefined();
      expect(analytics.totalRequests).toBeDefined();
      expect(analytics.blockedRequests).toBeDefined();
    });

    test('should allow checking rate limit status', async () => {
      const status = await client.checkRateLimit('/posts');
      expect(status.allowed).toBeDefined();
      expect(status.limit).toBeDefined();
      expect(status.remaining).toBeDefined();
    });

    test('should allow updating rate limit configuration', () => {
      client.updateRateLimitConfig({
        maxRequests: 10,
        windowMs: 2000
      });

      // Configuration should be updated
      const status = client.checkRateLimit('/test');
      expect(status).resolves.toBeDefined();
    });

    test('should allow resetting rate limit state', () => {
      client.resetRateLimit();
      
      const analytics = client.getRateLimitAnalytics();
      expect(analytics.totalRequests).toBe(0);
    });

    test('should print rate limit report', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      client.printRateLimitReport();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Rate Limiting Analytics Report'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('RateLimitingError should contain rate limit information', () => {
      const rateLimitResult = {
        allowed: false,
        retryAfter: 1000,
        remaining: 0,
        limit: 5,
        resetTime: Date.now() + 5000
      };

      const error = new RateLimitingError('Rate limit exceeded', rateLimitResult);

      expect(error.name).toBe('RateLimitingError');
      expect(error.retryAfter).toBe(1000);
      expect(error.remaining).toBe(0);
      expect(error.limit).toBe(5);
      expect(error.resetTime).toBe(rateLimitResult.resetTime);
    });
  });

  describe('Disabled Rate Limiting', () => {
    test('should allow all requests when disabled', async () => {
      const rateLimiter = new RateLimiter({
        enabled: false,
        maxRequests: 1,
        windowMs: 1000
      });

      // Should allow many requests even with limit of 1
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.checkLimit('/test');
        expect(result.allowed).toBe(true);
      }
    });
  });
});
