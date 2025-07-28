"use strict";
/**
 * Advanced Error Recovery System
 *
 * Provides circuit breaker patterns, intelligent retry strategies, graceful degradation,
 * and automatic error recovery for production-ready API clients.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorRecoveryDashboard = exports.ErrorRecoveryManager = exports.FallbackManager = exports.RetryManager = exports.CircuitBreaker = void 0;
/**
 * Circuit Breaker - Prevents cascading failures and provides automatic recovery
 */
class CircuitBreaker {
    constructor(config = {}) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.totalRequests = 0;
        this.windowStart = Date.now();
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
    async execute(operation) {
        if (!this.config.enabled) {
            return operation();
        }
        this.updateWindow();
        if (this.state === 'OPEN') {
            if (this.canAttempt()) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
            }
            else {
                throw new Error(`Circuit breaker is OPEN. Next attempt at ${new Date(this.nextAttemptTime).toLocaleTimeString()}`);
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.totalRequests++;
        this.successCount++;
        this.lastSuccessTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            if (this.successCount >= this.config.successThreshold) {
                this.state = 'CLOSED';
                this.failureCount = 0;
                this.nextAttemptTime = undefined;
            }
        }
        else if (this.state === 'CLOSED') {
            // Reset failure count on success
            this.failureCount = 0;
        }
    }
    onFailure() {
        this.totalRequests++;
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.config.timeout;
        }
        else if (this.state === 'CLOSED') {
            if (this.shouldOpenCircuit()) {
                this.state = 'OPEN';
                this.nextAttemptTime = Date.now() + this.config.timeout;
            }
        }
    }
    shouldOpenCircuit() {
        if (this.totalRequests < this.config.volumeThreshold) {
            return false;
        }
        return this.failureCount >= this.config.failureThreshold;
    }
    canAttempt() {
        return this.nextAttemptTime ? Date.now() >= this.nextAttemptTime : true;
    }
    updateWindow() {
        const now = Date.now();
        if (now - this.windowStart >= this.config.monitoringWindow) {
            this.windowStart = now;
            this.failureCount = 0;
            this.successCount = 0;
            this.totalRequests = 0;
        }
    }
    getStats() {
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
    reset() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        this.totalRequests = 0;
        this.windowStart = Date.now();
        this.lastFailureTime = undefined;
        this.lastSuccessTime = undefined;
        this.nextAttemptTime = undefined;
    }
    forceOpen() {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.config.timeout;
    }
    forceClose() {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.nextAttemptTime = undefined;
    }
}
exports.CircuitBreaker = CircuitBreaker;
/**
 * Intelligent Retry Manager - Handles retry logic with various backoff strategies
 */
