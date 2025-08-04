/**
 * TLS Security Manager - Enforce TLS 1.3 and advanced encryption standards
 * Provides enterprise-grade network security for API communications
 */

export interface TLSSecurityConfig {
  enabled: boolean;
  minTlsVersion: '1.2' | '1.3';
  enforceTls13: boolean;
  allowedCipherSuites: string[];
  certificatePinning: boolean;
  pinnedCertificates: string[];
  ocspStapling: boolean;
  hsts: {
    enabled: boolean;
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  };
  securityHeaders: {
    enforceSecurityHeaders: boolean;
    expectedHeaders: Record<string, string>;
  };
}

export interface TLSConnectionInfo {
  protocol: string;
  cipherSuite: string;
  certificateValid: boolean;
  certificateFingerprint: string;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
}

export interface TLSSecurityStats {
  totalConnections: number;
  secureConnections: number;
  tls13Connections: number;
  certificateViolations: number;
  securityHeaderViolations: number;
  blockedConnections: number;
}

/**
 * TLS Security Manager for enforcing encryption standards
 */
export class TLSSecurityManager {
  private config: TLSSecurityConfig;
  private stats: TLSSecurityStats;
  private pinnedCerts = new Set<string>();
  private connectionCache = new Map<string, TLSConnectionInfo>();

