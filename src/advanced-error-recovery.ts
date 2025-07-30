/**
 * Advanced Error Recovery System
 * Integrates circuit breakers, retry logic, and request queuing for robust error handling
 */

import { CircuitBreakerManager, CircuitBreakerConfig, CircuitState } from './circuit-breaker';
import { RetryManager, RetryConfig, RetryStats } from './advanced-retry';
import { RequestQueue, QueueConfig, RequestPriority, QueueStats } from './request-queue';

/**
 * Error recovery configuration
 */
export interface ErrorRecoveryConfig {
  circuitBreaker: Partial<CircuitBreakerConfig>;
  retry: Partial<RetryConfig>;
  queue: Partial<QueueConfig>;
  gracefulDegradation: boolean;
  fallbackStrategies: string[];
  monitoringEnabled: boolean;
}

/**
 * Error recovery statistics
 */
export interface ErrorRecoveryStats {
  circuitBreakers: Record<string, unknown>;
  retryStats: unknown;
  queueStats: unknown;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  recoveredRequests: number;
  fallbacksUsed: number;
  uptime: number;
  availability: number;
}

/**
 * Error recovery event types
 */
export type ErrorRecoveryEvent = 
  | 'circuit-opened'
  | 'circuit-closed'
  | 'retry-exhausted'
  | 'queue-overflow'
  | 'fallback-triggered'
  | 'recovery-successful';

/**
 * Event listener for error recovery events
 */
export type ErrorRecoveryEventListener = (
  event: ErrorRecoveryEvent,
  data: unknown
) => void;

/**
 * Advanced error recovery manager
 */
