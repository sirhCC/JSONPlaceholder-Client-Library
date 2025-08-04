/**
 * Enhanced CSRF Protection Manager - Advanced Cross-Site Request Forgery prevention
 * Implements double-submit cookies, SameSite enforcement, and advanced token validation
 */

export interface CSRFProtectionConfig {
  enabled: boolean;
  tokenName: string;
  cookieName: string;
  doubleSubmit: boolean;
  sameSitePolicy: 'strict' | 'lax' | 'none';
  secure: boolean;
  httpOnly: boolean;
  tokenExpiry: number; // milliseconds
  rotationInterval: number; // milliseconds
  customHeaderName: string;
  allowedOrigins: string[];
  refererChecking: boolean;
  tokenEntropy: number; // bits
}

export interface CSRFToken {
  value: string;
  expires: number;
  created: number;
  origin?: string;
  sessionId?: string;
}

export interface CSRFValidationResult {
  valid: boolean;
  reason?: string;
  securityLevel: 'low' | 'medium' | 'high';
  warnings: string[];
  tokenInfo?: {
    age: number;
    remaining: number;
    rotationDue: boolean;
  };
}

export interface CSRFSecurityStats {
  tokensGenerated: number;
  tokensValidated: number;
  tokensRejected: number;
  doubleSubmitViolations: number;
  originViolations: number;
  refererViolations: number;
  expiredTokens: number;
  rotatedTokens: number;
}

/**
 * Enhanced CSRF Protection Manager
 */
export class CSRFProtectionManager {
  private config: CSRFProtectionConfig;
  private tokenStore = new Map<string, CSRFToken>();
  private stats: CSRFSecurityStats;
  private rotationTimer?: NodeJS.Timeout;