  constructor(config: Partial<TLSSecurityConfig> = {}) {
    this.config = {
      enabled: true,
      minTlsVersion: '1.3',
      enforceTls13: true,
      allowedCipherSuites: [
        'TLS_AES_256_GCM_SHA384',
        'TLS_AES_128_GCM_SHA256',
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_CCM_SHA256',
        'TLS_AES_128_CCM_8_SHA256'
      ],
      certificatePinning: true,
      pinnedCertificates: [],
      ocspStapling: true,
      hsts: {
        enabled: true,
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      securityHeaders: {
        enforceSecurityHeaders: true,
        expectedHeaders: {
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Content-Security-Policy': "default-src 'self'"
        }
      },
      ...config
    };

    this.stats = {
      totalConnections: 0,
      secureConnections: 0,
      tls13Connections: 0,
      certificateViolations: 0,
      securityHeaderViolations: 0,
      blockedConnections: 0
    };

    this.initializePinnedCertificates();
  }

  /**
   * Validate TLS configuration for a request
   */
  validateTLSRequest(url: string, options: any = {}): TLSValidationResult {
    const result: TLSValidationResult = {
      allowed: true,
      securityLevel: 'high',
      warnings: [],
      connectionInfo: null
    };

    if (!this.config.enabled) {
      return result;
    }

    this.stats.totalConnections++;

    // Check protocol
    if (!url.startsWith('https://')) {
      result.allowed = false;
      result.securityLevel = 'critical';
      result.warnings.push('HTTPS required - HTTP connections are not allowed');
      this.stats.blockedConnections++;
      return result;
    }

    // Check TLS version in options
    if (options.secureProtocol) {
      const isValidTLS = this.validateTLSVersion(options.secureProtocol);
      if (!isValidTLS) {
        result.allowed = this.config.enforceTls13 ? false : true;
        result.securityLevel = 'low';
        result.warnings.push(`TLS version ${options.secureProtocol} is below minimum requirement`);
      }
    }

    // Set secure defaults
    this.applySecureTLSDefaults(options);

    return result;
  }

  /**
   * Validate TLS response and headers
   */
  validateTLSResponse(response: any, url: string): TLSValidationResult {
    const result: TLSValidationResult = {
      allowed: true,
      securityLevel: 'high',
      warnings: [],
      connectionInfo: this.extractConnectionInfo(response)
    };

    // Validate security headers
    if (this.config.securityHeaders.enforceSecurityHeaders) {
      const headerViolations = this.validateSecurityHeaders(response.headers || {});
      if (headerViolations.length > 0) {
        result.warnings.push(...headerViolations);
        result.securityLevel = 'medium';
        this.stats.securityHeaderViolations++;
      }
    }

    // Validate certificate if pinning is enabled
    if (this.config.certificatePinning && result.connectionInfo) {
      const certValid = this.validateCertificatePinning(result.connectionInfo);
      if (!certValid) {
        result.allowed = false;
        result.securityLevel = 'critical';
        result.warnings.push('Certificate pinning validation failed');
        this.stats.certificateViolations++;
        this.stats.blockedConnections++;
        return result;
      }
    }

    // Update stats
    this.updateConnectionStats(result.connectionInfo);

    return result;
  }

  /**
   * Apply secure TLS defaults to request options
   */
  applySecureTLSDefaults(options: any): void {
    if (!this.config.enabled) return;

    // Force TLS 1.3 if enforced
    if (this.config.enforceTls13) {
      options.secureProtocol = 'TLSv1_3_method';
    } else {
      options.secureProtocol = 'TLSv1_2_method';
    }

    // Set cipher suites
    if (this.config.allowedCipherSuites.length > 0) {
      options.ciphers = this.config.allowedCipherSuites.join(':');
    }

    // Enable OCSP stapling
    if (this.config.ocspStapling) {
      options.requestOCSP = true;
    }

    // Additional security options
    options.rejectUnauthorized = true;
    options.checkServerIdentity = this.createServerIdentityChecker();
    options.honorCipherOrder = true;
    options.ecdhCurve = 'auto';
  }

  /**
   * Get TLS security statistics
   */
  getStats(): TLSSecurityStats {
    return { ...this.stats };
  }

  /**
   * Add pinned certificate
   */
  addPinnedCertificate(fingerprint: string): void {
    this.pinnedCerts.add(fingerprint.toLowerCase());
    this.config.pinnedCertificates.push(fingerprint);
  }

  /**
   * Remove pinned certificate
   */
  removePinnedCertificate(fingerprint: string): void {
    this.pinnedCerts.delete(fingerprint.toLowerCase());
    this.config.pinnedCertificates = this.config.pinnedCertificates.filter(
      cert => cert.toLowerCase() !== fingerprint.toLowerCase()
    );
  }

  /**
   * Create security report
   */
  generateSecurityReport(): TLSSecurityReport {
    const total = this.stats.totalConnections;
    const secure = this.stats.secureConnections;
    const tls13 = this.stats.tls13Connections;

    return {
      timestamp: new Date().toISOString(),
      totalConnections: total,
      securityScore: total > 0 ? Math.round((secure / total) * 100) : 100,
      tls13AdoptionRate: secure > 0 ? Math.round((tls13 / secure) * 100) : 0,
      certificateViolations: this.stats.certificateViolations,
      securityHeaderViolations: this.stats.securityHeaderViolations,
      blockedConnections: this.stats.blockedConnections,
      recommendations: this.generateRecommendations()
    };
  }

  private validateTLSVersion(protocol: string): boolean {
    const tlsVersionMap: Record<string, number> = {
      'TLSv1_method': 1.0,
      'TLSv1_1_method': 1.1,
      'TLSv1_2_method': 1.2,
      'TLSv1_3_method': 1.3
    };

    const version = tlsVersionMap[protocol];
    const minVersion = this.config.minTlsVersion === '1.3' ? 1.3 : 1.2;

    return version >= minVersion;
  }

  private validateSecurityHeaders(headers: Record<string, string>): string[] {
    const violations: string[] = [];
    
    for (const [headerName, expectedValue] of Object.entries(this.config.securityHeaders.expectedHeaders)) {
      const actualValue = headers[headerName] || headers[headerName.toLowerCase()];
      
      if (!actualValue) {
        violations.push(`Missing security header: ${headerName}`);
      } else if (headerName === 'Strict-Transport-Security' && this.config.hsts.enabled) {
        if (!this.validateHSTSHeader(actualValue)) {
          violations.push(`Invalid HSTS header: ${actualValue}`);
        }
      }
    }

    return violations;
  }

  private validateHSTSHeader(value: string): boolean {
    const hstsConfig = this.config.hsts;
    const hasMaxAge = value.includes(`max-age=${hstsConfig.maxAge}`);
    const hasIncludeSubDomains = !hstsConfig.includeSubDomains || value.includes('includeSubDomains');
    const hasPreload = !hstsConfig.preload || value.includes('preload');

    return hasMaxAge && hasIncludeSubDomains && hasPreload;
  }

  private validateCertificatePinning(connectionInfo: TLSConnectionInfo): boolean {
    if (this.pinnedCerts.size === 0) {
      return true; // No pinning configured
    }

    return this.pinnedCerts.has(connectionInfo.certificateFingerprint.toLowerCase());
  }

  private extractConnectionInfo(response: any): TLSConnectionInfo | null {
    // This would be implemented based on the HTTP client being used
    // For now, return a mock implementation
    return {
      protocol: 'TLSv1.3',
      cipherSuite: 'TLS_AES_256_GCM_SHA384',
      certificateValid: true,
      certificateFingerprint: 'mock_fingerprint',
      securityLevel: 'high',
      warnings: []
    };
  }

  private createServerIdentityChecker() {
    return (hostname: string, cert: any): Error | undefined => {
      // Custom certificate validation logic
      if (this.config.certificatePinning && this.pinnedCerts.size > 0) {
        const fingerprint = this.getCertificateFingerprint(cert);
        if (!this.pinnedCerts.has(fingerprint.toLowerCase())) {
          return new Error(`Certificate pinning failure for ${hostname}`);
        }
      }
      return undefined;
    };
  }

  private getCertificateFingerprint(cert: any): string {
    // Mock implementation - would compute actual fingerprint
    return 'mock_fingerprint';
  }

  private updateConnectionStats(connectionInfo: TLSConnectionInfo | null): void {
    if (!connectionInfo) return;

    this.stats.secureConnections++;
    
    if (connectionInfo.protocol === 'TLSv1.3') {
      this.stats.tls13Connections++;
    }
  }

  private initializePinnedCertificates(): void {
    this.config.pinnedCertificates.forEach(cert => {
      this.pinnedCerts.add(cert.toLowerCase());
    });
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.stats;

    if (stats.totalConnections > 0) {
      const securityRate = (stats.secureConnections / stats.totalConnections) * 100;
      const tls13Rate = stats.secureConnections > 0 ? (stats.tls13Connections / stats.secureConnections) * 100 : 0;

      if (securityRate < 95) {
        recommendations.push('Increase HTTPS adoption rate for better security');
      }

      if (tls13Rate < 80) {
        recommendations.push('Consider enforcing TLS 1.3 for improved security');
      }

      if (stats.certificateViolations > 0) {
        recommendations.push('Review and update certificate pinning configuration');
      }

      if (stats.securityHeaderViolations > 5) {
        recommendations.push('Ensure all responses include proper security headers');
      }
    }

    return recommendations;
  }
}

/**
 * TLS validation result interface
 */
export interface TLSValidationResult {
  allowed: boolean;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  connectionInfo: TLSConnectionInfo | null;
}

/**
 * TLS security report interface
 */
export interface TLSSecurityReport {
  timestamp: string;
  totalConnections: number;
  securityScore: number;
  tls13AdoptionRate: number;
  certificateViolations: number;
  securityHeaderViolations: number;
  blockedConnections: number;
  recommendations: string[];
}

/**
 * Default TLS security manager instance
 */
export const defaultTLSSecurityManager = new TLSSecurityManager({
  enforceTls13: true,
  certificatePinning: false, // Disabled by default for easier setup
  hsts: {
    enabled: true,
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * TLS Security utilities
 */
export const TLSSecurityUtils = {
  /**
   * Check if URL uses secure protocol
   */
  isSecureUrl(url: string): boolean {
    return url.startsWith('https://');
  },

  /**
   * Get security level for a connection
   */
  getSecurityLevel(protocol: string, cipherSuite: string): 'low' | 'medium' | 'high' | 'critical' {
    if (protocol === 'TLSv1.3') {
      return 'high';
    } else if (protocol === 'TLSv1.2') {
      return 'medium';
    } else {
      return 'low';
    }
  },

  /**
   * Generate secure request options
   */
  createSecureRequestOptions(options: any = {}): any {
    return {
      ...options,
      rejectUnauthorized: true,
      secureProtocol: 'TLSv1_3_method',
      honorCipherOrder: true,
      ecdhCurve: 'auto'
    };
  }
};