export class AdvancedErrorRecovery {
  private circuitBreakerManager: CircuitBreakerManager;
  private retryManager: RetryManager;
  private requestQueue: RequestQueue;
  private eventListeners: Map<ErrorRecoveryEvent, ErrorRecoveryEventListener[]> = new Map();
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    recoveredRequests: 0,
    fallbacksUsed: 0,
    startTime: Date.now()
  };

  constructor(private config: ErrorRecoveryConfig) {
    this.circuitBreakerManager = new CircuitBreakerManager();
    this.retryManager = new RetryManager();
    this.requestQueue = new RequestQueue({
      maxSize: 5000,
      maxConcurrent: 20,
      timeout: 60000,
      priorityEnabled: true,
      rateLimitPerSecond: 50,
      backpressureThreshold: 4000,
      retryFailedRequests: true,
      ...config.queue
    });

    this.setupEventHandlers();
  }

  /**
   * Execute operation with full error recovery
   */
  async executeWithRecovery<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      priority?: RequestPriority;
      fallback?: () => Promise<T>;
      skipCircuitBreaker?: boolean;
      skipRetry?: boolean;
      skipQueue?: boolean;
    } = {}
  ): Promise<T> {
    this.stats.totalRequests++;

    try {
      // Wrap operation with all recovery mechanisms
      const recoveredOperation = this.wrapWithRecovery(
        operationName,
        operation,
        options
      );

      const result = await recoveredOperation();
      this.stats.successfulRequests++;
      return result;

    } catch (error) {
      this.stats.failedRequests++;

      // Try fallback if available
      if (options.fallback && this.config.gracefulDegradation) {
        this.stats.fallbacksUsed++;
        this.emitEvent('fallback-triggered', { operationName, error });
        const fallbackResult = await options.fallback();
        this.stats.recoveredRequests++;
        return fallbackResult;
      }

      throw error;
    }
  }

  /**
   * Wrap operation with recovery mechanisms
   */
  private wrapWithRecovery<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: {
      priority?: RequestPriority;
      fallback?: () => Promise<T>;
      skipCircuitBreaker?: boolean;
      skipRetry?: boolean;
      skipQueue?: boolean;
    }
  ): () => Promise<T> {
    let wrappedOperation = operation;

    // Wrap with circuit breaker
    if (!options.skipCircuitBreaker) {
      const originalOp = wrappedOperation;
      wrappedOperation = () => this.circuitBreakerManager.execute(
        operationName,
        originalOp,
        this.config.circuitBreaker
      );
    }

    // Wrap with retry logic
    if (!options.skipRetry) {
      const originalOp = wrappedOperation;
      wrappedOperation = () => this.retryManager.executeWithRetry(
        originalOp,
        this.config.retry
      );
    }

    // Wrap with request queue
    if (!options.skipQueue) {
      const originalOp = wrappedOperation;
      wrappedOperation = () => this.requestQueue.enqueue(
        originalOp,
        { priority: options.priority }
      );
    }

    return wrappedOperation;
  }

  /**
   * Setup event handlers for monitoring
   */
  private setupEventHandlers(): void {
    if (!this.config.monitoringEnabled) return;

    // Monitor circuit breaker state changes
    // Note: This would require the circuit breaker to emit events
    // For now, we'll poll the state periodically
    setInterval(() => {
      const stats = this.circuitBreakerManager.getAllStats();
      Object.entries(stats).forEach(([endpoint, stat]) => {
        if (stat.state === CircuitState.OPEN) {
          this.emitEvent('circuit-opened', { endpoint, stat });
        } else if (stat.state === CircuitState.CLOSED && stat.stateChanges > 0) {
          this.emitEvent('circuit-closed', { endpoint, stat });
        }
      });
    }, 5000);
  }

  /**
   * Add event listener
   */
  addEventListener(
    event: ErrorRecoveryEvent,
    listener: ErrorRecoveryEventListener
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(
    event: ErrorRecoveryEvent,
    listener: ErrorRecoveryEventListener
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: ErrorRecoveryEvent, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event, data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Get comprehensive error recovery statistics
   */
  getStats(): ErrorRecoveryStats {
    const uptime = Date.now() - this.stats.startTime;
    const availability = this.stats.totalRequests > 0 ? 
      ((this.stats.successfulRequests + this.stats.recoveredRequests) / this.stats.totalRequests) * 100 : 100;

    return {
      circuitBreakers: this.circuitBreakerManager.getAllStats(),
      retryStats: this.retryManager.getStats(),
      queueStats: this.requestQueue.getStats(),
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      recoveredRequests: this.stats.recoveredRequests,
      fallbacksUsed: this.stats.fallbacksUsed,
      uptime,
      availability
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    components: Record<string, unknown>;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];
    
    // Check circuit breaker health
    const cbHealth = this.circuitBreakerManager.getHealthSummary();
    
    // Check queue health
    const queueHealth = this.requestQueue.getHealthStatus();
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (cbHealth.overallAvailability < 95 || queueHealth.status === 'warning') {
      status = 'warning';
    }
    
    if (cbHealth.overallAvailability < 90 || queueHealth.status === 'critical') {
      status = 'critical';
    }

    // Add recommendations
    if (stats.failedRequests > stats.successfulRequests * 0.1) {
      recommendations.push('High failure rate detected - check upstream services');
    }
    
    if (stats.fallbacksUsed > stats.totalRequests * 0.2) {
      recommendations.push('Frequent fallback usage - investigate primary service issues');
    }

    recommendations.push(...queueHealth.recommendations);

    return {
      status,
      components: {
        circuitBreakers: cbHealth,
        queue: queueHealth,
        retry: this.retryManager.getStats()
      },
      recommendations
    };
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      recoveredRequests: 0,
      fallbacksUsed: 0,
      startTime: Date.now()
    };
    
    this.circuitBreakerManager.resetAll();
    this.retryManager.resetStats();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ErrorRecoveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.queue) {
      this.requestQueue.updateConfig(newConfig.queue);
    }
  }

  /**
   * Generate error recovery report
   */
  generateReport(): {
    summary: {
      totalRequests: number;
      availability: string;
      uptime: string;
      status: string;
    };
    details: ErrorRecoveryStats;
    recommendations: string[];
    trends: {
      successRate: string;
      recoveryRate: string;
      fallbackUsage: string;
    };
  } {
    const stats = this.getStats();
    const health = this.getHealthStatus();
    
    return {
      summary: {
        totalRequests: stats.totalRequests,
        availability: `${stats.availability.toFixed(2)}%`,
        uptime: `${(stats.uptime / 1000 / 60).toFixed(1)} minutes`,
        status: health.status
      },
      details: stats,
      recommendations: health.recommendations,
      trends: {
        successRate: stats.totalRequests > 0 ? 
          (stats.successfulRequests / stats.totalRequests * 100).toFixed(2) + '%' : '0%',
        recoveryRate: stats.failedRequests > 0 ? 
          (stats.recoveredRequests / stats.failedRequests * 100).toFixed(2) + '%' : '0%',
        fallbackUsage: stats.totalRequests > 0 ? 
          (stats.fallbacksUsed / stats.totalRequests * 100).toFixed(2) + '%' : '0%'
      }
    };
  }
}

