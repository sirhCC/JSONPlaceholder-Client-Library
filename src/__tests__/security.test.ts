import { JsonPlaceholderClient } from '../client';

describe('Security Configuration', () => {
  describe('Timeout Configuration', () => {
    it('should use default timeout of 10 seconds', () => {
      const client = new JsonPlaceholderClient();
      
      // Access the internal axios instance to check timeout
      expect(client.client.defaults.timeout).toBe(10000);
    });

    it('should allow custom timeout configuration', () => {
      const customTimeout = 5000;
      const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        securityConfig: {
          timeout: customTimeout
        }
      });
      
      expect(client.client.defaults.timeout).toBe(customTimeout);
    });

    it('should allow custom maxRedirects configuration', () => {
      const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        securityConfig: {
          maxRedirects: 3
        }
      });
      
      expect(client.client.defaults.maxRedirects).toBe(3);
    });

    it('should use default maxRedirects when not specified', () => {
      const client = new JsonPlaceholderClient();
      
      expect(client.client.defaults.maxRedirects).toBe(5);
    });

    it('should allow custom validateStatus configuration', () => {
      const customValidateStatus = (status: number) => status < 500;
      const client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        securityConfig: {
          validateStatus: customValidateStatus
        }
      });
      
      expect(client.client.defaults.validateStatus).toBe(customValidateStatus);
    });
  });
});
