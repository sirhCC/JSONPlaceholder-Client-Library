/**
 * Performance Monitoring System
 *
 * Provides comprehensive performance tracking and analytics for the JsonPlaceholderClient.
 * Tracks response times, cache performance, memory usage, and provides real-time insights.
 */
export interface PerformanceMetric {
    timestamp: number;
    duration: number;
    method: string;
    url: string;
    cacheHit: boolean;
    status: number;
    size?: number;
    error?: string;
}
export interface PerformanceStats {
    averageResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorRate: number;
    cacheHitRate: number;
    cacheHits: number;
    cacheMisses: number;
    averageCacheResponseTime: number;
    averageApiResponseTime: number;
    requestsPerSecond: number;
    requestsPerMinute: number;
    memoryUsage?: {
        used: number;
        total: number;
        percentage: number;
    };
    timeRange: {
        start: number;
        end: number;
        duration: number;
    };
}
export interface PerformanceTrend {
    timestamp: number;
    responseTime: number;
    cacheHitRate: number;
    requestCount: number;
    errorRate: number;
}
export interface PerformanceAlert {
    type: 'high_response_time' | 'high_error_rate' | 'low_cache_hit_rate' | 'memory_pressure';
    severity: 'warning' | 'critical';
    message: string;
    timestamp: number;
    value: number;
    threshold: number;
}
export interface PerformanceConfig {
    enabled: boolean;
    maxMetrics: number;
    alertThresholds: {
        responseTime: number;
        errorRate: number;
        cacheHitRate: number;
        memoryUsage: number;
    };
    trendInterval: number;
    enableMemoryTracking: boolean;
    enableRealTimeAlerts: boolean;
}
export type PerformanceEventType = 'metric' | 'alert' | 'trend' | 'stats';
export interface PerformanceEvent {
    type: PerformanceEventType;
    timestamp: number;
    data: PerformanceMetric | PerformanceAlert | PerformanceTrend | PerformanceStats;
}
export type PerformanceEventListener = (event: PerformanceEvent) => void;
/**
 * Performance Monitor - Tracks and analyzes API performance
 */
export declare class PerformanceMonitor {
    private metrics;
    private trends;
    private config;
    private listeners;
    private trendInterval?;
    private startTime;
    constructor(config?: Partial<PerformanceConfig>);
    /**
     * Record a performance metric
     */
    recordMetric(metric: PerformanceMetric): void;
    /**
     * Get comprehensive performance statistics
     */
    getStats(): PerformanceStats;
    /**
     * Get performance trends over time
     */
    getTrends(): PerformanceTrend[];
    /**
     * Get recent metrics
     */
    getRecentMetrics(count?: number): PerformanceMetric[];
    /**
     * Clear all performance data
     */
    clear(): void;
    /**
     * Add performance event listener
     */
    addEventListener(listener: PerformanceEventListener): void;
    /**
     * Remove performance event listener
     */
    removeEventListener(listener: PerformanceEventListener): void;
    /**
     * Enable/disable monitoring
     */
    setEnabled(enabled: boolean): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<PerformanceConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): PerformanceConfig;
    /**
     * Export performance data for analysis
     */
    exportData(): {
        metrics: PerformanceMetric[];
        trends: PerformanceTrend[];
        stats: PerformanceStats;
        config: PerformanceConfig;
    };
    /**
     * Import performance data
     */
    importData(data: {
        metrics?: PerformanceMetric[];
        trends?: PerformanceTrend[];
    }): void;
    private emitEvent;
    private startTrendTracking;
    private stopTrendTracking;
    private checkAlerts;
    private getMemoryUsage;
    private getEmptyStats;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Performance Dashboard - Provides real-time performance insights
 */
export declare class PerformanceDashboard {
    private monitor;
    constructor(monitor: PerformanceMonitor);
    /**
     * Get formatted performance report
     */
    getReport(): string;
    /**
     * Print performance report to console
     */
    printReport(): void;
    /**
     * Get performance insights and recommendations
     */
    getInsights(): string[];
    /**
     * Print insights to console
     */
    printInsights(): void;
}
//# sourceMappingURL=performance.d.ts.map