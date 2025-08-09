/**
 * Request Validation and Sanitization Helpers
 * 
 * This module provides comprehensive validation utilities for API requests,
 * including input validation, schema validation, and sanitization helpers.
 */

import { DataSanitizer, SanitizationResult } from './sanitization';

// ===== VALIDATION TYPES =====

export interface ValidationRule {
  name: string;
  validate: (value: unknown) => boolean;
  message: string;
  sanitize?: (value: unknown) => unknown;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: T;
  warnings: string[];
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  value: unknown;
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
      validate: (value: unknown) => value !== null && value !== undefined && value !== '',
      message: 'Field is required',
      sanitize: (value: unknown) => value
    };
  }

  /**
   * String validation with optional length constraints
   */
  static string(minLength?: number, maxLength?: number): ValidationRule {
    return {
      name: 'string',
      validate: (value: unknown) => {
        if (typeof value !== 'string') return false;
        if (minLength !== undefined && value.length < minLength) return false;
        if (maxLength !== undefined && value.length > maxLength) return false;
        return true;
      },
      message: `Must be a string${minLength ? ` (min: ${minLength})` : ''}${maxLength ? ` (max: ${maxLength})` : ''}`,
      sanitize: (value: unknown) => typeof value === 'string' ? value.trim() : String(value)
    };
  }

  /**
   * Number validation with optional range constraints
   */
  static number(min?: number, max?: number): ValidationRule {
    return {
      name: 'number',
      validate: (value: unknown) => {
        const num = Number(value);
        if (isNaN(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
      },
      message: `Must be a number${min !== undefined ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`,
      sanitize: (value: unknown) => Number(value)
    };
  }

  /**
   * Integer validation
   */
  static integer(min?: number, max?: number): ValidationRule {
    return {
      name: 'integer',
      validate: (value: unknown) => {
        const num = Number(value);
        if (isNaN(num) || !Number.isInteger(num)) return false;
        if (min !== undefined && num < min) return false;
        if (max !== undefined && num > max) return false;
        return true;
      },
      message: `Must be an integer${min !== undefined ? ` (min: ${min})` : ''}${max !== undefined ? ` (max: ${max})` : ''}`,
      sanitize: (value: unknown) => Math.floor(Number(value))
    };
  }

  /**
   * Email validation
   */
  static email(): ValidationRule {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      name: 'email',
      validate: (value: unknown) => typeof value === 'string' && emailRegex.test(value),
      message: 'Must be a valid email address',
      sanitize: (value: unknown) => typeof value === 'string' ? value.toLowerCase().trim() : value
    };
  }

  /**
   * URL validation
   */
  static url(): ValidationRule {
    return {
      name: 'url',
      validate: (value: unknown) => {
        if (typeof value !== 'string') return false;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Must be a valid URL',
      sanitize: (value: unknown) => typeof value === 'string' ? value.trim() : value
    };
  }

  /**
   * Array validation
   */
  static array(minLength?: number, maxLength?: number): ValidationRule {
    return {
      name: 'array',
      validate: (value: unknown) => {
        if (!Array.isArray(value)) return false;
        if (minLength !== undefined && value.length < minLength) return false;
        if (maxLength !== undefined && value.length > maxLength) return false;
        return true;
      },
      message: `Must be an array${minLength ? ` (min length: ${minLength})` : ''}${maxLength ? ` (max length: ${maxLength})` : ''}`,
      sanitize: (value: unknown) => Array.isArray(value) ? value : [value]
    };
  }

  /**
   * Enum validation
   */
  static enum(allowedValues: unknown[]): ValidationRule {
    return {
      name: 'enum',
      validate: (value: unknown) => allowedValues.includes(value),
      message: `Must be one of: ${allowedValues.join(', ')}`,
      sanitize: (value: unknown) => value
    };
  }

  /**
   * Pattern validation (regex)
   */
  static pattern(regex: RegExp, message?: string): ValidationRule {
    return {
      name: 'pattern',
      validate: (value: unknown) => typeof value === 'string' && regex.test(value),
      message: message || `Must match pattern: ${regex.toString()}`,
      sanitize: (value: unknown) => value
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
      validate: (value: unknown) => {
        if (typeof value !== 'string') return false;
        return !dangerousPatterns.some(pattern => pattern.test(value));
      },
      message: 'Contains potentially dangerous HTML content',
      sanitize: (value: unknown) => {
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
      validate: (value: unknown) => {
        if (typeof value !== 'string') return true;
        return !sqlPatterns.some(pattern => pattern.test(value));
      },
      message: 'Contains potentially dangerous SQL patterns',
      sanitize: (value: unknown) => {
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
  validate<T>(data: T, schema: ValidationSchema): ValidationResult<T> {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    const sanitizedData: T | undefined = this.config.autoSanitize ? this.deepClone(data) : undefined;

    // Validate each field in the schema
    for (const [fieldPath, rules] of Object.entries(schema)) {
  const value = this.getNestedValue(data as unknown as Record<string, unknown>, fieldPath);
      
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
        this.setNestedValue(sanitizedData as unknown as Record<string, unknown>, fieldPath, sanitizedValue);
              warnings.push(`Field '${fieldPath}' was automatically sanitized`);
            } catch {
              // Sanitization failed, keep the error
            }
          }
    } else if (this.config.autoSanitize && rule.sanitize && sanitizedData) {
          // Apply sanitization even for valid data
          try {
            const sanitizedValue = rule.sanitize(value);
      this.setNestedValue(sanitizedData as unknown as Record<string, unknown>, fieldPath, sanitizedValue);
          } catch (_error) {
            warnings.push(`Failed to sanitize field '${fieldPath}': ${(_error as Error).message}`);
          }
        }
      }
    }

    // Check for unknown fields if not allowed
    if (!this.config.allowUnknownFields) {
    const unknownFields = this.findUnknownFields(data as unknown as Record<string, unknown>, schema);
      unknownFields.forEach(field => {
        errors.push({
          field,
          rule: 'unknownField',
      message: 'Unknown field not allowed',
      value: this.getNestedValue(data as unknown as Record<string, unknown>, field)
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
  isValid<T>(data: T, schema: ValidationSchema): boolean {
    const result = this.validate(data, schema);
    return result.isValid;
  }

  /**
   * Sanitize data using the configured sanitizer
   */
  sanitize<T>(data: T): SanitizationResult {
    return this.sanitizer.sanitize(data);
  }

  /**
   * Validate and sanitize in one step
   */
  validateAndSanitize<T>(data: T, schema: ValidationSchema): ValidationResult<T> {
    const originalAutoSanitize = this.config.autoSanitize;
    this.config.autoSanitize = true;
    
    const result = this.validate(data, schema);
    
    this.config.autoSanitize = originalAutoSanitize;
    return result;
  }

  // ===== PRIVATE HELPER METHODS =====

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj as Record<string, any>);

    target[lastKey] = value;
  }

  private findUnknownFields(data: Record<string, unknown>, schema: ValidationSchema, prefix = ''): string[] {
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
        const nested = (data as Record<string, unknown>)[key];
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
          unknownFields.push(...this.findUnknownFields(nested as Record<string, unknown>, schema, fullPath));
        }
      }
    }

    return unknownFields;
  }

  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item)) as unknown as T;
    if (typeof obj === 'object') {
      const cloned: Record<string, unknown> = {};
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.deepClone((obj as Record<string, unknown>)[key]);
        }
      }
      return cloned as unknown as T;
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
        ValidationRules.pattern(/^[+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
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
  static validatePost<T>(data: T): ValidationResult<T> {
    const validator = this.createSecureValidator();
    return validator.validate(data, CommonSchemas.post());
  }

  static validateComment<T>(data: T): ValidationResult<T> {
    const validator = this.createSecureValidator();
    return validator.validate(data, CommonSchemas.comment());
  }

  static validateUser<T>(data: T): ValidationResult<T> {
    const validator = this.createSecureValidator();
    return validator.validate(data, CommonSchemas.user());
  }

  static validateSearchParams<T>(data: T): ValidationResult<T> {
    const validator = this.createLenientValidator();
    return validator.validate(data, CommonSchemas.searchParams());
  }

  /**
   * Quickly check if data is safe for API requests
   */
  static isSafeForRequest(data: unknown): boolean {
    const validator = this.createSecureValidator();
    const result = validator.sanitize(data);
    return !result.blocked || result.blocked.length === 0;
  }

  /**
   * Sanitize data for safe API usage
   */
  static sanitizeForRequest<T>(data: T): T {
    const validator = this.createSecureValidator();
    const result = validator.sanitize(data);
    return (result.sanitized || data) as T;
  }
}
