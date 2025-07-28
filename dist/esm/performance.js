/**
 * Performance Monitoring System
 *
 * Provides comprehensive performance tracking and analytics for the JsonPlaceholderClient.
 * Tracks response times, cache performance, memory usage, and provides real-time insights.
 */
/**
 * Performance Monitor - Tracks and analyzes API performance
 */
export class PerformanceMonitor {
    constructor(config = {}) {
        this.metrics = [];
        this.trends = [];
        this.listeners = [];
        this.config = {
            enabled: true,
            maxMetrics: 1000,
            alertThresholds: {
                responseTime: 1000, // 1 second
                errorRate: 5, // 5%
                cacheHitRate: 80, // 80%
                memoryUsage: 85 // 85%
            },
            trendInterval: 60000, // 1 minute
            enableMemoryTracking: true,
            enableRealTimeAlerts: true,
            ...config
        };
        this.startTime = Date.now();
        if (this.config.enabled) {
            this.startTrendTracking();
        }
    }
    /**
     * Record a performance metric
     */
    recordMetric(metric) {
        if (!this.config.enabled)
            return;
        // Add metric to collection
        this.metrics.push(metric);
        // Maintain max metrics limit
        if (this.metrics.length > this.config.maxMetrics) {
            this.metrics.shift();
        }
        // Emit metric event
        this.emitEvent({
            type: 'metric',
            timestamp: Date.now(),
            data: metric
        });
        // Check for alerts
        if (this.config.enableRealTimeAlerts) {
            this.checkAlerts(metric);
        }
    }
    /**
     * Get comprehensive performance statistics
     */
    getStats() {
        if (this.metrics.length === 0) {
            return this.getEmptyStats();
        }
        const now = Date.now();
        const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b);
        const successfulRequests = this.metrics.filter(m => m.status >= 200 && m.status < 400);
        const failedRequests = this.metrics.filter(m => m.status >= 400 || m.error);
        const cacheHits = this.metrics.filter(m => m.cacheHit);
        // Calculate percentiles
        const p95Index = Math.floor(durations.length * 0.95);
        const p99Index = Math.floor(durations.length * 0.99);
        const medianIndex = Math.floor(durations.length * 0.5);
        // Calculate cache performance
        const cacheHitDurations = cacheHits.map(m => m.duration);
        const apiHitDurations = this.metrics.filter(m => !m.cacheHit).map(m => m.duration);
        // Calculate throughput
        const timeRange = now - this.startTime;
        const requestsPerSecond = this.metrics.length / (timeRange / 1000);
        const requestsPerMinute = requestsPerSecond * 60;
        const stats = {
            // Response Time Stats
            averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
            medianResponseTime: durations[medianIndex] || 0,
            p95ResponseTime: durations[p95Index] || 0,
            p99ResponseTime: durations[p99Index] || 0,
            minResponseTime: durations[0] || 0,
            maxResponseTime: durations[durations.length - 1] || 0,
            // Request Stats
            totalRequests: this.metrics.length,
            successfulRequests: successfulRequests.length,
            failedRequests: failedRequests.length,
            errorRate: (failedRequests.length / this.metrics.length) * 100,
            // Cache Stats
            cacheHitRate: (cacheHits.length / this.metrics.length) * 100,
            cacheHits: cacheHits.length,
            cacheMisses: this.metrics.length - cacheHits.length,
            averageCacheResponseTime: cacheHitDurations.reduce((a, b) => a + b, 0) / cacheHitDurations.length || 0,
            averageApiResponseTime: apiHitDurations.reduce((a, b) => a + b, 0) / apiHitDurations.length || 0,
            // Throughput Stats
            requestsPerSecond,
            requestsPerMinute,
            // Memory Stats
            memoryUsage: this.config.enableMemoryTracking ? this.getMemoryUsage() : undefined,
            // Time Range
            timeRange: {
                start: this.startTime,
                end: now,
                duration: timeRange
            }
        };
        // Emit stats event
        this.emitEvent({
            type: 'stats',
            timestamp: now,
            data: stats
        });
        return stats;
    }
    /**
     * Get performance trends over time
     */
    getTrends() {
        return [...this.trends];
    }
    /**
     * Get recent metrics
     */
    getRecentMetrics(count = 50) {
        return this.metrics.slice(-count);
    }
    /**
     * Clear all performance data
     */
    clear() {
        this.metrics = [];
        this.trends = [];
        this.startTime = Date.now();
    }
    /**
     * Add performance event listener
     */
    addEventListener(listener) {
        this.listeners.push(listener);
    }
    /**
     * Remove performance event listener
     */
    removeEventListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (enabled && !this.trendInterval) {
            this.startTrendTracking();
        }
        else if (!enabled && this.trendInterval) {
            this.stopTrendTracking();
        }
    }
    /**
     * Update configuration
     */
    updateConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Export performance data for analysis
     */
    exportData() {
        return {
            metrics: [...this.metrics],
            trends: [...this.trends],
            stats: this.getStats(),
            config: { ...this.config }
        };
    }
    /**
     * Import performance data
     */
    importData(data) {
        if (data.metrics) {
            this.metrics = [...data.metrics];
        }
        if (data.trends) {
            this.trends = [...data.trends];
        }
    }
    emitEvent(event) {
        this.listeners.forEach(listener => {
            try {
                listener(event);
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.warn('Performance event listener error:', error);
            }
        });
    }
    startTrendTracking() {
        if (this.trendInterval)
            return;
        this.trendInterval = setInterval(() => {
            const stats = this.getStats();
            const trend = {
                timestamp: Date.now(),
                responseTime: stats.averageResponseTime,
                cacheHitRate: stats.cacheHitRate,
                requestCount: stats.totalRequests,
                errorRate: stats.errorRate
            };
            this.trends.push(trend);
            // Keep only last 100 trend points
            if (this.trends.length > 100) {
                this.trends.shift();
            }
            this.emitEvent({
                type: 'trend',
                timestamp: Date.now(),
                data: trend
            });
        }, this.config.trendInterval);
    }
    stopTrendTracking() {
        if (this.trendInterval) {
            clearInterval(this.trendInterval);
            this.trendInterval = undefined;
        }
    }
    checkAlerts(metric) {
        const stats = this.getStats();
        const alerts = [];
        // High response time alert
        if (metric.duration > this.config.alertThresholds.responseTime) {
            alerts.push({
                type: 'high_response_time',
                severity: metric.duration > this.config.alertThresholds.responseTime * 2 ? 'critical' : 'warning',
                message: `High response time detected: ${metric.duration}ms (threshold: ${this.config.alertThresholds.responseTime}ms)`,
                timestamp: Date.now(),
                value: metric.duration,
                threshold: this.config.alertThresholds.responseTime
            });
        }
        // High error rate alert
        if (stats.errorRate > this.config.alertThresholds.errorRate) {
            alerts.push({
                type: 'high_error_rate',
                severity: stats.errorRate > this.config.alertThresholds.errorRate * 2 ? 'critical' : 'warning',
                message: `High error rate detected: ${stats.errorRate.toFixed(1)}% (threshold: ${this.config.alertThresholds.errorRate}%)`,
                timestamp: Date.now(),
                value: stats.errorRate,
                threshold: this.config.alertThresholds.errorRate
            });
        }
        // Low cache hit rate alert
        if (stats.cacheHitRate < this.config.alertThresholds.cacheHitRate && stats.totalRequests > 10) {
            alerts.push({
                type: 'low_cache_hit_rate',
                severity: stats.cacheHitRate < this.config.alertThresholds.cacheHitRate / 2 ? 'critical' : 'warning',
                message: `Low cache hit rate detected: ${stats.cacheHitRate.toFixed(1)}% (threshold: ${this.config.alertThresholds.cacheHitRate}%)`,
                timestamp: Date.now(),
                value: stats.cacheHitRate,
                threshold: this.config.alertThresholds.cacheHitRate
            });
        }
        // Memory pressure alert
        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage && memoryUsage.percentage > this.config.alertThresholds.memoryUsage) {
            alerts.push({
                type: 'memory_pressure',
                severity: memoryUsage.percentage > this.config.alertThresholds.memoryUsage * 1.1 ? 'critical' : 'warning',
                message: `High memory usage detected: ${memoryUsage.percentage.toFixed(1)}% (threshold: ${this.config.alertThresholds.memoryUsage}%)`,
                timestamp: Date.now(),
                value: memoryUsage.percentage,
                threshold: this.config.alertThresholds.memoryUsage
            });
        }
        // Emit alerts
        alerts.forEach(alert => {
            this.emitEvent({
                type: 'alert',
                timestamp: Date.now(),
                data: alert
            });
        });
    }
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            // Node.js environment
            const usage = process.memoryUsage();
            return {
                used: usage.heapUsed,
                total: usage.heapTotal,
                percentage: (usage.heapUsed / usage.heapTotal) * 100
            };
        }
        else if (typeof performance !== 'undefined' && 'memory' in performance) {
            // Browser environment with performance.memory
            const memory = performance.memory;
            return {
                used: memory.usedJSHeapSize,
                total: memory.totalJSHeapSize,
                percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
            };
        }
        return undefined;
    }
    getEmptyStats() {
        const now = Date.now();
        return {
            averageResponseTime: 0,
            medianResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            errorRate: 0,
            cacheHitRate: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageCacheResponseTime: 0,
            averageApiResponseTime: 0,
            requestsPerSecond: 0,
            requestsPerMinute: 0,
            memoryUsage: this.config.enableMemoryTracking ? this.getMemoryUsage() : undefined,
            timeRange: {
                start: this.startTime,
                end: now,
                duration: now - this.startTime
            }
        };
    }
    /**
     * Cleanup resources
     */
    destroy() {
        this.stopTrendTracking();
        this.listeners = [];
        this.metrics = [];
        this.trends = [];
    }
}
/**
 * Performance Dashboard - Provides real-time performance insights
 */
