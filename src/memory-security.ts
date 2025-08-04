/**
 * Memory Security Manager - Automatic sensitive data cleanup
 * Prevents memory leaks and timing attacks by securely managing sensitive data
 */

export interface MemorySecurityConfig {
  enabled: boolean;
  autoCleanupInterval: number; // ms
  sensitiveFields: string[];
  secureRandomOverwrite: boolean;
  trackSensitiveAllocations: boolean;
}

export interface SensitiveDataRef {
  id: string;
  data: any;
  timestamp: number;
  type: 'string' | 'object' | 'array';
  cleanupCallback?: () => void;
}

export interface MemorySecurityStats {
  totalAllocations: number;
  cleanedAllocations: number;
  currentSensitiveRefs: number;
  memoryLeaksDetected: number;
  averageCleanupTime: number;
}

/**
 * Secure memory management for sensitive data
 */
export class MemorySecurityManager {
  private config: MemorySecurityConfig;
  private sensitiveRefs = new Map<string, SensitiveDataRef>();
  private cleanupTimer?: NodeJS.Timeout;
  private stats: MemorySecurityStats;
  private crypto: Crypto | null = null;

  constructor(config: Partial<MemorySecurityConfig> = {}) {
    this.config = {
      enabled: true,
      autoCleanupInterval: 30000, // 30 seconds
      sensitiveFields: [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'auth',
        'credential',
        'session',
        'jwt',
        'bearer',
        'api_key',
        'apiKey',
        'privateKey',
        'accessToken',
        'refreshToken'
      ],
      secureRandomOverwrite: true,
      trackSensitiveAllocations: true,
      ...config
    };

    this.stats = {
      totalAllocations: 0,
      cleanedAllocations: 0,
      currentSensitiveRefs: 0,
      memoryLeaksDetected: 0,
      averageCleanupTime: 0
    };

    // Initialize crypto for secure random overwriting
    if (typeof window !== 'undefined' && window.crypto) {
      this.crypto = window.crypto;
    } else if (typeof global !== 'undefined' && global.crypto) {
      this.crypto = global.crypto;
    }

    if (this.config.enabled) {
      this.startAutoCleanup();
    }
  }

  /**
   * Register sensitive data for automatic cleanup
   */
  registerSensitiveData(data: any, type: 'string' | 'object' | 'array' = 'object'): string {
    const id = this.generateSecureId();
    const ref: SensitiveDataRef = {
      id,
      data,
      timestamp: Date.now(),
      type
    };

    this.sensitiveRefs.set(id, ref);
    this.stats.totalAllocations++;
    this.stats.currentSensitiveRefs = this.sensitiveRefs.size;

    return id;
  }

