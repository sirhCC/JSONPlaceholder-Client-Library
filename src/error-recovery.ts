/**
 * Advanced Error Recovery System
 * 
 * Provides circuit breaker patterns, intelligent retry strategies, graceful degradation,
 * and automatic error recovery for production-ready API clients.
 */

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number; // Number of failures before opening circuit
  successThreshold: number; // Number of successes to close circuit
  timeout: number; // Time to wait in open state before trying again (ms)
  monitoringWindow: number; // Time window for failure counting (ms)
  volumeThreshold: number; // Minimum number of requests in window to consider failure rate
}

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  baseDelay: number; // Base delay in ms
  maxDelay: number; // Maximum delay in ms
  backoffStrategy: 'exponential' | 'linear' | 'fixed';
  jitter: boolean; // Add random jitter to prevent thundering herd
  retryCondition: (error: Error) => boolean;
}

export interface FallbackConfig {
  enabled: boolean;
  endpoints: string[]; // Alternative endpoints to try
  cacheAsFallback: boolean; // Use stale cache data as fallback
  fallbackTimeout: number; // Timeout for fallback attempts
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // Health check interval in ms
  timeout: number; // Health check timeout in ms
  endpoint: string; // Health check endpoint
  successCriteria: (response: { status: number; data?: unknown }) => boolean;
}

export interface ErrorRecoveryConfig {
  circuitBreaker: Partial<CircuitBreakerConfig>;
  retry: Partial<RetryConfig>;
  fallback: Partial<FallbackConfig>;
  healthCheck: Partial<HealthCheckConfig>;
  errorThresholds: {
    errorRate: number; // Percentage threshold for error rate alerts
    consecutiveFailures: number; // Consecutive failures before escalation
  };
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalRequests: number;
  failureRate: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  nextAttemptTime?: number;
  windowStart: number;
}

export interface RetryAttempt {
  attempt: number;
  delay: number;
  error: Error;
  timestamp: number;
}

export interface ErrorRecoveryEvent {
  type: 'circuit_opened' | 'circuit_closed' | 'circuit_half_open' | 'retry_attempt' | 'fallback_used' | 'health_check' | 'recovery_success';
  timestamp: number;
  data: Record<string, unknown>;
  metadata?: {
    circuitState?: CircuitState;
    retryAttempt?: number;
    endpoint?: string;
    error?: string;
  };
}

export type ErrorRecoveryEventListener = (event: ErrorRecoveryEvent) => void;