export class PerformanceDashboard {
    constructor(monitor) {
        this.monitor = monitor;
    }
    /**
     * Get formatted performance report
     */
    getReport() {
        const stats = this.monitor.getStats();
        const trends = this.monitor.getTrends();
        let report = '\n📊 PERFORMANCE DASHBOARD\n';
        report += '═'.repeat(50) + '\n\n';
        // Response Time Section
        report += '⚡ RESPONSE TIME METRICS\n';
        report += `   Average: ${stats.averageResponseTime.toFixed(2)}ms\n`;
        report += `   Median:  ${stats.medianResponseTime.toFixed(2)}ms\n`;
        report += `   P95:     ${stats.p95ResponseTime.toFixed(2)}ms\n`;
        report += `   P99:     ${stats.p99ResponseTime.toFixed(2)}ms\n`;
        report += `   Range:   ${stats.minResponseTime.toFixed(2)}ms - ${stats.maxResponseTime.toFixed(2)}ms\n\n`;
        // Request Stats Section
        report += '📈 REQUEST STATISTICS\n';
        report += `   Total Requests:     ${stats.totalRequests}\n`;
        report += `   Successful:         ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)\n`;
        report += `   Failed:             ${stats.failedRequests} (${stats.errorRate.toFixed(1)}%)\n`;
        report += `   Throughput:         ${stats.requestsPerSecond.toFixed(2)} req/s\n\n`;
        // Cache Performance Section
        report += '🗃️ CACHE PERFORMANCE\n';
        report += `   Hit Rate:           ${stats.cacheHitRate.toFixed(1)}%\n`;
        report += `   Cache Hits:         ${stats.cacheHits}\n`;
        report += `   Cache Misses:       ${stats.cacheMisses}\n`;
        report += `   Cache Avg Time:     ${stats.averageCacheResponseTime.toFixed(2)}ms\n`;
        report += `   API Avg Time:       ${stats.averageApiResponseTime.toFixed(2)}ms\n`;
        if (stats.averageCacheResponseTime > 0 && stats.averageApiResponseTime > 0) {
            const speedup = stats.averageApiResponseTime / stats.averageCacheResponseTime;
            report += `   Cache Speedup:      ${speedup.toFixed(1)}x faster\n`;
        }
        report += '\n';
        // Memory Usage Section
        if (stats.memoryUsage) {
            report += '💾 MEMORY USAGE\n';
            report += `   Used:               ${(stats.memoryUsage.used / 1024 / 1024).toFixed(2)} MB\n`;
            report += `   Total:              ${(stats.memoryUsage.total / 1024 / 1024).toFixed(2)} MB\n`;
            report += `   Usage:              ${stats.memoryUsage.percentage.toFixed(1)}%\n\n`;
        }
        // Time Range Section
        const duration = stats.timeRange.duration / 1000;
        report += '⏱️ TIME RANGE\n';
        report += `   Start:              ${new Date(stats.timeRange.start).toLocaleString()}\n`;
        report += `   Duration:           ${duration.toFixed(1)} seconds\n\n`;
        // Trends Section
        if (trends.length > 1) {
            const latestTrend = trends[trends.length - 1];
            const previousTrend = trends[trends.length - 2];
            report += '📊 RECENT TRENDS\n';
            const responseTimeTrend = latestTrend.responseTime - previousTrend.responseTime;
            const cacheHitTrend = latestTrend.cacheHitRate - previousTrend.cacheHitRate;
            const errorRateTrend = latestTrend.errorRate - previousTrend.errorRate;
            report += `   Response Time:      ${responseTimeTrend >= 0 ? '+' : ''}${responseTimeTrend.toFixed(2)}ms\n`;
            report += `   Cache Hit Rate:     ${cacheHitTrend >= 0 ? '+' : ''}${cacheHitTrend.toFixed(1)}%\n`;
            report += `   Error Rate:         ${errorRateTrend >= 0 ? '+' : ''}${errorRateTrend.toFixed(1)}%\n\n`;
        }
        return report;
    }
    /**
     * Print performance report to console
     */
    printReport() {
        // eslint-disable-next-line no-console
        console.log(this.getReport());
    }
    /**
     * Get performance insights and recommendations
     */
    getInsights() {
        const stats = this.monitor.getStats();
        const insights = [];
        // Response time insights
        if (stats.averageResponseTime > 500) {
            insights.push('⚠️ Average response time is high (>500ms). Consider enabling caching or optimizing API calls.');
        }
        else if (stats.averageResponseTime < 50) {
            insights.push('✅ Excellent response times! Your caching strategy is working well.');
        }
        // Cache hit rate insights
        if (stats.cacheHitRate < 60 && stats.totalRequests > 10) {
            insights.push('⚠️ Low cache hit rate (<60%). Consider adjusting cache TTL or enabling more aggressive caching.');
        }
        else if (stats.cacheHitRate > 80) {
            insights.push('✅ Great cache hit rate! Your caching strategy is optimized.');
        }
        // Error rate insights
        if (stats.errorRate > 5) {
            insights.push('🚨 High error rate (>5%). Check API health and implement better error handling.');
        }
        else if (stats.errorRate === 0 && stats.totalRequests > 20) {
            insights.push('✅ Zero errors! Your error handling and API reliability are excellent.');
        }
        // Throughput insights
        if (stats.requestsPerSecond > 10) {
            insights.push('🚀 High throughput detected. Make sure your caching strategy can handle the load.');
        }
        // Memory insights
        if (stats.memoryUsage && stats.memoryUsage.percentage > 80) {
            insights.push('⚠️ High memory usage (>80%). Consider reducing cache size or clearing old entries.');
        }
        if (insights.length === 0) {
            insights.push('📊 Performance looks good! Keep monitoring for continued optimization.');
        }
        return insights;
    }
    /**
     * Print insights to console
     */
    printInsights() {
        const insights = this.getInsights();
        // eslint-disable-next-line no-console
        console.log('\n💡 PERFORMANCE INSIGHTS\n');
        // eslint-disable-next-line no-console
        insights.forEach(insight => console.log(`   ${insight}`));
        // eslint-disable-next-line no-console
        console.log('');
    }
}
//# sourceMappingURL=performance.js.map