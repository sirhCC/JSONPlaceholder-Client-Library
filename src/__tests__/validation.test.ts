/**
 * Tests for Request Validation and Sanitization Helpers
 */

import {
  ValidationRules,
  RequestValidator,
  CommonSchemas,
  ValidationHelpers,
  ValidationSchema,
  ValidationResult
} from '../validation';

describe('ValidationRules', () => {
  describe('required', () => {
    const rule = ValidationRules.required();

    test('should validate required values', () => {
      expect(rule.validate('test')).toBe(true);
      expect(rule.validate(123)).toBe(true);
      expect(rule.validate(0)).toBe(true);
      expect(rule.validate(false)).toBe(true);
    });

    test('should reject empty values', () => {
      expect(rule.validate(null)).toBe(false);
      expect(rule.validate(undefined)).toBe(false);
      expect(rule.validate('')).toBe(false);
    });
  });

  describe('string', () => {
    test('should validate strings with length constraints', () => {
      const rule = ValidationRules.string(2, 5);
      
      expect(rule.validate('abc')).toBe(true);
      expect(rule.validate('a')).toBe(false); // too short
      expect(rule.validate('abcdef')).toBe(false); // too long
      expect(rule.validate(123)).toBe(false); // not a string
    });

    test('should sanitize non-strings', () => {
      const rule = ValidationRules.string();
      expect(rule.sanitize?.(123)).toBe('123');
      expect(rule.sanitize?.('  test  ')).toBe('test');
    });
  });

  describe('number', () => {
    test('should validate numbers with range constraints', () => {
      const rule = ValidationRules.number(0, 100);
      
      expect(rule.validate(50)).toBe(true);
      expect(rule.validate('50')).toBe(true); // can convert
      expect(rule.validate(-1)).toBe(false); // too small
      expect(rule.validate(101)).toBe(false); // too large
      expect(rule.validate('abc')).toBe(false); // not a number
    });

    test('should sanitize valid numeric strings', () => {
      const rule = ValidationRules.number();
      expect(rule.sanitize?.('123')).toBe(123);
      expect(rule.sanitize?.('123.45')).toBe(123.45);
    });
  });

  describe('integer', () => {
    test('should validate integers', () => {
      const rule = ValidationRules.integer(1, 10);
      
      expect(rule.validate(5)).toBe(true);
      expect(rule.validate('5')).toBe(true);
      expect(rule.validate(5.5)).toBe(false); // not an integer
      expect(rule.validate(0)).toBe(false); // too small
      expect(rule.validate(11)).toBe(false); // too large
    });

    test('should sanitize by flooring', () => {
      const rule = ValidationRules.integer();
      expect(rule.sanitize?.(5.7)).toBe(5);
      expect(rule.sanitize?.('5.9')).toBe(5);
    });
  });

  describe('email', () => {
    test('should validate email addresses', () => {
      const rule = ValidationRules.email();
      
      expect(rule.validate('test@example.com')).toBe(true);
      expect(rule.validate('user+tag@domain.co.uk')).toBe(true);
      expect(rule.validate('invalid-email')).toBe(false);
      expect(rule.validate('test@')).toBe(false);
      expect(rule.validate('@example.com')).toBe(false);
    });

    test('should sanitize email by lowercasing and trimming', () => {
      const rule = ValidationRules.email();
      expect(rule.sanitize?.('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });

  describe('url', () => {
    test('should validate URLs', () => {
      const rule = ValidationRules.url();
      
      expect(rule.validate('https://example.com')).toBe(true);
      expect(rule.validate('http://localhost:3000')).toBe(true);
      expect(rule.validate('ftp://files.example.com')).toBe(true);
      expect(rule.validate('not-a-url')).toBe(false);
      expect(rule.validate('http://')).toBe(false);
    });
  });

  describe('array', () => {
    test('should validate arrays with length constraints', () => {
      const rule = ValidationRules.array(1, 3);
      
      expect(rule.validate([1, 2])).toBe(true);
      expect(rule.validate([])).toBe(false); // too short
      expect(rule.validate([1, 2, 3, 4])).toBe(false); // too long
      expect(rule.validate('not-array')).toBe(false);
    });

    test('should sanitize non-arrays', () => {
      const rule = ValidationRules.array();
      expect(rule.sanitize?.('test')).toEqual(['test']);
      expect(rule.sanitize?.(123)).toEqual([123]);
    });
  });

  describe('enum', () => {
    test('should validate enum values', () => {
      const rule = ValidationRules.enum(['red', 'green', 'blue']);
      
      expect(rule.validate('red')).toBe(true);
      expect(rule.validate('yellow')).toBe(false);
      expect(rule.validate(123)).toBe(false);
    });
  });

  describe('pattern', () => {
    test('should validate against regex patterns', () => {
      const rule = ValidationRules.pattern(/^[A-Z]{2,3}$/, 'Must be 2-3 uppercase letters');
      
      expect(rule.validate('US')).toBe(true);
      expect(rule.validate('USA')).toBe(true);
      expect(rule.validate('us')).toBe(false); // lowercase
      expect(rule.validate('USAA')).toBe(false); // too long
      expect(rule.validate(123)).toBe(false); // not a string
    });
  });

  describe('safeHtml', () => {
    test('should detect dangerous HTML patterns', () => {
      const rule = ValidationRules.safeHtml();
      
      expect(rule.validate('Hello World')).toBe(true);
      expect(rule.validate('<p>Safe HTML</p>')).toBe(true);
      expect(rule.validate('<script>alert("xss")</script>')).toBe(false);
      expect(rule.validate('javascript:alert("xss")')).toBe(false);
      expect(rule.validate('<img onload="alert(1)">')).toBe(false);
    });

    test('should sanitize dangerous patterns', () => {
      const rule = ValidationRules.safeHtml();
      
      expect(rule.sanitize?.('<script>alert("xss")</script>Hello')).toBe('Hello');
      expect(rule.sanitize?.('Click <a href="javascript:alert(1)">here</a>')).toBe('Click <a href="">here</a>');
    });
  });

  describe('sqlSafe', () => {
    test('should detect SQL injection patterns', () => {
      const rule = ValidationRules.sqlSafe();
      
      expect(rule.validate('Normal text')).toBe(true);
      expect(rule.validate('user@example.com')).toBe(true);
      expect(rule.validate("'; DROP TABLE users; --")).toBe(false);
      expect(rule.validate("1 OR 1=1")).toBe(false);
      expect(rule.validate("UNION SELECT * FROM")).toBe(false);
    });

    test('should sanitize SQL patterns', () => {
      const rule = ValidationRules.sqlSafe();
      
      const dangerous = "'; DROP TABLE users; --";
      const sanitized = rule.sanitize?.(dangerous);
      expect(sanitized).not.toContain('DROP TABLE');
    });
  });
});

describe('RequestValidator', () => {
  let validator: RequestValidator;

  beforeEach(() => {
    validator = new RequestValidator({
      strictMode: false,
      autoSanitize: true,
      allowUnknownFields: true
    });
  });

  test('should validate simple schemas', () => {
    const schema: ValidationSchema = {
      name: [ValidationRules.required(), ValidationRules.string(1, 50)],
      age: [ValidationRules.required(), ValidationRules.integer(0, 120)]
    };

    const validData = { name: 'John Doe', age: 30 };
    const result = validator.validate(validData, schema);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should detect validation errors', () => {
    const schema: ValidationSchema = {
      name: [ValidationRules.required(), ValidationRules.string(1, 50)],
      age: [ValidationRules.required(), ValidationRules.integer(0, 120)]
    };

    const invalidData = { name: '', age: 'not-a-number' };
    const result = validator.validate(invalidData, schema);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3); // name fails required, age fails required and integer
    expect(result.errors.some(e => e.field === 'name')).toBe(true);
    expect(result.errors.some(e => e.field === 'age')).toBe(true);
  });

  test('should sanitize data when autoSanitize is enabled', () => {
    const schema: ValidationSchema = {
      name: [ValidationRules.string()],
      age: [ValidationRules.integer()]
    };

    const dirtyData = { name: '  John Doe  ', age: '30.7' };
    const result = validator.validate(dirtyData, schema);

    expect(result.sanitizedData?.name).toBe('John Doe');
    expect(result.sanitizedData?.age).toBe(30);
  });

  test('should handle nested object validation', () => {
    const schema: ValidationSchema = {
      'user.name': [ValidationRules.required(), ValidationRules.string()],
      'user.email': [ValidationRules.required(), ValidationRules.email()]
    };

    const data = {
      user: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    };

    const result = validator.validate(data, schema);
    expect(result.isValid).toBe(true);
  });

  test('should detect unknown fields in strict mode', () => {
    const strictValidator = new RequestValidator({
      allowUnknownFields: false
    });

    const schema: ValidationSchema = {
      name: [ValidationRules.required()]
    };

    const dataWithExtra = { name: 'John', extraField: 'should not be allowed' };
    const result = strictValidator.validate(dataWithExtra, schema);

    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'unknownField')).toBe(true);
  });

  test('should provide quick validation method', () => {
    const schema: ValidationSchema = {
      name: [ValidationRules.required()]
    };

    expect(validator.isValid({ name: 'John' }, schema)).toBe(true);
    expect(validator.isValid({ name: '' }, schema)).toBe(false);
  });
});

describe('CommonSchemas', () => {
  test('should validate post data', () => {
    const validator = new RequestValidator();
    const schema = CommonSchemas.post();

    const validPost = {
      title: 'Test Post',
      body: 'This is a test post body.',
      userId: 1
    };

    const result = validator.validate(validPost, schema);
    expect(result.isValid).toBe(true);
  });

  test('should reject invalid post data', () => {
    const validator = new RequestValidator();
    const schema = CommonSchemas.post();

    const invalidPost = {
      title: '', // empty title
      body: '<script>alert("xss")</script>', // dangerous content
      userId: 'not-a-number' // invalid userId
    };

    const result = validator.validate(invalidPost, schema);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('should validate comment data', () => {
    const validator = new RequestValidator();
    const schema = CommonSchemas.comment();

    const validComment = {
      name: 'John Doe',
      email: 'john@example.com',
      body: 'This is a comment.',
      postId: 1
    };

    const result = validator.validate(validComment, schema);
    expect(result.isValid).toBe(true);
  });

  test('should validate user data with nested address', () => {
    const validator = new RequestValidator();
    const schema = CommonSchemas.user();

    const validUser = {
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      address: {
        street: '123 Main St',
        suite: 'Apt 4',
        city: 'New York',
        zipcode: '10001'
      },
      phone: '1234567890',
      website: 'https://johndoe.com'
    };

    const result = validator.validate(validUser, schema);
    expect(result.isValid).toBe(true);
  });

  test('should validate search parameters', () => {
    const validator = new RequestValidator();
    const schema = CommonSchemas.searchParams();

    const validParams = {
      q: 'search term',
      limit: 10,
      offset: 0,
      sort: 'title',
      order: 'asc'
    };

    const result = validator.validate(validParams, schema);
    expect(result.isValid).toBe(true);
  });
});

describe('ValidationHelpers', () => {
  test('should create secure validator', () => {
    const validator = ValidationHelpers.createSecureValidator();
    expect(validator).toBeInstanceOf(RequestValidator);
  });

  test('should create lenient validator', () => {
    const validator = ValidationHelpers.createLenientValidator();
    expect(validator).toBeInstanceOf(RequestValidator);
  });

  test('should provide quick validation methods', () => {
    const validPost = {
      title: 'Test Post',
      body: 'This is a test.',
      userId: 1
    };

    const result = ValidationHelpers.validatePost(validPost);
    expect(result.isValid).toBe(true);
  });

  test('should detect unsafe data', () => {
    const unsafeData = '<script>alert("xss")</script>';
    expect(ValidationHelpers.isSafeForRequest(unsafeData)).toBe(false);
  });

  test('should sanitize unsafe data', () => {
    const unsafeData = '<script>alert("xss")</script>Hello';
    const sanitized = ValidationHelpers.sanitizeForRequest(unsafeData);
    expect(sanitized).not.toContain('<script>');
  });

  test('should validate comment with security checks', () => {
    const dangerousComment = {
      name: 'Hacker',
      email: 'hacker@evil.com',
      body: '<script>alert("xss")</script>',
      postId: 1
    };

    const result = ValidationHelpers.validateComment(dangerousComment);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'safeHtml')).toBe(true);
  });

  test('should validate user with SQL injection attempt', () => {
    const maliciousUser = {
      name: "'; DROP TABLE users; --",
      username: 'hacker',
      email: 'hacker@evil.com'
    };

    const result = ValidationHelpers.validateUser(maliciousUser);
    expect(result.isValid).toBe(false);
  });

  test('should validate search params with security', () => {
    const maliciousSearch = {
      q: '<script>alert("xss")</script>',
      limit: 1000, // too high
      sort: 'malicious_field' // not in enum
    };

    const result = ValidationHelpers.validateSearchParams(maliciousSearch);
    expect(result.isValid).toBe(false);
  });
});

describe('Security Integration Tests', () => {
  test('should prevent XSS attacks through validation', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src=x onerror=alert(1)>',
      '<svg onload=alert(1)>',
      'data:text/html,<script>alert(1)</script>'
    ];

    const validator = ValidationHelpers.createSecureValidator();
    
    xssPayloads.forEach(payload => {
      const result = validator.validate({ content: payload }, {
        content: [ValidationRules.safeHtml()]
      });
      expect(result.isValid).toBe(false);
    });
  });

  test('should prevent SQL injection through validation', () => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1 OR 1=1",
      "UNION SELECT * FROM passwords",
      "'; INSERT INTO admin VALUES ('hacker'); --",
      "'; DELETE FROM users; --"
    ];

    const validator = ValidationHelpers.createSecureValidator();
    
    sqlPayloads.forEach(payload => {
      const result = validator.validate({ query: payload }, {
        query: [ValidationRules.sqlSafe()]
      });
      expect(result.isValid).toBe(false);
    });
  });

  test('should sanitize and validate real-world post data', () => {
    const messyPost = {
      title: '  My Blog Post <script>alert("xss")</script>  ',
      body: `
        This is my blog post content.
        <p>With some HTML</p>
        <script>alert("malicious")</script>
        And some SQL: '; DROP TABLE posts; --
      `,
      userId: '1' // string instead of number
    };

    const result = ValidationHelpers.validatePost(messyPost);
    
    // Should fail due to dangerous content
    expect(result.isValid).toBe(false);
    
    // In strict mode, sanitized data won't be provided for invalid data
    // But we can use the lenient validator to get sanitized data
    const lenientValidator = ValidationHelpers.createLenientValidator();
    const lenientResult = lenientValidator.validate(messyPost, CommonSchemas.post());
    
    // Lenient validator should provide sanitized data
    expect(lenientResult.sanitizedData?.title).not.toContain('<script>');
    expect(lenientResult.sanitizedData?.userId).toBe(1); // converted to number
  });
});

describe('Performance Tests', () => {
  test('should handle large datasets efficiently', () => {
    const validator = new RequestValidator();
    const schema: ValidationSchema = {
      name: [ValidationRules.required(), ValidationRules.string()],
      email: [ValidationRules.required(), ValidationRules.email()]
    };

    // Generate large dataset
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      name: `User ${i}`,
      email: `user${i}@example.com`
    }));

    const startTime = performance.now();
    
    largeDataset.forEach(item => {
      validator.validate(item, schema);
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (less than 1 second)
    expect(duration).toBeLessThan(1000);
  });

  test('should handle deeply nested objects', () => {
    const validator = new RequestValidator({ maxDepth: 5 });
    const schema: ValidationSchema = {
      'level1.level2.level3.value': [ValidationRules.required(), ValidationRules.string()]
    };

    const deepData = {
      level1: {
        level2: {
          level3: {
            value: 'deep value'
          }
        }
      }
    };

    const result = validator.validate(deepData, schema);
    expect(result.isValid).toBe(true);
  });
});
