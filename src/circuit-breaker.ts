/**
 * Circuit Breaker Implementation for Advanced Error Recovery
 * Prevents cascading failures by temporarily disabling failing services
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Circuit is open, requests fail fast
  HALF_OPEN = 'HALF_OPEN' // Testing if service has recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;      // Number of failures before opening
  recoveryTimeout: number;       // Time before attempting recovery (ms)
  successThreshold: number;      // Successes needed to close circuit
  monitoringPeriod: number;      // Time window for failure counting (ms)
  halfOpenMaxCalls: number;      // Max calls allowed in half-open state
}

/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  totalCalls: number;
  lastFailureTime: number;
  lastSuccessTime: number;
  stateChanges: number;
  uptime: number;
  availability: number;
}

/**
 * Circuit breaker for endpoint protection
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private totalCalls = 0;
  private lastFailureTime = 0;
  private lastSuccessTime = 0;
  private stateChanges = 0;
  private halfOpenCalls = 0;
  private createdAt = Date.now();

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error(`Circuit breaker is ${this.state}. Request blocked.`);
    }

    this.totalCalls++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if operation can be executed
   */
  private canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;
      
      case CircuitState.OPEN:
        if (this.shouldAttemptRecovery()) {
          this.moveToHalfOpen();
          return true;
        }
        return false;
      
      case CircuitState.HALF_OPEN:
        return this.halfOpenCalls < this.config.halfOpenMaxCalls;
      
      default:
        return false;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
      if (this.successCount >= this.config.successThreshold) {
        this.moveToClosed();
      }
    }

    // Reset failure count on success in monitoring period
    if (this.state === CircuitState.CLOSED) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.config.monitoringPeriod) {
        this.failureCount = 0;
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.moveToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.moveToOpen();
      }
    }
  }

  /**
   * Check if should attempt recovery from OPEN state
   */
  private shouldAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  /**
   * Move to CLOSED state
   */
  private moveToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.stateChanges++;
  }

  /**
   * Move to OPEN state
   */
  private moveToOpen(): void {
    this.state = CircuitState.OPEN;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.stateChanges++;
  }

  /**
   * Move to HALF_OPEN state
   */
  private moveToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.successCount = 0;
    this.halfOpenCalls = 0;
    this.stateChanges++;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    const uptime = Date.now() - this.createdAt;
    const availability = this.totalCalls > 0 ? 
      ((this.totalCalls - this.failureCount) / this.totalCalls) * 100 : 100;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChanges: this.stateChanges,
      uptime,
      availability
    };
  }

  /**
   * Reset circuit breaker to initial state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCalls = 0;
    this.halfOpenCalls = 0;
    this.lastFailureTime = 0;
    this.lastSuccessTime = 0;
    this.stateChanges = 0;
    this.createdAt = Date.now();
  }

  /**
   * Force circuit to specific state (for testing)
   */
  forceState(state: CircuitState): void {
    this.state = state;
    this.stateChanges++;
  }
}

/**
 * Circuit breaker manager for multiple endpoints
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  private defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    successThreshold: 3,
    monitoringPeriod: 120000, // 2 minutes
    halfOpenMaxCalls: 3
  };

  /**
   * Get or create circuit breaker for endpoint
   */
  getBreaker(endpoint: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(endpoint)) {
      const finalConfig = { ...this.defaultConfig, ...config };
      this.breakers.set(endpoint, new CircuitBreaker(finalConfig));
    }
    return this.breakers.get(endpoint)!;
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(
    endpoint: string, 
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getBreaker(endpoint, config);
    return breaker.execute(operation);
  }

  /**
   * Get statistics for all circuit breakers
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.breakers.forEach((breaker, endpoint) => {
      stats[endpoint] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * Remove circuit breaker for endpoint
   */
  removeBreaker(endpoint: string): boolean {
    return this.breakers.delete(endpoint);
  }

  /**
   * Get health summary across all endpoints
   */
  getHealthSummary(): {
    totalEndpoints: number;
    healthyEndpoints: number;
    unhealthyEndpoints: number;
    overallAvailability: number;
  } {
    const stats = this.getAllStats();
    const endpoints = Object.values(stats);
    
    const totalEndpoints = endpoints.length;
    const healthyEndpoints = endpoints.filter(s => s.state === CircuitState.CLOSED).length;
    const unhealthyEndpoints = totalEndpoints - healthyEndpoints;
    
    const overallAvailability = endpoints.length > 0 ? 
      endpoints.reduce((sum, s) => sum + s.availability, 0) / endpoints.length : 100;

    return {
      totalEndpoints,
      healthyEndpoints,
      unhealthyEndpoints,
      overallAvailability
    };
  }
}
