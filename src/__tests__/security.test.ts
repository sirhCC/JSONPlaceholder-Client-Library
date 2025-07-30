import { JsonPlaceholderClient } from '../client';
import { DataSanitizer } from '../sanitization';

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

  describe('Data Sanitization', () => {
    let sanitizer: DataSanitizer;

    beforeEach(() => {
      sanitizer = new DataSanitizer();
    });

    it('should sanitize dangerous script tags', () => {
      const maliciousData = 'Hello <script>alert("XSS")</script> World';
      const result = sanitizer.sanitize(maliciousData);
      
      expect(result.sanitized).toBe('Hello  World');
      expect(result.blocked).toContain('Blocked pattern: <script>alert("XSS")</script>');
      expect(result.blocked.length).toBeGreaterThan(0);
    });

    it('should sanitize javascript: URLs', () => {
      const maliciousData = { link: 'javascript:alert("XSS")' };
      const result = sanitizer.sanitize(maliciousData);
      
      expect((result.sanitized as any).link).toBe('alert("XSS")');
      expect(result.blocked).toContain('Blocked pattern: javascript:');
    });

    it('should trim whitespace when configured', () => {
      const data = '  Hello World  ';
      const result = sanitizer.sanitize(data);
      
      expect(result.sanitized).toBe('Hello World');
      expect(result.warnings).toContain('Trimmed whitespace');
    });

    it('should truncate long strings', () => {
      const longString = 'a'.repeat(15000);
      const result = sanitizer.sanitize(longString);
      
      expect((result.sanitized as string).length).toBe(10000);
      expect(result.warnings).toContain('String truncated to 10000 characters');
    });

    it('should handle nested objects and arrays', () => {
      const data = {
        users: [
          { name: '<script>alert("xss")</script>John', email: '  john@example.com  ' },
          { name: 'Jane', email: 'javascript:alert("xss")' }
        ]
      };
      
      const result = sanitizer.sanitize(data);
      const sanitizedData = result.sanitized as any;
      
      expect(sanitizedData.users[0].name).toBe('John');
      expect(sanitizedData.users[0].email).toBe('john@example.com');
      expect(sanitizedData.users[1].email).toBe('alert("xss")');
    });

    it('should allow disabling sanitization', () => {
      const disabledSanitizer = new DataSanitizer({ enabled: false });
      const maliciousData = '<script>alert("XSS")</script>';
      const result = disabledSanitizer.sanitize(maliciousData);
      
      expect(result.sanitized).toBe(maliciousData);
      expect(result.warnings).toHaveLength(0);
      expect(result.blocked).toHaveLength(0);
    });

    it('should detect dangerous content', () => {
      const safeData = 'Hello World';
      const dangerousData = '<script>alert("XSS")</script>';
      
      expect(sanitizer.isDangerous(safeData)).toBe(false);
      expect(sanitizer.isDangerous(dangerousData)).toBe(true);
    });
  });

  describe('Client Data Sanitization Integration', () => {
    let client: JsonPlaceholderClient;

    beforeEach(() => {
      client = new JsonPlaceholderClient('https://jsonplaceholder.typicode.com', {
        securityConfig: {
          sanitization: {
            enabled: true
          }
        }
      });
    });

    it('should sanitize request data', () => {
      const maliciousData = { title: '<script>alert("XSS")</script>Post' };
      const sanitized = client.sanitizeRequestData(maliciousData);
      
      expect(sanitized.title).toBe('Post');
    });

    it('should sanitize response data', () => {
      const maliciousResponse = { title: '<script>alert("XSS")</script>Post' };
      const sanitized = client.sanitizeResponseData(maliciousResponse);
      
      expect(sanitized.title).toBe('Post');
    });

    it('should detect dangerous data in client', () => {
      const safeData = { title: 'Safe Post' };
      const dangerousData = { title: '<script>alert("XSS")</script>' };
      
      expect(client.isDangerousData(safeData)).toBe(false);
      expect(client.isDangerousData(dangerousData)).toBe(true);
    });

    it('should allow configuring sanitization', () => {
      client.configureSanitization({ enabled: false });
      const config = client.getSanitizationConfig();
      
      expect(config.enabled).toBe(false);
    });
  });
});