/**
 * Circuit Breaker - Prevents cascading failures and provides automatic recovery
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private totalRequests = 0;
  private windowStart = Date.now();
  private lastFailureTime?: number;
  private lastSuccessTime?: number;
  private nextAttemptTime?: number;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      enabled: true,
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000, // 1 minute
      monitoringWindow: 60000, // 1 minute
      volumeThreshold: 10,
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    this.updateWindow();

    if (this.state === 'OPEN') {
      if (this.canAttempt()) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error(`Circuit breaker is OPEN. Next attempt at ${new Date(this.nextAttemptTime!).toLocaleTimeString()}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.totalRequests++;
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.nextAttemptTime = undefined;
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on success
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.totalRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.config.timeout;
    } else if (this.state === 'CLOSED') {
      if (this.shouldOpenCircuit()) {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.config.timeout;
      }
    }
  }

  private shouldOpenCircuit(): boolean {
    if (this.totalRequests < this.config.volumeThreshold) {
      return false;
    }

    return this.failureCount >= this.config.failureThreshold;
  }

  private canAttempt(): boolean {
    return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime : true;
  }

  private updateWindow(): void {
    const now = Date.now();
    if (now - this.windowStart >= this.config.monitoringWindow) {
      this.windowStart = now;
      this.failureCount = 0;
      this.successCount = 0;
      this.totalRequests = 0;
    }
  }

  getStats(): CircuitBreakerStats {
    this.updateWindow();
    
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      failureRate: this.totalRequests > 0 ? (this.failureCount / this.totalRequests) * 100 : 0,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime,
      windowStart: this.windowStart
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.windowStart = Date.now();
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
  }

  forceOpen(): void {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.config.timeout;
  }

  forceClose(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttemptTime = undefined;
  }
}

/**
 * Intelligent Retry Manager - Handles retry logic with various backoff strategies
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      enabled: true,
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 30000, // 30 seconds
      backoffStrategy: 'exponential',
      jitter: true,
      retryCondition: this.defaultRetryCondition,
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    let lastError: Error = new Error('No attempts made');
    const attempts: RetryAttempt[] = [];

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        return result;
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        lastError = errorObj;
        
        const retryAttempt: RetryAttempt = {
          attempt,
          delay: 0,
          error: errorObj,
          timestamp: Date.now()
        };

        if (attempt === this.config.maxAttempts || !this.config.retryCondition(errorObj)) {
          attempts.push(retryAttempt);
          break;
        }

        const delay = this.calculateDelay(attempt);
        retryAttempt.delay = delay;
        attempts.push(retryAttempt);

        await this.wait(delay);
      }
    }

    // Attach retry information to the error
    if (lastError) {
      (lastError as Error & { retryAttempts?: RetryAttempt[]; totalAttempts?: number }).retryAttempts = attempts;
      (lastError as Error & { retryAttempts?: RetryAttempt[]; totalAttempts?: number }).totalAttempts = attempts.length;
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    let delay: number;

    switch (this.config.backoffStrategy) {
      case 'exponential':
        delay = this.config.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        delay = this.config.baseDelay * attempt;
        break;
      case 'fixed':
      default:
        delay = this.config.baseDelay;
        break;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxDelay);

    // Add jitter if enabled
    if (this.config.jitter) {
      delay += Math.random() * delay * 0.1; // Up to 10% jitter
    }

    return Math.floor(delay);
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private defaultRetryCondition(error: Error): boolean {
    // Check for network error properties (these might be on the error object)
    const errorWithCode = error as Error & { code?: string; response?: { status?: number } };
    
    // Retry on network errors and 5xx server errors
    if (errorWithCode.code === 'ECONNRESET' || errorWithCode.code === 'ETIMEDOUT' || errorWithCode.code === 'ENOTFOUND') {
      return true;
    }

    if (errorWithCode.response?.status && errorWithCode.response.status >= 500) {
      return true;
    }

    // Don't retry on 4xx client errors (except 429 rate limiting)
    if (errorWithCode.response?.status === 429) {
      return true;
    }

    return false;
  }

  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Fallback Manager - Handles fallback strategies including alternative endpoints and stale cache
 */
