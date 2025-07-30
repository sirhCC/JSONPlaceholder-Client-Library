/**
 * Advanced Error Recovery System
 *
 * Provides circuit breaker patterns, intelligent retry strategies, graceful degradation,
 * and automatic error recovery for production-ready API clients.
 */
export interface CircuitBreakerConfig {
    enabled: boolean;
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    monitoringWindow: number;
    volumeThreshold: number;
}
export interface RetryConfig {
    enabled: boolean;
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffStrategy: 'exponential' | 'linear' | 'fixed';
    jitter: boolean;
    retryCondition: (error: Error) => boolean;
}
export interface FallbackConfig {
    enabled: boolean;
    endpoints: string[];
    cacheAsFallback: boolean;
    fallbackTimeout: number;
}
export interface HealthCheckConfig {
    enabled: boolean;
    interval: number;
    timeout: number;
    endpoint: string;
    successCriteria: (response: {
        status: number;
        data?: unknown;
    }) => boolean;
}
export interface ErrorRecoveryConfig {
    circuitBreaker: Partial<CircuitBreakerConfig>;
    retry: Partial<RetryConfig>;
    fallback: Partial<FallbackConfig>;
    healthCheck: Partial<HealthCheckConfig>;
    errorThresholds: {
        errorRate: number;
        consecutiveFailures: number;
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
export declare class CircuitBreaker {
    private config;
    private state;
    private failureCount;
    private successCount;
    private totalRequests;
    private windowStart;
    private lastFailureTime?;
    private lastSuccessTime?;
    private nextAttemptTime?;
    constructor(config?: Partial<CircuitBreakerConfig>);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldOpenCircuit;
    private canAttempt;
    private updateWindow;
    getStats(): CircuitBreakerStats;
    reset(): void;
    forceOpen(): void;
    forceClose(): void;
}
/**
 * Intelligent Retry Manager - Handles retry logic with various backoff strategies
 */
export declare class RetryManager {
    private config;
    constructor(config?: Partial<RetryConfig>);
    execute<T>(operation: () => Promise<T>): Promise<T>;
    private calculateDelay;
    private wait;
    private defaultRetryCondition;
    updateConfig(config: Partial<RetryConfig>): void;
    getConfig(): RetryConfig;
}
/**
 * Fallback Manager - Handles fallback strategies including alternative endpoints and stale cache
 */
export declare class FallbackManager {
    private config;
    constructor(config?: Partial<FallbackConfig>);
    executeWithFallback<T>(primaryOperation: () => Promise<T>, fallbackOperations?: (() => Promise<T>)[]): Promise<T>;
    private timeoutPromise;
    updateConfig(config: Partial<FallbackConfig>): void;
    getConfig(): FallbackConfig;
}
/**
 * Error Recovery Manager - Orchestrates circuit breaker, retry, and fallback strategies
 */
export declare class ErrorRecoveryManager {
    private circuitBreaker;
    private retryManager;
    private fallbackManager;
    private config;
    private listeners;
    private healthCheckInterval?;
    constructor(config?: Partial<ErrorRecoveryConfig>);
    execute<T>(operation: () => Promise<T>, fallbackOperations?: (() => Promise<T>)[]): Promise<T>;
    getCircuitBreakerStats(): CircuitBreakerStats;
    addEventListener(listener: ErrorRecoveryEventListener): void;
    removeEventListener(listener: ErrorRecoveryEventListener): void;
    private emitEvent;
    private startHealthCheck;
    private stopHealthCheck;
    updateConfig(config: Partial<ErrorRecoveryConfig>): void;
    getConfig(): ErrorRecoveryConfig;
    reset(): void;
    forceCircuitOpen(): void;
    forceCircuitClose(): void;
    destroy(): void;
}
/**
 * Error Recovery Dashboard - Provides insights and reporting for error recovery
 */
export declare class ErrorRecoveryDashboard {
    private manager;
    constructor(manager: ErrorRecoveryManager);
    getReport(): string;
    printReport(): void;
    getInsights(): string[];
    printInsights(): void;
}
//# sourceMappingURL=error-recovery.d.ts.map