import MockAdapter from 'axios-mock-adapter';
import { JsonPlaceholderClient } from '../client';

describe('JsonPlaceholderClient Interceptors', () => {
  let client: JsonPlaceholderClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new JsonPlaceholderClient(undefined, {
      loggerConfig: { level: 'info' }
    });
    mock = new MockAdapter(client.client);
  });

  afterEach(() => {
    mock.restore();
    client.clearInterceptors();
  });

  describe('Request Interceptors', () => {
    it('should apply request interceptor to add headers', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      // Add a request interceptor that adds a custom header
      client.addRequestInterceptor((config) => {
        config.headers = config.headers || {};
        config.headers['X-Custom-Header'] = 'test-value';
        return config;
      });

      await client.getPost(1);

      // Check that the request was made with the custom header
      expect(mock.history.get[0].headers).toMatchObject({
        'X-Custom-Header': 'test-value'
      });
    });

    it('should apply multiple request interceptors in order', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      let interceptorOrder: string[] = [];

      client.addRequestInterceptor((config) => {
        interceptorOrder.push('first');
        config.headers = config.headers || {};
        config.headers['X-First'] = 'first';
        return config;
      });

      client.addRequestInterceptor((config) => {
        interceptorOrder.push('second');
        config.headers = config.headers || {};
        config.headers['X-Second'] = 'second';
        return config;
      });

      await client.getPost(1);

      expect(interceptorOrder).toEqual(['first', 'second']);
      expect(mock.history.get[0].headers).toMatchObject({
        'X-First': 'first',
        'X-Second': 'second'
      });
    });

    it('should support async request interceptors', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      client.addRequestInterceptor(async (config) => {
        // Simulate async operation (e.g., token refresh)
        await new Promise(resolve => setTimeout(resolve, 10));
        config.headers = config.headers || {};
        config.headers['X-Async-Token'] = 'async-token';
        return config;
      });

      await client.getPost(1);

      expect(mock.history.get[0].headers).toMatchObject({
        'X-Async-Token': 'async-token'
      });
    });
  });

  describe('Response Interceptors', () => {
    it('should apply response interceptor to transform data', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      client.addResponseInterceptor((response) => {
        // Transform the response data
        response.data = {
          ...response.data,
          transformed: true
        };
        return response;
      });

      const result = await client.getPost(1);

      expect(result).toMatchObject({
        id: 1,
        title: 'Test',
        body: 'Body',
        userId: 1,
        transformed: true
      });
    });

    it('should handle response errors with error interceptor', async () => {
      mock.onGet('/posts/999').reply(404, { message: 'Not found' });

      let errorInterceptorCalled = false;
      let capturedError: any = null;
      
      client.addResponseInterceptor(
        undefined,
        (error) => {
          errorInterceptorCalled = true;
          capturedError = error;
          // Transform the error
          error.customMessage = 'Custom error message';
          throw error; // Rethrow with modifications
        }
      );

      try {
        await client.getPost(999);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(errorInterceptorCalled).toBe(true);
        expect(capturedError).toBeDefined();
        expect(capturedError.customMessage).toBe('Custom error message');
      }
    });
  });

  describe('Authentication Interceptor', () => {
    it('should add Bearer token authentication', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      client.addAuthInterceptor('my-secret-token', 'Bearer');

      await client.getPost(1);

      expect(mock.history.get[0].headers).toMatchObject({
        'Authorization': 'Bearer my-secret-token'
      });
    });

    it('should add API key authentication', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      client.addAuthInterceptor('my-api-key', 'API-Key');

      await client.getPost(1);

      expect(mock.history.get[0].headers).toMatchObject({
        'X-API-Key': 'my-api-key'
      });
    });
  });

  describe('Logging Interceptor', () => {
    it('should log requests and responses', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      // Create client with debug logging enabled
      const testClient = new JsonPlaceholderClient(undefined, {
        loggerConfig: { level: 'debug' }
      });

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      testClient.addLoggingInterceptor(true, true);

      await testClient.getPost(1);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Request: GET'),
        expect.any(Object)
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Response: 200'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('should log only requests when specified', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      // Create client with debug logging enabled
      const testClient = new JsonPlaceholderClient(undefined, {
        loggerConfig: { level: 'debug' }
      });

      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();

      testClient.addLoggingInterceptor(true, false);

      await testClient.getPost(1);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚀 Request: GET'),
        expect.any(Object)
      );
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('✅ Response:'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Retry Interceptor', () => {
    it('should retry failed requests', async () => {
      // First two requests fail, third succeeds
      mock
        .onGet('/posts/1')
        .replyOnce(500, { message: 'Server error' })
        .onGet('/posts/1')
        .replyOnce(500, { message: 'Server error' })
        .onGet('/posts/1')
        .reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      client.addRetryInterceptor({ attempts: 3, delay: 10 });

      const result = await client.getPost(1);

      expect(result.id).toBe(1);
      expect(mock.history.get).toHaveLength(3); // 1 original + 2 retries
      expect(consoleSpy).toHaveBeenCalledTimes(2); // 2 retry logs

      consoleSpy.mockRestore();
    });

    it('should use exponential backoff when configured', async () => {
      mock
        .onGet('/posts/1')
        .replyOnce(429, { message: 'Rate limited' }) // Use 429 which is more realistic for retries
        .onGet('/posts/1')
        .reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();

      client.addRetryInterceptor({ 
        attempts: 2, 
        delay: 50, 
        exponentialBackoff: true 
      });

      await client.getPost(1);

      // Check that retry was attempted
      expect(mock.history.get).toHaveLength(2); // 1 original + 1 retry
      expect(consoleSpy).toHaveBeenCalledTimes(1); // 1 retry log

      consoleSpy.mockRestore();
    });

    it('should give up after max retries', async () => {
      mock.onGet('/posts/1').reply(500, { message: 'Server error' });

      client.addRetryInterceptor({ attempts: 2, delay: 10 });

      await expect(client.getPost(1)).rejects.toThrow();
      expect(mock.history.get).toHaveLength(3); // 1 original + 2 retries
    });
  });

  describe('Interceptor Management', () => {
    it('should remove request interceptors', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      const interceptorIndex = client.addRequestInterceptor((config) => {
        config.headers = config.headers || {};
        config.headers['X-Should-Not-Exist'] = 'value';
        return config;
      });

      client.removeRequestInterceptor(interceptorIndex);

      await client.getPost(1);

      expect(mock.history.get[0].headers).not.toHaveProperty('X-Should-Not-Exist');
    });

    it('should clear all interceptors', async () => {
      mock.onGet('/posts/1').reply(200, { id: 1, title: 'Test', body: 'Body', userId: 1 });

      client.addRequestInterceptor((config) => {
        config.headers = config.headers || {};
        config.headers['X-Should-Not-Exist'] = 'value';
        return config;
      });

      client.clearInterceptors();

      await client.getPost(1);

      expect(mock.history.get[0].headers).not.toHaveProperty('X-Should-Not-Exist');
    });
  });
});