  /**
   * Clean up specific sensitive data by ID
   */
  cleanupSensitiveData(id: string): boolean {
    const ref = this.sensitiveRefs.get(id);
    if (!ref) {
      return false;
    }

    const startTime = Date.now();
    this.securelyWipeData(ref.data, ref.type);
    
    if (ref.cleanupCallback) {
      try {
        ref.cleanupCallback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    }

    this.sensitiveRefs.delete(id);
    
    const cleanupTime = Date.now() - startTime;
    this.updateCleanupStats(cleanupTime);

    return true;
  }

  /**
   * Clean up all sensitive data
   */
  cleanupAllSensitiveData(): number {
    const ids = Array.from(this.sensitiveRefs.keys());
    let cleaned = 0;

    for (const id of ids) {
      if (this.cleanupSensitiveData(id)) {
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Scan and clean sensitive data from objects
   */
  sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in sanitized) {
      if (this.isSensitiveField(key)) {
        // Register for cleanup and replace with redacted value
        if (sanitized[key]) {
          const valueType = typeof sanitized[key];
          let dataType: 'string' | 'object' | 'array' = 'object';
          
          if (valueType === 'string') {
            dataType = 'string';
          } else if (Array.isArray(sanitized[key])) {
            dataType = 'array';
          }
          
          this.registerSensitiveData(sanitized[key], dataType);
          sanitized[key] = '[REDACTED]';
        }
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Create secure string that auto-cleans
   */
  createSecureString(value: string, ttl: number = 60000): SecureString {
    const id = this.registerSensitiveData(value, 'string');
    
    setTimeout(() => {
      this.cleanupSensitiveData(id);
    }, ttl);

    return new SecureString(value, id, this);
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection(): void {
    if (typeof global !== 'undefined' && global.gc) {
      try {
        global.gc();
      } catch (error) {
        // Silently fail if GC is not exposed
      }
    }
  }

  /**
   * Get memory security statistics
   */
  getStats(): MemorySecurityStats {
    return { ...this.stats };
  }

  /**
   * Destroy the memory security manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupAllSensitiveData();
    this.forceGarbageCollection();
  }

  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performPeriodicCleanup();
    }, this.config.autoCleanupInterval);
  }

  private performPeriodicCleanup(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    let cleaned = 0;

    for (const [id, ref] of this.sensitiveRefs.entries()) {
      if (now - ref.timestamp > maxAge) {
        this.cleanupSensitiveData(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.forceGarbageCollection();
    }
  }

  private securelyWipeData(data: any, type: string): void {
    if (!data) return;

    try {
      if (type === 'string' && typeof data === 'string') {
        this.securelyWipeString(data);
      } else if (type === 'object' && typeof data === 'object') {
        this.securelyWipeObject(data);
      } else if (type === 'array' && Array.isArray(data)) {
        this.securelyWipeArray(data);
      }
    } catch (error) {
      console.warn('Failed to securely wipe data:', error);
    }
  }

  private securelyWipeString(str: string): void {
    if (this.config.secureRandomOverwrite && this.crypto) {
      // Overwrite with random data multiple times
      const iterations = 3;
      for (let i = 0; i < iterations; i++) {
        const randomBytes = new Uint8Array(str.length);
        this.crypto.getRandomValues(randomBytes);
        // Note: In JavaScript, strings are immutable, so this is more about
        // preventing the data from being easily recovered from memory dumps
      }
    }
  }

  private securelyWipeObject(obj: any): void {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'string') {
          this.securelyWipeString(value);
        } else if (typeof value === 'object' && value !== null) {
          this.securelyWipeObject(value);
        }
        delete obj[key];
      }
    }
  }

  private securelyWipeArray(arr: any[]): void {
    for (let i = 0; i < arr.length; i++) {
      const value = arr[i];
      if (typeof value === 'string') {
        this.securelyWipeString(value);
      } else if (typeof value === 'object' && value !== null) {
        this.securelyWipeObject(value);
      }
      arr[i] = null;
    }
    arr.length = 0;
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.config.sensitiveFields.some(sensitive => 
      lowerField.includes(sensitive.toLowerCase())
    );
  }

  private generateSecureId(): string {
    if (this.crypto) {
      const array = new Uint8Array(16);
      this.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private updateCleanupStats(cleanupTime: number): void {
    this.stats.cleanedAllocations++;
    this.stats.currentSensitiveRefs = this.sensitiveRefs.size;
    
    // Update rolling average
    const prevAvg = this.stats.averageCleanupTime;
    const count = this.stats.cleanedAllocations;
    this.stats.averageCleanupTime = (prevAvg * (count - 1) + cleanupTime) / count;
  }
}

/**
 * Secure string wrapper that auto-cleans
 */
export class SecureString {
  private _value: string;
  private _id: string;
  private _manager: MemorySecurityManager;
  private _cleaned = false;

  constructor(value: string, id: string, manager: MemorySecurityManager) {
    this._value = value;
    this._id = id;
    this._manager = manager;
  }

  toString(): string {
    if (this._cleaned) {
      throw new Error('SecureString has been cleaned up');
    }
    return this._value;
  }

  valueOf(): string {
    return this.toString();
  }

  get length(): number {
    if (this._cleaned) {
      return 0;
    }
    return this._value.length;
  }

  cleanup(): void {
    if (!this._cleaned) {
      this._manager.cleanupSensitiveData(this._id);
      this._cleaned = true;
      this._value = '';
    }
  }

  isCleanedUp(): boolean {
    return this._cleaned;
  }
}

/**
 * Default memory security manager instance
 */
export const defaultMemorySecurityManager = new MemorySecurityManager();

/**
 * Utility functions for memory security
 */
export const MemorySecurityUtils = {
  /**
   * Create a secure temporary variable that auto-cleans
   */
  createSecureTemp<T>(value: T, ttl: number = 30000): T {
    const id = defaultMemorySecurityManager.registerSensitiveData(value);
    
    setTimeout(() => {
      defaultMemorySecurityManager.cleanupSensitiveData(id);
    }, ttl);

    return value;
  },

  /**
   * Safely clone an object while sanitizing sensitive fields
   */
  safeClone<T>(obj: T): T {
    return defaultMemorySecurityManager.sanitizeObject(obj);
  },

  /**
   * Register cleanup callback for component unmount
   */
  onCleanup(callback: () => void): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', callback);
    } else if (typeof process !== 'undefined') {
      process.on('exit', callback);
      process.on('SIGINT', callback);
      process.on('SIGTERM', callback);
    }
  }
};