  constructor(config: Partial<CSRFProtectionConfig> = {}) {
    this.config = {
      enabled: true,
      tokenName: 'csrf-token',
      cookieName: '__csrf-token',
      doubleSubmit: true,
      sameSitePolicy: 'strict',
      secure: true,
      httpOnly: true,
      tokenExpiry: 3600000, // 1 hour
      rotationInterval: 1800000, // 30 minutes
      customHeaderName: 'X-CSRF-Token',
      allowedOrigins: [],
      refererChecking: true,
      tokenEntropy: 256, // bits
      ...config
    };

    this.stats = {
      tokensGenerated: 0,
      tokensValidated: 0,
      tokensRejected: 0,
      doubleSubmitViolations: 0,
      originViolations: 0,
      refererViolations: 0,
      expiredTokens: 0,
      rotatedTokens: 0
    };

    this.startTokenRotation();
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(sessionId?: string, origin?: string): CSRFToken {
    const tokenValue = this.createSecureToken();
    const now = Date.now();
    
    const token: CSRFToken = {
      value: tokenValue,
      expires: now + this.config.tokenExpiry,
      created: now,
      origin,
      sessionId
    };

    this.tokenStore.set(tokenValue, token);
    this.stats.tokensGenerated++;

    // Clean up expired tokens
    this.cleanupExpiredTokens();

    return token;
  }

  /**
   * Validate CSRF token for a request
   */
  validateToken(
    tokenValue: string,
    request: {
      headers?: Record<string, string>;
      cookies?: Record<string, string>;
      origin?: string;
      referer?: string;
      method?: string;
    }
  ): CSRFValidationResult {
    if (!this.config.enabled) {
      return {
        valid: true,
        securityLevel: 'low',
        warnings: ['CSRF protection is disabled']
      };
    }

    // Skip validation for safe methods
    if (request.method && ['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
      return {
        valid: true,
        securityLevel: 'medium',
        warnings: []
      };
    }

    this.stats.tokensValidated++;

    const result: CSRFValidationResult = {
      valid: false,
      securityLevel: 'high',
      warnings: []
    };

    // Check if token exists
    const storedToken = this.tokenStore.get(tokenValue);
    if (!storedToken) {
      this.stats.tokensRejected++;
      return {
        ...result,
        reason: 'Token not found or invalid',
        securityLevel: 'low'
      };
    }

    // Check token expiry
    const now = Date.now();
    if (storedToken.expires < now) {
      this.stats.expiredTokens++;
      this.stats.tokensRejected++;
      this.tokenStore.delete(tokenValue);
      return {
        ...result,
        reason: 'Token has expired',
        securityLevel: 'low'
      };
    }

    // Validate double-submit cookie
    if (this.config.doubleSubmit) {
      const cookieToken = request.cookies?.[this.config.cookieName];
      if (!cookieToken || cookieToken !== tokenValue) {
        this.stats.doubleSubmitViolations++;
        this.stats.tokensRejected++;
        return {
          ...result,
          reason: 'Double-submit cookie validation failed',
          securityLevel: 'low'
        };
      }
    }

    // Validate custom header
    const headerToken = request.headers?.[this.config.customHeaderName.toLowerCase()];
    if (!headerToken || headerToken !== tokenValue) {
      this.stats.tokensRejected++;
      return {
        ...result,
        reason: 'Custom header validation failed',
        securityLevel: 'low'
      };
    }

    // Validate origin
    if (this.config.allowedOrigins.length > 0 && request.origin) {
      if (!this.isOriginAllowed(request.origin)) {
        this.stats.originViolations++;
        this.stats.tokensRejected++;
        return {
          ...result,
          reason: 'Origin not allowed',
          securityLevel: 'low'
        };
      }
    }

    // Validate referer
    if (this.config.refererChecking && request.referer) {
      if (!this.isRefererValid(request.referer, request.origin)) {
        this.stats.refererViolations++;
        this.stats.tokensRejected++;
        return {
          ...result,
          reason: 'Referer validation failed',
          securityLevel: 'low'
        };
      }
    }

    // Check if token needs rotation
    const age = now - storedToken.created;
    const rotationDue = age > this.config.rotationInterval;

    if (rotationDue) {
      result.warnings.push('Token rotation recommended');
    }

    return {
      valid: true,
      securityLevel: 'high',
      warnings: result.warnings,
      tokenInfo: {
        age,
        remaining: storedToken.expires - now,
        rotationDue
      }
    };
  }

  /**
   * Rotate a token (generate new one and invalidate old)
   */
  rotateToken(oldTokenValue: string, sessionId?: string, origin?: string): CSRFToken | null {
    const oldToken = this.tokenStore.get(oldTokenValue);
    if (!oldToken) {
      return null;
    }

    // Generate new token
    const newToken = this.generateToken(sessionId || oldToken.sessionId, origin || oldToken.origin);
    
    // Remove old token
    this.tokenStore.delete(oldTokenValue);
    this.stats.rotatedTokens++;

    return newToken;
  }

  /**
   * Create cookie configuration for CSRF token
   */
  createCookieConfig(): CSRFCookieConfig {
    return {
      name: this.config.cookieName,
      secure: this.config.secure,
      httpOnly: this.config.httpOnly,
      sameSite: this.config.sameSitePolicy,
      maxAge: Math.floor(this.config.tokenExpiry / 1000), // Convert to seconds
      path: '/'
    };
  }

  /**
   * Create request headers for CSRF protection
   */
  createRequestHeaders(tokenValue: string): Record<string, string> {
    return {
      [this.config.customHeaderName]: tokenValue
    };
  }

  /**
   * Get CSRF protection statistics
   */
  getStats(): CSRFSecurityStats {
    return { ...this.stats };
  }

  /**
   * Get active token count
   */
  getActiveTokenCount(): number {
    return this.tokenStore.size;
  }

  /**
   * Clear all tokens (useful for logout)
   */
  clearAllTokens(): void {
    this.tokenStore.clear();
  }

  /**
   * Clear tokens for a specific session
   */
  clearSessionTokens(sessionId: string): void {
    for (const [tokenValue, token] of this.tokenStore.entries()) {
      if (token.sessionId === sessionId) {
        this.tokenStore.delete(tokenValue);
      }
    }
  }

  /**
   * Generate CSRF security report
   */
  generateSecurityReport(): CSRFSecurityReport {
    const total = this.stats.tokensValidated;
    const rejected = this.stats.tokensRejected;
    const successRate = total > 0 ? Math.round(((total - rejected) / total) * 100) : 100;

    return {
      timestamp: new Date().toISOString(),
      totalValidations: total,
      successRate,
      rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
      activeTokens: this.tokenStore.size,
      doubleSubmitViolations: this.stats.doubleSubmitViolations,
      originViolations: this.stats.originViolations,
      refererViolations: this.stats.refererViolations,
      expiredTokens: this.stats.expiredTokens,
      rotatedTokens: this.stats.rotatedTokens,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Destroy the CSRF manager and cleanup resources
   */
  destroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
    this.tokenStore.clear();
  }

  private createSecureToken(): string {
    // Generate cryptographically secure random token
    const bytes = Math.ceil(this.config.tokenEntropy / 8);
    const randomBytes = new Uint8Array(bytes);
    
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBytes);
    } else {
      // Fallback for Node.js environment
      for (let i = 0; i < bytes; i++) {
        randomBytes[i] = Math.floor(Math.random() * 256);
      }
    }

    // Convert to base64url
    return this.uint8ArrayToBase64Url(randomBytes);
  }

  private uint8ArrayToBase64Url(bytes: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.config.allowedOrigins.length === 0) {
      return true;
    }
    
    return this.config.allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin === '*') return true;
      if (allowedOrigin.endsWith('*')) {
        const prefix = allowedOrigin.slice(0, -1);
        return origin.startsWith(prefix);
      }
      return origin === allowedOrigin;
    });
  }

  private isRefererValid(referer: string, origin?: string): boolean {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      
      if (origin) {
        return refererOrigin === origin;
      }
      
      return this.isOriginAllowed(refererOrigin);
    } catch {
      return false;
    }
  }

  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [tokenValue, token] of this.tokenStore.entries()) {
      if (token.expires < now) {
        this.tokenStore.delete(tokenValue);
        expiredCount++;
      }
    }

    this.stats.expiredTokens += expiredCount;
  }

  private startTokenRotation(): void {
    if (this.config.rotationInterval > 0) {
      this.rotationTimer = setInterval(() => {
        this.cleanupExpiredTokens();
      }, Math.min(this.config.rotationInterval, 300000)); // At least every 5 minutes
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.stats;

    if (stats.tokensValidated > 0) {
      const rejectionRate = (stats.tokensRejected / stats.tokensValidated) * 100;
      
      if (rejectionRate > 10) {
        recommendations.push('High token rejection rate - review CSRF configuration');
      }

      if (stats.doubleSubmitViolations > 5) {
        recommendations.push('Multiple double-submit violations detected');
      }

      if (stats.originViolations > 0) {
        recommendations.push('Review allowed origins configuration');
      }

      if (stats.expiredTokens > stats.tokensGenerated * 0.1) {
        recommendations.push('Consider increasing token expiry time');
      }
    }

    if (this.config.sameSitePolicy !== 'strict') {
      recommendations.push('Consider using strict SameSite policy for enhanced security');
    }

    if (!this.config.secure) {
      recommendations.push('Enable secure cookies for production environments');
    }

    return recommendations;
  }
}

