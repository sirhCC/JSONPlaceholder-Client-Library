/**
 * Request Validation and Sanitization Helpers
 * 
 * This module provides comprehensive validation utilities for API requests,
 * including input validation, schema validation, and sanitization helpers.
 */

import { DataSanitizer } from './sanitization';

// ===== VALIDATION TYPES =====

export interface ValidationRule {
  name: string;
  validate: (value: any) => boolean;
  message: string;
  sanitize?: (value: any) => any;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
  warnings: string[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value: any;
}

export interface ValidationConfig {
  strictMode?: boolean;
  autoSanitize?: boolean;
  maxDepth?: number;
  allowUnknownFields?: boolean;
  sanitizationConfig?: {
    enabled: boolean;
    strictMode: boolean;
    customPatterns?: RegExp[];
  };
}

// ===== BUILT-IN VALIDATION RULES =====

export class ValidationRules {
  /**
   * Required field validation
   */
  static required(): ValidationRule {
    return {
      name: 'required',
      validate: (value: any) => value !== null && value !== undefined && value !== '',
      message: 'Field is required',
      sanitize: (value: any) => value
    };
  }

  /**
   * String validation with optional length constraints
   */
  static string(minLength?: number, maxLength?: number): ValidationRule {
    return {
      name: 'string',
      validate: (value: any) => {
        if (typeof value !== 'string') return false;
        if (minLength !== undefined && value.length < minLength) return false;
        if (maxLength !== undefined && value.length > maxLength) return false;
        return true;
      },
      message: `Must be a string${minLength ? ` (min: ${minLength})` : ''}${maxLength ? ` (max: ${maxLength})` : ''}`,
      sanitize: (value: any) => typeof value === 'string' ? value.trim() : String(value)
    };
  }

  /**
   * Number validation with optional range constraints
   */
  static number(min?: number, max?: number): ValidationRule {
    return {
      name: 'number',
      validate: (value: any) => {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
      },
      message: `Must be a number${min !== undefined ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`,
      sanitize: (value: any) => Number(value)
    };
  }

  /**
   * Integer validation
   */
  static integer(min?: number, max?: number): ValidationRule {
    return {
      name: 'integer',
      validate: (value: any) => {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
      },
      message: `Must be an integer${min !== undefined ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`,
      sanitize: (value: any) => Math.floor(Number(value))
    };
  }

  /**
   * Email validation
   */
  static email(): ValidationRule {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      name: 'email',
      validate: (value: any) => typeof value === 'string' && emailRegex.test(value),
      message: 'Must be a valid email address',
      sanitize: (value: any) => typeof value === 'string' ? value.toLowerCase().trim() : value
    };
  }

  /**
   * URL validation
   */
  static url(): ValidationRule {
    return {
      name: 'url',
      validate: (value: any) => {
        if (typeof value !== 'string') return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Must be a valid URL',
      sanitize: (value: any) => typeof value === 'string' ? value.trim() : value
    };
  }

  /**
   * Array validation
   */
  static array(minLength?: number, maxLength?: number): ValidationRule {
    return {
      name: 'array',
      validate: (value: any) => {
        if (!Array.isArray(value)) return false;
        if (minLength !== undefined && value.length < minLength) return false;
        if (maxLength !== undefined && value.length > maxLength) return false;
        return true;
      },
      message: `Must be an array${minLength ? ` (min length: ${minLength})` : ''}${maxLength ? ` (max length: ${maxLength})` : ''}`,
      sanitize: (value: any) => Array.isArray(value) ? value : [value]
    };
  }

  /**
   * Enum validation
   */
  static enum(allowedValues: any[]): ValidationRule {
    return {
      name: 'enum',
      validate: (value: any) => allowedValues.includes(value),
      message: `Must be one of: ${allowedValues.join(', ')}`,
      sanitize: (value: any) => value
    };
  }

  /**
   * Pattern validation (regex)
   */
  static pattern(regex: RegExp, message?: string): ValidationRule {
    return {
      name: 'pattern',
      validate: (value: any) => typeof value === 'string' && regex.test(value),
      message: message || `Must match pattern: ${regex.toString()}`,
      sanitize: (value: any) => value
    };
  }

  /**
   * Safe HTML validation (no dangerous patterns)
   */
  static safeHtml(): ValidationRule {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi
    ];

    return {
      name: 'safeHtml',
      validate: (value: any) => {
        if (typeof value !== 'string') return false;
        return !dangerousPatterns.some(pattern => pattern.test(value));
      },
      message: 'Contains potentially dangerous HTML content',
      sanitize: (value: any) => {
        if (typeof value !== 'string') return value;
        let sanitized = value;
        
        // Remove script tags completely
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Replace javascript: URLs with empty href
        sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, 'href=""');
        
        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        
        // Remove data:text/html
        sanitized = sanitized.replace(/data:text\/html[^"']*/gi, '');
        
        return sanitized;
      }
    };
  }

  /**
   * SQL injection prevention
   */
  static sqlSafe(): ValidationRule {
    const sqlPatterns = [
      /('|(\\'))|((\s)*union(\s)+select(\s)*)/gi,
      /((\s)*or(\s)+1(\s)*=(\s)*1(\s)*)/gi,
      /((\s)*drop(\s)+table(\s)*)/gi,
      /((\s)*insert(\s)+into(\s)*)/gi,
      /((\s)*delete(\s)+from(\s)*)/gi,
      /((\s)*update(\s)+.*(\s)*set(\s)*)/gi
    ];

    return {
      name: 'sqlSafe',
      validate: (value: any) => {
        if (typeof value !== 'string') return true;
        return !sqlPatterns.some(pattern => pattern.test(value));
      },
      message: 'Contains potentially dangerous SQL patterns',
      sanitize: (value: any) => {
        if (typeof value !== 'string') return value;
        let sanitized = value;
        sqlPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        return sanitized;
      }
    };
  }
}

