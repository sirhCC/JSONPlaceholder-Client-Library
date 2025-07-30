/**
 * Data Sanitization Utilities
 * 
 * Provides utilities for sanitizing request/response data to prevent
 * XSS attacks, SQL injection, and other security vulnerabilities.
 */

export interface SanitizationConfig {
  enabled: boolean;
  stripHtml: boolean;
  trimWhitespace: boolean;
  maxStringLength: number;
  allowedTags: string[];
  blockedPatterns: RegExp[];
}

export interface SanitizationResult {
  sanitized: unknown;
  warnings: string[];
  blocked: string[];
}

/**
 * Default sanitization configuration
 */
export const defaultSanitizationConfig: SanitizationConfig = {
  enabled: true,
  stripHtml: true,
  trimWhitespace: true,
  maxStringLength: 10000, // 10KB max string length
  allowedTags: [], // No HTML tags allowed by default
  blockedPatterns: [
    /<script[^>]*>.*?<\/script>/gis,  // Block script tags with content
    /javascript:\s*/gi,               // Block javascript: URLs
    /on\w+\s*=/gi,                   // Block event handlers (onclick, onload, etc.)
    /data:.*base64/gi,               // Block base64 data URLs  
    /vbscript:\s*/gi,                // Block VBScript
    /<iframe[^>]*>/gi,               // Block iframes
    /<object[^>]*>/gi,               // Block objects
    /<embed[^>]*>/gi                 // Block embeds
  ]
};

/**
 * Data Sanitizer - Provides methods for sanitizing various data types
 */
export class DataSanitizer {
  private config: SanitizationConfig;

  constructor(config: Partial<SanitizationConfig> = {}) {
    this.config = { ...defaultSanitizationConfig, ...config };
  }

  /**
   * Sanitize any data structure (object, array, string, etc.)
   */
  sanitize(data: unknown): SanitizationResult {
    if (!this.config.enabled) {
      return {
        sanitized: data,
        warnings: [],
        blocked: []
      };
    }

    const warnings: string[] = [];
    const blocked: string[] = [];

    const sanitized = this.sanitizeValue(data, warnings, blocked);

    return {
      sanitized,
      warnings,
      blocked
    };
  }

  /**
   * Sanitize a single value recursively
   */
  private sanitizeValue(value: unknown, warnings: string[], blocked: string[]): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeStringInternal(value, warnings, blocked);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item, warnings, blocked));
    }

    if (typeof value === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        const sanitizedKey = this.sanitizeStringInternal(key, warnings, blocked);
        sanitized[sanitizedKey] = this.sanitizeValue(val, warnings, blocked);
      }
      return sanitized;
    }

    // Numbers, booleans, etc. are safe as-is
    return value;
  }

  /**
   * Sanitize a string value
   */
  private sanitizeStringInternal(str: string, warnings: string[], blocked: string[]): string {
    let sanitized = str;

    // Check string length
    if (sanitized.length > this.config.maxStringLength) {
      sanitized = sanitized.substring(0, this.config.maxStringLength);
      warnings.push(`String truncated to ${this.config.maxStringLength} characters`);
    }

    // Check for blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(sanitized)) {
        const matches = sanitized.match(pattern);
        if (matches) {
          for (const match of matches) {
            blocked.push(`Blocked pattern: ${match}`);
          }
          sanitized = sanitized.replace(pattern, '');
        }
      }
    }

    // Strip HTML if configured
    if (this.config.stripHtml) {
      const htmlPattern = /<[^>]*>/g;
      if (htmlPattern.test(sanitized)) {
        const matches = sanitized.match(htmlPattern);
        if (matches) {
          const allowedTags = this.config.allowedTags;
          for (const tag of matches) {
            const tagName = tag.match(/<\/?(\w+)/)?.[1]?.toLowerCase();
            if (!tagName || !allowedTags.includes(tagName)) {
              sanitized = sanitized.replace(tag, '');
              warnings.push(`Removed HTML tag: ${tag}`);
            }
          }
        }
      }
    }

    // Trim whitespace if configured
    if (this.config.trimWhitespace) {
      const original = sanitized;
      sanitized = sanitized.trim();
      if (original !== sanitized) {
        warnings.push('Trimmed whitespace');
      }
    }

    return sanitized;
  }

  /**
   * Update sanitization configuration
   */
  updateConfig(config: Partial<SanitizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): SanitizationConfig {
    return { ...this.config };
  }

  /**
   * Quick method to sanitize just strings (convenience method)
   */
  sanitizeString(str: string): string {
    const result = this.sanitize(str);
    return result.sanitized as string;
  }

  /**
   * Check if data contains potentially dangerous content
   */
  isDangerous(data: unknown): boolean {
    const result = this.sanitize(data);
    return result.blocked.length > 0;
  }
}