/**
 * CSRF cookie configuration interface
 */
export interface CSRFCookieConfig {
  name: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

/**
 * CSRF security report interface
 */
export interface CSRFSecurityReport {
  timestamp: string;
  totalValidations: number;
  successRate: number;
  rejectionRate: number;
  activeTokens: number;
  doubleSubmitViolations: number;
  originViolations: number;
  refererViolations: number;
  expiredTokens: number;
  rotatedTokens: number;
  recommendations: string[];
}

/**
 * Default CSRF protection manager instance
 */
export const defaultCSRFProtectionManager = new CSRFProtectionManager({
  sameSitePolicy: 'strict',
  secure: true,
  doubleSubmit: true,
  refererChecking: true,
  tokenExpiry: 3600000, // 1 hour
  rotationInterval: 1800000 // 30 minutes
});

/**
 * CSRF Protection utilities
 */
export const CSRFProtectionUtils = {
  /**
   * Extract CSRF token from various request sources
   */
  extractToken(request: {
    headers?: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  }, config: CSRFProtectionConfig): string | null {
    // Check custom header
    const headerToken = request.headers?.[config.customHeaderName.toLowerCase()];
    if (headerToken) return headerToken;

    // Check form data
    if (request.body && typeof request.body === 'object') {
      const bodyToken = request.body[config.tokenName];
      if (bodyToken) return bodyToken;
    }

    // Check query parameters
    const queryToken = request.query?.[config.tokenName];
    if (queryToken) return queryToken;

    return null;
  },

  /**
   * Create CSRF token input for forms
   */
  createHiddenInput(tokenValue: string, tokenName: string = 'csrf-token'): string {
    return `<input type="hidden" name="${tokenName}" value="${tokenValue}">`;
  },

  /**
   * Create meta tag for CSRF token
   */
  createMetaTag(tokenValue: string, tokenName: string = 'csrf-token'): string {
    return `<meta name="${tokenName}" content="${tokenValue}">`;
  },

  /**
   * Validate request method for CSRF protection
   */
  requiresCSRFProtection(method: string): boolean {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS', 'TRACE'];
    return !safeMethods.includes(method.toUpperCase());
  }
};