/**
 * Factory for creating error recovery instances
 */
export class ErrorRecoveryFactory {
  /**
   * Create production-ready error recovery
   */
  static createProduction(): AdvancedErrorRecovery {
    return new AdvancedErrorRecovery({
      circuitBreaker: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        successThreshold: 3,
        monitoringPeriod: 120000,
        halfOpenMaxCalls: 3
      },
      retry: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: ['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', '503', '502', '504', '429'],
        timeout: 120000
      },
      queue: {
        maxSize: 5000,
        maxConcurrent: 20,
        timeout: 60000,
        priorityEnabled: true,
        rateLimitPerSecond: 50,
        backpressureThreshold: 4000,
        retryFailedRequests: true
      },
      gracefulDegradation: true,
      fallbackStrategies: ['cache', 'default-data', 'retry-alternative-endpoint'],
      monitoringEnabled: true
    });
  }

  /**
   * Create development error recovery
   */
  static createDevelopment(): AdvancedErrorRecovery {
    return new AdvancedErrorRecovery({
      circuitBreaker: {
        failureThreshold: 3,
        recoveryTimeout: 30000,
        successThreshold: 2,
        monitoringPeriod: 60000,
        halfOpenMaxCalls: 2
      },
      retry: {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 5000,
        backoffMultiplier: 1.5,
        jitter: false,
        retryableErrors: ['ENOTFOUND', 'ECONNRESET', '503', '502'],
        timeout: 30000
      },
      queue: {
        maxSize: 1000,
        maxConcurrent: 10,
        timeout: 30000,
        priorityEnabled: false,
        rateLimitPerSecond: 20,
        backpressureThreshold: 800,
        retryFailedRequests: false
      },
      gracefulDegradation: true,
      fallbackStrategies: ['cache'],
      monitoringEnabled: true
    });
  }

  /**
   * Create high-resilience error recovery
   */
  static createHighResilience(): AdvancedErrorRecovery {
    return new AdvancedErrorRecovery({
      circuitBreaker: {
        failureThreshold: 10,
        recoveryTimeout: 300000, // 5 minutes
        successThreshold: 5,
        monitoringPeriod: 600000, // 10 minutes
        halfOpenMaxCalls: 5
      },
      retry: {
        maxAttempts: 5,
        baseDelay: 2000,
        maxDelay: 60000,
        backoffMultiplier: 2.5,
        jitter: true,
        retryableErrors: [
          'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED',
          'Network Error', '500', '502', '503', '504', '429'
        ],
        timeout: 300000
      },
      queue: {
        maxSize: 10000,
        maxConcurrent: 50,
        timeout: 120000,
        priorityEnabled: true,
        rateLimitPerSecond: 100,
        backpressureThreshold: 8000,
        retryFailedRequests: true
      },
      gracefulDegradation: true,
      fallbackStrategies: ['cache', 'default-data', 'retry-alternative-endpoint', 'degrade-service'],
      monitoringEnabled: true
    });
  }
}

// Export everything for easy access
export * from './circuit-breaker';
export * from './advanced-retry';
export * from './request-queue';