class RetryManager {
    constructor(config = {}) {
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
    async execute(operation) {
        if (!this.config.enabled) {
            return operation();
        }
        let lastError = new Error('No attempts made');
        const attempts = [];
        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            try {
                const result = await operation();
                return result;
            }
            catch (error) {
                const errorObj = error instanceof Error ? error : new Error(String(error));
                lastError = errorObj;
                const retryAttempt = {
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
            lastError.retryAttempts = attempts;
            lastError.totalAttempts = attempts.length;
        }
        throw lastError;
    }
    calculateDelay(attempt) {
        let delay;
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
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    defaultRetryCondition(error) {
        // Check for network error properties (these might be on the error object)
        const errorWithCode = error;
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
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.RetryManager = RetryManager;
/**
 * Fallback Manager - Handles fallback strategies including alternative endpoints and stale cache
 */
class FallbackManager {
    constructor(config = {}) {
        this.config = {
            enabled: true,
            endpoints: [],
            cacheAsFallback: true,
            fallbackTimeout: 5000,
            ...config
        };
    }
    async executeWithFallback(primaryOperation, fallbackOperations = []) {
        if (!this.config.enabled) {
            return primaryOperation();
        }
        // Try primary operation
        try {
            return await primaryOperation();
        }
        catch (primaryError) {
            // Try fallback operations
            for (let i = 0; i < fallbackOperations.length; i++) {
                try {
                    const result = await Promise.race([
                        fallbackOperations[i](),
                        this.timeoutPromise(this.config.fallbackTimeout)
                    ]);
                    return result;
                }
                catch (fallbackError) {
                    // Continue to next fallback
                    continue;
                }
            }
            // If all fallbacks fail, throw the original error
            throw primaryError;
        }
    }
    timeoutPromise(ms) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Fallback operation timed out after ${ms}ms`)), ms);
        });
    }
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.FallbackManager = FallbackManager;
/**
 * Error Recovery Manager - Orchestrates circuit breaker, retry, and fallback strategies
 */
class ErrorRecoveryManager {
    constructor(config = {}) {
        this.listeners = [];
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
    async execute(operation, fallbackOperations = []) {
        return this.circuitBreaker.execute(async () => {
            return this.retryManager.execute(async () => {
                return this.fallbackManager.executeWithFallback(operation, fallbackOperations);
            });
        });
    }
    getCircuitBreakerStats() {
        return this.circuitBreaker.getStats();
    }
    addEventListener(listener) {
        this.listeners.push(listener);
    }
    removeEventListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    emitEvent(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Error recovery event listener error:', error);
            }
        });
    }
    startHealthCheck() {
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
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.emitEvent({
                    type: 'health_check',
                    timestamp: Date.now(),
                    data: { status: 'unhealthy', error: errorMessage }
                });
            }
        }, this.config.healthCheck.interval);
    }
    stopHealthCheck() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
        }
    }
    updateConfig(config) {
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
        }
        else if (!config.healthCheck?.enabled && this.healthCheckInterval) {
            this.stopHealthCheck();
        }
    }
    getConfig() {
        return { ...this.config };
    }
    reset() {
        this.circuitBreaker.reset();
    }
    forceCircuitOpen() {
        this.circuitBreaker.forceOpen();
        this.emitEvent({
            type: 'circuit_opened',
            timestamp: Date.now(),
            data: { reason: 'manual' }
        });
    }
    forceCircuitClose() {
        this.circuitBreaker.forceClose();
        this.emitEvent({
            type: 'circuit_closed',
            timestamp: Date.now(),
            data: { reason: 'manual' }
        });
    }
    destroy() {
        this.stopHealthCheck();
        this.listeners = [];
    }
}
exports.ErrorRecoveryManager = ErrorRecoveryManager;
/**
 * Error Recovery Dashboard - Provides insights and reporting for error recovery
 */
class ErrorRecoveryDashboard {
    constructor(manager) {
        this.manager = manager;
    }
    getReport() {
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
    printReport() {
        // eslint-disable-next-line no-console
        console.log(this.getReport());
    }
    getInsights() {
        const stats = this.manager.getCircuitBreakerStats();
        const insights = [];
        // Circuit breaker insights
        if (stats.state === 'OPEN') {
            insights.push('🚨 Circuit breaker is OPEN - System is protecting against cascading failures');
            if (stats.nextAttemptTime) {
                const waitTime = Math.ceil((stats.nextAttemptTime - Date.now()) / 1000);
                insights.push(`⏱️ Will retry in ${waitTime} seconds - System is in recovery mode`);
            }
        }
        else if (stats.state === 'HALF_OPEN') {
            insights.push('🟡 Circuit breaker is HALF_OPEN - Testing system recovery');
        }
        else if (stats.state === 'CLOSED' && stats.failureRate === 0 && stats.totalRequests > 0) {
            insights.push('✅ Circuit breaker is CLOSED with 0% failure rate - System is healthy');
        }
        // Failure rate insights
        if (stats.failureRate > 20 && stats.totalRequests >= 5) {
            insights.push('⚠️ High failure rate detected - Consider checking API health or network connectivity');
        }
        else if (stats.failureRate > 0 && stats.failureRate <= 5 && stats.totalRequests >= 10) {
            insights.push('✅ Low failure rate - Error recovery is working effectively');
        }
        // General insights
        if (stats.totalRequests === 0) {
            insights.push('📊 No requests processed yet - Error recovery system is ready');
        }
        else if (stats.totalRequests > 0 && stats.failureCount === 0) {
            insights.push('🚀 Perfect reliability - All requests successful');
        }
        if (insights.length === 0) {
            insights.push('📈 Error recovery system is operating normally');
        }
        return insights;
    }
    printInsights() {
        const insights = this.getInsights();
        // eslint-disable-next-line no-console
        console.log('\n💡 ERROR RECOVERY INSIGHTS\n');
        // eslint-disable-next-line no-console
        insights.forEach(insight => console.log(`   ${insight}`));
        // eslint-disable-next-line no-console
        console.log('');
    }
}
exports.ErrorRecoveryDashboard = ErrorRecoveryDashboard;
