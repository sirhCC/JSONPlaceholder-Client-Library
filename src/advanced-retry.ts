/**
 * Advanced Retry Logic with Exponential Backoff and Jitter
 * Implements intelligent retry strategies for different types of failures
 */

/**
 * Retry strategy configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;           // Base delay in milliseconds
  maxDelay: number;            // Maximum delay cap
  backoffMultiplier: number;   // Exponential backoff multiplier
  jitter: boolean;             // Add randomization to prevent thundering herd
  retryableErrors: string[];   // Error types that should trigger retry
  timeout: number;             // Overall timeout for all attempts
}

/**
 * Retry attempt information
 */
export interface RetryAttempt {
  attempt: number;
  delay: number;
  totalElapsed: number;
  error?: Error;
  timestamp: number;
}

/**
 * Retry statistics
 */
export interface RetryStats {
  totalAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageAttempts: number;
  totalRetryTime: number;
  errorDistribution: Record<string, number>;
}

/**
 * Advanced retry manager with multiple strategies
 */
export class RetryManager {
  private stats: RetryStats = {
    totalAttempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    averageAttempts: 0,
    totalRetryTime: 0,
    errorDistribution: {}
  };

  private defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: [
      'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
      'Network Error', 'timeout', '503', '502', '504', '429'
    ],
    timeout: 120000 // 2 minutes total timeout
  };

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const attempts: RetryAttempt[] = [];
    const startTime = Date.now();

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        const result = await this.executeWithTimeout(operation, finalConfig.timeout);
        
        // Success - update stats
        this.stats.totalAttempts += attempt;
        if (attempt > 1) {
          this.stats.successfulRetries++;
        }
        this.updateAverageAttempts();
        
        return result;
      } catch (error) {
        const attemptInfo: RetryAttempt = {
          attempt,
          delay: 0,
          totalElapsed: Date.now() - startTime,
          error: error as Error,
          timestamp: Date.now()
        };

        attempts.push(attemptInfo);
        this.updateErrorDistribution(error as Error);

        // Check if should retry
        if (attempt === finalConfig.maxAttempts || !this.shouldRetry(error as Error, finalConfig)) {
          this.stats.failedRetries++;
          this.stats.totalAttempts += attempt;
          this.updateAverageAttempts();
          throw this.createRetryError(error as Error, attempts);
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt, finalConfig);
        attemptInfo.delay = delay;
        
        // Check timeout
        if (Date.now() - startTime + delay > finalConfig.timeout) {
          throw this.createTimeoutError(attempts, finalConfig.timeout);
        }

        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw new Error('Retry logic error: exceeded max attempts without proper exit');
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeout}ms`));
      }, timeout);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Check if error should trigger a retry
   */
  private shouldRetry(error: Error, config: RetryConfig): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorCode = (error as Error & { code?: string }).code || '';
    
    return config.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorCode === retryableError
    );
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: baseDelay * (multiplier ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    
    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      // Add random variance of ±25%
      const jitterAmount = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }
    
    return Math.max(0, Math.floor(delay));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create comprehensive retry error
   */
  private createRetryError(lastError: Error, attempts: RetryAttempt[]): Error {
    const error = new Error(
      `Operation failed after ${attempts.length} attempts. Last error: ${lastError.message}`
    ) as Error & {
      name: string;
      originalError: Error;
      attempts: RetryAttempt[];
      totalTime: number;
    };
    
    error.name = 'RetryExhaustedError';
    error.originalError = lastError;
    error.attempts = attempts;
    error.totalTime = attempts[attempts.length - 1]?.totalElapsed || 0;
    
    return error;
  }

  /**
   * Create timeout error
   */
  private createTimeoutError(attempts: RetryAttempt[], timeout: number): Error {
    const error = new Error(`Retry operation timed out after ${timeout}ms`) as Error & {
      name: string;
      attempts: RetryAttempt[];
      timeout: number;
    };
    
    error.name = 'RetryTimeoutError';
    error.attempts = attempts;
    error.timeout = timeout;
    return error;
  }

  /**
   * Update error distribution statistics
   */
  private updateErrorDistribution(error: Error): void {
    const errorType = error.name || 'Unknown';
    this.stats.errorDistribution[errorType] = (this.stats.errorDistribution[errorType] || 0) + 1;
  }

  /**
   * Update average attempts statistic
   */
  private updateAverageAttempts(): void {
    const totalOperations = this.stats.successfulRetries + this.stats.failedRetries;
    if (totalOperations > 0) {
      this.stats.averageAttempts = this.stats.totalAttempts / totalOperations;
    }
  }

  /**
   * Get retry statistics
   */
  getStats(): RetryStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageAttempts: 0,
      totalRetryTime: 0,
      errorDistribution: {}
    };
  }

  /**
   * Create retry config for specific scenarios
   */
  static createConfigForScenario(scenario: 'aggressive' | 'conservative' | 'network' | 'api'): RetryConfig {
    const configs = {
      aggressive: {
        maxAttempts: 5,
        baseDelay: 500,
        maxDelay: 10000,
        backoffMultiplier: 1.5,
        jitter: true,
        retryableErrors: ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', '503', '502', '504', '429'],
        timeout: 60000
      },
      conservative: {
        maxAttempts: 2,
        baseDelay: 2000,
        maxDelay: 8000,
        backoffMultiplier: 2,
        jitter: false,
        retryableErrors: ['ENOTFOUND', 'ECONNRESET', '503', '502'],
        timeout: 30000
      },
      network: {
        maxAttempts: 4,
        baseDelay: 1000,
        maxDelay: 16000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'Network Error'],
        timeout: 90000
      },
      api: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: ['503', '502', '504', '429', 'timeout'],
        timeout: 120000
      }
    };

    return configs[scenario];
  }
}

/**
 * Specialized retry strategies for different operations
 */
export class SpecializedRetryStrategies {
  /**
   * Retry strategy for rate-limited APIs
   */
  static createRateLimitStrategy(): RetryConfig {
    return {
      maxAttempts: 5,
      baseDelay: 1000,
      maxDelay: 60000,
      backoffMultiplier: 2.5, // More aggressive backoff for rate limits
      jitter: true,
      retryableErrors: ['429', 'Rate limit', 'Too Many Requests'],
      timeout: 300000 // 5 minutes for rate limit recovery
    };
  }

  /**
   * Retry strategy for network connectivity issues
   */
  static createNetworkStrategy(): RetryConfig {
    return {
      maxAttempts: 6,
      baseDelay: 500,
      maxDelay: 20000,
      backoffMultiplier: 1.8,
      jitter: true,
      retryableErrors: [
        'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
        'Network Error', 'fetch failed', 'socket hang up'
      ],
      timeout: 180000 // 3 minutes
    };
  }

  /**
   * Retry strategy for server errors
   */
  static createServerErrorStrategy(): RetryConfig {
    return {
      maxAttempts: 4,
      baseDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: ['500', '502', '503', '504', 'Internal Server Error', 'Bad Gateway'],
      timeout: 120000
    };
  }

  /**
   * Retry strategy for timeout errors
   */
  static createTimeoutStrategy(): RetryConfig {
    return {
      maxAttempts: 3,
      baseDelay: 1500,
      maxDelay: 15000,
      backoffMultiplier: 2.2,
      jitter: false, // No jitter for timeouts to ensure consistent timing
      retryableErrors: ['timeout', 'ETIMEDOUT', 'Request timeout'],
      timeout: 90000
    };
  }
}