// ===== VALIDATOR CLASS =====

export class RequestValidator {
  private sanitizer: DataSanitizer;
  private config: ValidationConfig;

  constructor(config: ValidationConfig = {}) {
    this.config = {
      strictMode: false,
      autoSanitize: true,
      maxDepth: 10,
      allowUnknownFields: true,
      sanitizationConfig: {
        enabled: true,
        strictMode: false
      },
      ...config
    };

    this.sanitizer = new DataSanitizer(this.config.sanitizationConfig);
  }

  /**
   * Validate data against a schema
   */
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let sanitizedData = this.config.autoSanitize ? this.deepClone(data) : undefined;

    // Validate each field in the schema
    for (const [fieldPath, rules] of Object.entries(schema)) {
      const value = this.getNestedValue(data, fieldPath);
      
      for (const rule of rules) {
        const isValid = rule.validate(value);
        
        if (!isValid) {
          errors.push({
            field: fieldPath,
            rule: rule.name,
            message: rule.message,
            value
          });

          // If not in strict mode, try to sanitize invalid data
          if (!this.config.strictMode && rule.sanitize && sanitizedData) {
            try {
              const sanitizedValue = rule.sanitize(value);
              this.setNestedValue(sanitizedData, fieldPath, sanitizedValue);
              warnings.push(`Field '${fieldPath}' was automatically sanitized`);
            } catch (error) {
              // Sanitization failed, keep the error
            }
          }
        } else if (this.config.autoSanitize && rule.sanitize && sanitizedData) {
          // Apply sanitization even for valid data
          try {
            const sanitizedValue = rule.sanitize(value);
            this.setNestedValue(sanitizedData, fieldPath, sanitizedValue);
          } catch (error) {
            warnings.push(`Failed to sanitize field '${fieldPath}': ${(error as Error).message}`);
          }
        }
      }
    }

    // Check for unknown fields if not allowed
    if (!this.config.allowUnknownFields) {
      const unknownFields = this.findUnknownFields(data, schema);
      unknownFields.forEach(field => {
        errors.push({
          field,
          rule: 'unknownField',
          message: 'Unknown field not allowed',
          value: this.getNestedValue(data, field)
        });
      });
    }