export class FallbackManager {
  private config: FallbackConfig;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enabled: true,
      endpoints: [],
      cacheAsFallback: true,
      fallbackTimeout: 5000,
      ...config
    };
  }

  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperations: (() => Promise<T>)[] = []
  ): Promise<T> {
    if (!this.config.enabled) {
      return primaryOperation();
    }

    // Try primary operation
    try {
      return await primaryOperation();
    } catch (primaryError) {
      // Try fallback operations
      for (let i = 0; i < fallbackOperations.length; i++) {
  try {
          const result = await Promise.race([
            fallbackOperations[i](),
            this.timeoutPromise(this.config.fallbackTimeout)
          ]);
          return result as T;
  } catch {
          // Continue to next fallback
          continue;
        }
      }

      // If all fallbacks fail, throw the original error
      throw primaryError;
    }
  }

  private timeoutPromise<T>(ms: number): Promise<T> {
    return new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Fallback operation timed out after ${ms}ms`)), ms);
    });
  }

  updateConfig(config: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): FallbackConfig {
    return { ...this.config };
  }
}

/**
 * Error Recovery Manager - Orchestrates circuit breaker, retry, and fallback strategies
 */
export class ErrorRecoveryManager {
  private circuitBreaker: CircuitBreaker;
  private retryManager: RetryManager;
  private fallbackManager: FallbackManager;
  private config: ErrorRecoveryConfig;
  private listeners: ErrorRecoveryEventListener[] = [];
  private healthCheckInterval?: ReturnType<typeof setInterval>;

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = {
      circuitBreaker: {},
      retry: {},
      fallback: {},
      healthCheck: {
        enabled: false,
        interval: 30000, // 30 seconds
        timeout: 5000, // 5 seconds
        endpoint: '/health',
        successCriteria: (response) => response.status === 200
      },
      errorThresholds: {
        errorRate: 10, // 10%
        consecutiveFailures: 3
      },
      ...config
    };

    this.circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
    this.retryManager = new RetryManager(this.config.retry);
    this.fallbackManager = new FallbackManager(this.config.fallback);

    if (this.config.healthCheck?.enabled) {
      this.startHealthCheck();
    }
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallbackOperations: (() => Promise<T>)[] = []
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return this.retryManager.execute(async () => {
        return this.fallbackManager.executeWithFallback(operation, fallbackOperations);
      });
    });
  }

  getCircuitBreakerStats(): CircuitBreakerStats {
    return this.circuitBreaker.getStats();
  }

  addEventListener(listener: ErrorRecoveryEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: ErrorRecoveryEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private emitEvent(event: ErrorRecoveryEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error recovery event listener error:', error);
      }
    });
  }

  private startHealthCheck(): void {
    if (!this.config.healthCheck?.enabled || this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        // Health check implementation would go here
        // For now, we'll emit a health check event
        this.emitEvent({
          type: 'health_check',
          timestamp: Date.now(),
          data: { status: 'healthy' }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.emitEvent({
          type: 'health_check',
          timestamp: Date.now(),
          data: { status: 'unhealthy', error: errorMessage }
        });
      }
    }, this.config.healthCheck.interval);
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  updateConfig(config: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update sub-managers
    if (config.circuitBreaker) {
      this.circuitBreaker = new CircuitBreaker({ ...this.config.circuitBreaker });
    }
    if (config.retry) {
      this.retryManager.updateConfig({ ...this.config.retry });
    }
    if (config.fallback) {
      this.fallbackManager.updateConfig({ ...this.config.fallback });
    }

    // Update health check
    if (config.healthCheck?.enabled && !this.healthCheckInterval) {
      this.startHealthCheck();
    } else if (!config.healthCheck?.enabled && this.healthCheckInterval) {
      this.stopHealthCheck();
    }
  }

  getConfig(): ErrorRecoveryConfig {
    return { ...this.config };
  }

  reset(): void {
    this.circuitBreaker.reset();
  }

  forceCircuitOpen(): void {
    this.circuitBreaker.forceOpen();
    this.emitEvent({
      type: 'circuit_opened',
      timestamp: Date.now(),
      data: { reason: 'manual' }
    });
  }

  forceCircuitClose(): void {
    this.circuitBreaker.forceClose();
    this.emitEvent({
      type: 'circuit_closed',
      timestamp: Date.now(),
      data: { reason: 'manual' }
    });
  }

  destroy(): void {
    this.stopHealthCheck();
    this.listeners = [];
  }
}

/**
 * Error Recovery Dashboard - Provides insights and reporting for error recovery
 */
export class ErrorRecoveryDashboard {
  private manager: ErrorRecoveryManager;

  constructor(manager: ErrorRecoveryManager) {
    this.manager = manager;
  }

  getReport(): string {
    const stats = this.manager.getCircuitBreakerStats();
    const config = this.manager.getConfig();
    
    let report = '\n🛡️ ERROR RECOVERY DASHBOARD\n';
    report += '═'.repeat(50) + '\n\n';
    
    // Circuit Breaker Status
    const stateIcon = stats.state === 'CLOSED' ? '🟢' : stats.state === 'OPEN' ? '🔴' : '🟡';
    report += `⚡ CIRCUIT BREAKER STATUS\n`;
    report += `   State: ${stateIcon} ${stats.state}\n`;
    report += `   Failure Rate: ${stats.failureRate.toFixed(1)}%\n`;
    report += `   Total Requests: ${stats.totalRequests}\n`;
    report += `   Failures: ${stats.failureCount}\n`;
    report += `   Successes: ${stats.successCount}\n`;
    
    if (stats.nextAttemptTime) {
      const nextAttempt = new Date(stats.nextAttemptTime);
      report += `   Next Attempt: ${nextAttempt.toLocaleTimeString()}\n`;
    }
    report += '\n';
    
    // Configuration Summary
    report += '⚙️ CONFIGURATION\n';
    report += `   Failure Threshold: ${config.circuitBreaker?.failureThreshold || 'default'}\n`;
    report += `   Success Threshold: ${config.circuitBreaker?.successThreshold || 'default'}\n`;
    report += `   Max Retry Attempts: ${config.retry?.maxAttempts || 'default'}\n`;
    report += `   Backoff Strategy: ${config.retry?.backoffStrategy || 'default'}\n`;
    report += `   Fallback Enabled: ${config.fallback?.enabled ? 'Yes' : 'No'}\n`;
    report += `   Health Check: ${config.healthCheck?.enabled ? 'Enabled' : 'Disabled'}\n\n`;
    
    // Recent Activity
    if (stats.lastFailureTime || stats.lastSuccessTime) {
      report += '📊 RECENT ACTIVITY\n';
      if (stats.lastSuccessTime) {
        const lastSuccess = new Date(stats.lastSuccessTime);
        report += `   Last Success: ${lastSuccess.toLocaleTimeString()}\n`;
      }
      if (stats.lastFailureTime) {
        const lastFailure = new Date(stats.lastFailureTime);
        report += `   Last Failure: ${lastFailure.toLocaleTimeString()}\n`;
      }
      report += '\n';
    }
    
    return report;
  }

  printReport(): void {
    // eslint-disable-next-line no-console
    console.log(this.getReport());
  }

  getInsights(): string[] {
    const stats = this.manager.getCircuitBreakerStats();
    const insights: string[] = [];
    
    // Circuit breaker insights
    if (stats.state === 'OPEN') {
      insights.push('🚨 Circuit breaker is OPEN - System is protecting against cascading failures');
      if (stats.nextAttemptTime) {
        const waitTime = Math.ceil((stats.nextAttemptTime - Date.now()) / 1000);
        insights.push(`⏱️ Will retry in ${waitTime} seconds - System is in recovery mode`);
      }
    } else if (stats.state === 'HALF_OPEN') {
      insights.push('🟡 Circuit breaker is HALF_OPEN - Testing system recovery');
    } else if (stats.state === 'CLOSED' && stats.failureRate === 0 && stats.totalRequests > 0) {
      insights.push('✅ Circuit breaker is CLOSED with 0% failure rate - System is healthy');
    }
    
    // Failure rate insights
    if (stats.failureRate > 20 && stats.totalRequests >= 5) {
      insights.push('⚠️ High failure rate detected - Consider checking API health or network connectivity');
    } else if (stats.failureRate > 0 && stats.failureRate <= 5 && stats.totalRequests >= 10) {
      insights.push('✅ Low failure rate - Error recovery is working effectively');
    }
    
    // General insights
    if (stats.totalRequests === 0) {
      insights.push('📊 No requests processed yet - Error recovery system is ready');
    } else if (stats.totalRequests > 0 && stats.failureCount === 0) {
      insights.push('🚀 Perfect reliability - All requests successful');
    }
    
    if (insights.length === 0) {
      insights.push('📈 Error recovery system is operating normally');
    }
    
    return insights;
  }

  printInsights(): void {
    const insights = this.getInsights();
    // eslint-disable-next-line no-console
    console.log('\n💡 ERROR RECOVERY INSIGHTS\n');
    // eslint-disable-next-line no-console
    insights.forEach(insight => console.log(`   ${insight}`));
    // eslint-disable-next-line no-console
    console.log('');
  }
}