    // Apply additional sanitization if enabled
    if (this.config.autoSanitize && sanitizedData && this.sanitizer) {
      const sanitizationResult = this.sanitizer.sanitize(JSON.stringify(sanitizedData));
      if (sanitizationResult.warnings && sanitizationResult.warnings.length > 0) {
        warnings.push(...sanitizationResult.warnings);
      }
      if (sanitizationResult.blocked && sanitizationResult.blocked.length > 0) {
        warnings.push(...sanitizationResult.blocked.map(b => `Blocked pattern: ${b}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData,
      warnings
    };
  }

  /**
   * Quick validation without sanitization
   */
  isValid(data: any, schema: ValidationSchema): boolean {
    const result = this.validate(data, schema);
    return result.isValid;
  }

  /**
   * Sanitize data using the configured sanitizer
   */
  sanitize(data: any): any {
    return this.sanitizer.sanitize(data);
  }

  /**
   * Validate and sanitize in one step
   */
  validateAndSanitize(data: any, schema: ValidationSchema): ValidationResult {
    const originalAutoSanitize = this.config.autoSanitize;
    this.config.autoSanitize = true;
    
    const result = this.validate(data, schema);
    
    this.config.autoSanitize = originalAutoSanitize;
    return result;
  }

  // ===== PRIVATE HELPER METHODS =====

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  private findUnknownFields(data: any, schema: ValidationSchema, prefix = ''): string[] {
    const unknownFields: string[] = [];
    const schemaKeys = new Set(Object.keys(schema).map(key => 
      prefix ? key.replace(prefix + '.', '') : key
    ));

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      for (const key of Object.keys(data)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        
        if (!schemaKeys.has(key) && !schemaKeys.has(fullPath)) {
          unknownFields.push(fullPath);
        }

        // Recursively check nested objects
        if (data[key] && typeof data[key] === 'object' && !Array.isArray(data[key])) {
          unknownFields.push(...this.findUnknownFields(data[key], schema, fullPath));
        }
      }
    }

    return unknownFields;
  }

  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  }
}

// ===== PREDEFINED SCHEMAS =====

export class CommonSchemas {
  /**
   * Schema for JSONPlaceholder Post creation/update
   */
  static post(): ValidationSchema {
    return {
      'title': [
        ValidationRules.required(),
        ValidationRules.string(1, 200),
        ValidationRules.safeHtml()
      ],
      'body': [
        ValidationRules.required(),
        ValidationRules.string(1, 5000),
        ValidationRules.safeHtml(),
        ValidationRules.sqlSafe()
      ],
      'userId': [
        ValidationRules.required(),
        ValidationRules.integer(1, 10)
      ]
    };
  }

  /**
   * Schema for JSONPlaceholder Comment creation/update
   */
  static comment(): ValidationSchema {
    return {
      'name': [
        ValidationRules.required(),
        ValidationRules.string(1, 100),
        ValidationRules.safeHtml()
      ],
      'email': [
        ValidationRules.required(),
        ValidationRules.email()
      ],
      'body': [
        ValidationRules.required(),
        ValidationRules.string(1, 1000),
        ValidationRules.safeHtml(),
        ValidationRules.sqlSafe()
      ],
      'postId': [
        ValidationRules.required(),
        ValidationRules.integer(1, 100)
      ]
    };
  }

  /**
   * Schema for JSONPlaceholder User creation/update
   */
  static user(): ValidationSchema {
    return {
      'name': [
        ValidationRules.required(),
        ValidationRules.string(1, 100),
        ValidationRules.safeHtml()
      ],
      'username': [
        ValidationRules.required(),
        ValidationRules.string(1, 50),
        ValidationRules.pattern(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores')
      ],
      'email': [
        ValidationRules.required(),
        ValidationRules.email()
      ],
      'address.street': [
        ValidationRules.string(1, 200),
        ValidationRules.safeHtml()
      ],
      'address.suite': [
        ValidationRules.string(0, 100),
        ValidationRules.safeHtml()
      ],
      'address.city': [
        ValidationRules.string(1, 100),
        ValidationRules.safeHtml()
      ],
      'address.zipcode': [
        ValidationRules.pattern(/^[0-9]{5}(-[0-9]{4})?$/, 'Invalid zipcode format')
      ],
      'phone': [
        ValidationRules.pattern(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
      ],
      'website': [
        ValidationRules.url()
      ]
    };
  }

  /**
   * Schema for search/filter parameters
   */
  static searchParams(): ValidationSchema {
    return {
      'q': [
        ValidationRules.string(0, 100),
        ValidationRules.safeHtml(),
        ValidationRules.sqlSafe()
      ],
      'limit': [
        ValidationRules.integer(1, 100)
      ],
      'offset': [
        ValidationRules.integer(0, 10000)
      ],
      'sort': [
        ValidationRules.enum(['id', 'title', 'name', 'email', 'createdAt', 'updatedAt'])
      ],
      'order': [
        ValidationRules.enum(['asc', 'desc'])
      ]
    };
  }
}

// ===== VALIDATION HELPERS =====

export class ValidationHelpers {
  /**
   * Create a validator with common security settings
   */
  static createSecureValidator(): RequestValidator {
    return new RequestValidator({
      strictMode: true,
      autoSanitize: true,
      allowUnknownFields: false,
      sanitizationConfig: {
        enabled: true,
        strictMode: true,
        customPatterns: [
          // XSS patterns
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          // SQL injection patterns
          /('|(\\'))|((\s)*union(\s)+select(\s)*)/gi,
          /((\s)*or(\s)+1(\s)*=(\s)*1(\s)*)/gi
        ]
      }
    });
  }

  /**
   * Create a lenient validator for development
   */
  static createLenientValidator(): RequestValidator {
    return new RequestValidator({
      strictMode: false,
      autoSanitize: true,
      allowUnknownFields: true,
      sanitizationConfig: {
        enabled: true,
        strictMode: false
      }
    });
  }

  /**
   * Validate JSONPlaceholder API data quickly
   */
  static validatePost(data: any): ValidationResult {
    const validator = this.createSecureValidator();
    return validator.validate(data, CommonSchemas.post());
  }

  static validateComment(data: any): ValidationResult {
    const validator = this.createSecureValidator();
    return validator.validate(data, CommonSchemas.comment());
  }

  static validateUser(data: any): ValidationResult {
    const validator = this.createSecureValidator();
    return validator.validate(data, CommonSchemas.user());
  }

  static validateSearchParams(data: any): ValidationResult {
    const validator = this.createLenientValidator();
    return validator.validate(data, CommonSchemas.searchParams());
  }

  /**
   * Quickly check if data is safe for API requests
   */
  static isSafeForRequest(data: any): boolean {
    const validator = this.createSecureValidator();
    const result = validator.sanitize(data);
    return !result.blocked || result.blocked.length === 0;
  }

  /**
   * Sanitize data for safe API usage
   */
  static sanitizeForRequest(data: any): any {
    const validator = this.createSecureValidator();
    const result = validator.sanitize(data);
    return result.sanitized || data;
  }
}
